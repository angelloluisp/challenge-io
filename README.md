# Card Issuer Challenge

Sistema de emisión de tarjetas para nuevos clientes mediante arquitectura orientada a eventos, construido como monorepo NestJS con dos servicios independientes (`card-issuer` y `card-processor`) comunicados a través de Kafka.

## Arquitectura

```
                       HTTP POST /cards/issue
                              |
                              v
                     +-----------------+
                     |   card-issuer    |
                     |------------------|
                     | Controller       |
                     | IssueCardUseCase |
                     | Outbox (Prisma)  |----> outbox_events (PENDING)
                     +-----------------+
                              |
                     OutboxPublisher (poll)
                              v
                   Kafka: io.card.requested.v1
                              |
                              v
                     +-------------------+
                     |  card-processor    |
                     |-------------------|
                     | Kafka Consumer     |
                     | Idempotency check  |
                     | ProcessCardRequest |
                     | RetryPolicy(1,2,4s)|
                     | Simulated Issuer   |
                     +-------------------+
                        |            |
                 success|            |exhausted retries
                        v            v
        io.cards.issued.v1   io.card.requested.v1.dlq
```

Cada módulo interno respeta arquitectura hexagonal:

```
infrastructure -> application -> domain
```

El dominio (`libs/card-domain`) no depende de NestJS, Prisma ni KafkaJS.

## Decisiones técnicas

- **PostgreSQL**: transacciones ACID necesarias para el patrón Transactional Outbox y para garantizar la unicidad de `documentNumber` mediante un constraint `UNIQUE`, evitando condiciones de carrera imposibles de resolver de forma segura con un `SELECT -> IF -> INSERT`.
- **Kafka**: desacopla `card-issuer` de `card-processor`, habilita reprocesamiento y contratos de eventos versionados (`io.card.requested.v1`, etc.).
- **Transactional Outbox**: `card-issuer` inserta `CardRequest` y `OutboxEvent` en una sola transacción, eliminando el riesgo de "DB OK, Kafka FAIL". Un `OutboxPublisherService` hace polling controlado (intervalo configurable) y publica los eventos pendientes, marcándolos `PUBLISHED` tras el envío exitoso.
- **Idempotencia**: Kafka se asume *at-least-once*. La tabla `processed_events` con constraint único `(eventId, eventSource)` evita reprocesar un evento redeliverado. Como segunda barrera, el `CardRequest.status` se valida antes de reprocesar.
- **Retry Strategy**: `RetryPolicy` desacoplado de NestJS/Kafka, con delays fijos de 1s/2s/4s y máximo 3 reintentos (4 intentos totales). Recibe un `Sleeper` inyectado para permitir pruebas unitarias instantáneas (`ImmediateSleeper`) sin esperar tiempos reales.
- **DLQ**: al agotar los reintentos se publica en `io.card.requested.v1.dlq` con el error, los intentos realizados y el payload original para trazabilidad.
- **Seguridad**: Helmet, `@nestjs/throttler` en `POST /cards/issue`, `ValidationPipe` estricto (`whitelist`, `forbidNonWhitelisted`, `transform`), CORS configurable por entorno, `GlobalExceptionFilter` que nunca expone stack traces y enmascara datos sensibles en logs (`maskDocumentNumber`, `maskEmail`). El CVV nunca se persiste.
- **Observabilidad**: logging estructurado con Pino (`nestjs-pino`), métricas Prometheus vía `prom-client` (sin labels de alta cardinalidad como `requestId`), health checks con `@nestjs/terminus` (`/health`, `/health/liveness`, `/health/readiness`).
- **Pruebas**: unitarias (casos de uso, `RetryPolicy`, simulador), e2e con Supertest cubriendo los 5 escenarios exigidos.

### Por qué NO se usó Saga, CQRS o Event Sourcing

El alcance del reto no involucra una transacción distribuida que requiera compensación (no hay múltiples servicios modificando estado de forma coordinada más allá del flujo lineal issuer -> processor), por lo que una Saga añadiría complejidad sin beneficio real. CQRS completo y Event Sourcing tampoco aportan valor: el modelo de lectura/escritura es simple y el historial de eventos no es un requisito de negocio.

### Mejoras futuras

- **Circuit Breaker** delante del `CardIssuerPort` para evitar seguir intentando contra un proveedor externo caído.
- **Retry topics** de Kafka (offset-delay topics) en vez de reintentos in-process, para escalar horizontalmente sin bloquear el consumer.
- Particionado explícito por `documentNumber` para garantizar ordering estricto por cliente.

## Requisitos

- Node.js >= 20
- Docker y Docker Compose

## Variables de entorno

Ver [.env.example](.env.example). Copiar a `.env` antes de levantar el proyecto:

```powershell
cp .env.example .env
```

## Cómo levantar el proyecto

```powershell
docker compose up --build
```

Esto levanta PostgreSQL, Kafka (modo KRaft, sin Zookeeper), crea los topics necesarios, ejecuta las migraciones de Prisma y arranca `card-issuer` (puerto 3000) y `card-processor` (puerto 3001).

## Cómo ejecutar migraciones manualmente

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Probar el endpoint

```powershell
curl -X POST http://localhost:3000/cards/issue `
  -H "Content-Type: application/json" `
  -d '{"customer":{"documentType":"DNI","documentNumber":"11654321","fullName":"Jose Perez","age":30,"email":"joseperez@example.com"},"product":{"type":"VISA","currency":"PEN"},"forceError":false}'
```

Respuesta esperada (202 Accepted):

```json
{ "requestId": "b3f1c2f0-...", "status": "PENDING" }
```

Consultar estado:

```powershell
curl http://localhost:3000/card-requests/<requestId>
```

Para forzar el escenario DLQ, enviar `"forceError": true` en el payload.

## Swagger

http://localhost:3000/api/docs

También disponible como archivo estático en [docs/openapi.yaml](docs/openapi.yaml).

## Métricas y health

- http://localhost:3000/metrics
- http://localhost:3000/health
- http://localhost:3000/health/liveness
- http://localhost:3000/health/readiness

## Kafka topics

| Topic | Descripción |
|---|---|
| `io.card.requested.v1` | Solicitud de emisión publicada por card-issuer |
| `io.cards.issued.v1` | Tarjeta emitida exitosamente |
| `io.card.requested.v1.dlq` | Solicitud fallida tras agotar reintentos |

## Ejecutar tests

```powershell
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:cov
```

Los tests de integración y e2e requieren PostgreSQL y Kafka disponibles (`docker compose up postgres kafka kafka-topics-init`).

## Trade-offs y asunciones

- El evento de éxito (`io.cards.issued.v1`) y el de DLQ se publican directamente desde `card-processor` (no vía outbox) porque el requisito de consistencia fuerte se concentra en el flujo de ingestión inicial (`card-issuer`); documentar esto como simplificación pragmática.
- La tasa de fallo aleatorio del simulador es del 30% para poder observar reintentos en ejecuciones normales sin necesidad de `forceError`.
- Se asume que un `requestId` inexistente o un `CardRequest` no encontrado durante el procesamiento no debe reintentarse indefinidamente; el evento se marca como procesado y se descarta con un log de advertencia.
