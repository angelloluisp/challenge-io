import { Params } from 'nestjs-pino';

export function buildPinoLoggerParams(serviceName: string): Params {
  return {
    pinoHttp: {
      name: serviceName,
      level: process.env.LOG_LEVEL ?? 'info',
      redact: ['req.headers.authorization'],
      genReqId: (req) => (req.headers['x-request-id'] as string) ?? undefined,
      customProps: () => ({ service: serviceName }),
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: true } },
    },
  };
}
