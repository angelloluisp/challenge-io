import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../apps/card-issuer/src/app.module';
import { GlobalExceptionFilter } from '@shared/index';

describe('Card issuance (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function validPayload(documentNumber: string) {
    return {
      customer: {
        documentType: 'DNI',
        documentNumber,
        fullName: 'Jose Perez',
        age: 30,
        email: 'joseperez@example.com',
      },
      product: { type: 'VISA', currency: 'PEN' },
      forceError: false,
    };
  }

  it('accepts a valid card issuance request with 202 and a PENDING status', async () => {
    const response = await request(app.getHttpServer())
      .post('/cards/issue')
      .send(validPayload('11654321'));

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  it('returns 409 when the same document number is submitted twice concurrently', async () => {
    const documentNumber = '22654321';
    const [first, second] = await Promise.allSettled([
      request(app.getHttpServer()).post('/cards/issue').send(validPayload(documentNumber)),
      request(app.getHttpServer()).post('/cards/issue').send(validPayload(documentNumber)),
    ]);

    const statuses = [first, second].map((outcome) =>
      outcome.status === 'fulfilled' ? outcome.value.status : 0,
    );
    expect(statuses).toContain(202);
    expect(statuses).toContain(409);
  });

  it('returns 400 for an invalid document number', async () => {
    const payload = validPayload('123');
    const response = await request(app.getHttpServer()).post('/cards/issue').send(payload);
    expect(response.status).toBe(400);
  });

  it('returns 400 for an invalid email', async () => {
    const payload = validPayload('33654321');
    payload.customer.email = 'not-an-email';
    const response = await request(app.getHttpServer()).post('/cards/issue').send(payload);
    expect(response.status).toBe(400);
  });

  it('returns 400 for an unsupported currency', async () => {
    const payload = validPayload('44654321') as Record<string, unknown>;
    (payload.product as { currency: string }).currency = 'EUR';
    const response = await request(app.getHttpServer()).post('/cards/issue').send(payload);
    expect(response.status).toBe(400);
  });

  it('returns 400 for an unsupported card type', async () => {
    const payload = validPayload('55654321') as Record<string, unknown>;
    (payload.product as { type: string }).type = 'MASTERCARD';
    const response = await request(app.getHttpServer()).post('/cards/issue').send(payload);
    expect(response.status).toBe(400);
  });

  it('returns 400 when unexpected properties are sent', async () => {
    const payload = validPayload('66654321') as Record<string, unknown>;
    payload.extraField = 'not-allowed';
    const response = await request(app.getHttpServer()).post('/cards/issue').send(payload);
    expect(response.status).toBe(400);
  });

  it('returns 404 for a non-existent requestId', async () => {
    const response = await request(app.getHttpServer()).get(
      '/card-requests/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(404);
  });
});
