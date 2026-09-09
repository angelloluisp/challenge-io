import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CardAlreadyExistsError,
  CardIssuerError,
  CardRequestNotFoundError,
  InvalidCardRequestError,
} from '@card-domain/index';

interface ErrorResponseBody {
  code: string;
  message: string;
  requestId?: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const requestId = (context.getRequest<{ params?: { requestId?: string } }>().params ?? {})
      .requestId;

    const { status, body } = this.resolve(exception, requestId);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    response.status(status).json(body);
  }

  private resolve(
    exception: unknown,
    requestId?: string,
  ): { status: number; body: ErrorResponseBody } {
    const timestamp = new Date().toISOString();

    if (exception instanceof CardAlreadyExistsError) {
      return {
        status: HttpStatus.CONFLICT,
        body: { code: exception.code, message: exception.message, requestId, timestamp },
      };
    }
    if (exception instanceof CardRequestNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { code: exception.code, message: exception.message, requestId, timestamp },
      };
    }
    if (exception instanceof InvalidCardRequestError || exception instanceof BadRequestException) {
      const message =
        exception instanceof BadRequestException
          ? this.extractHttpMessage(exception)
          : exception.message;
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { code: 'INVALID_CARD_REQUEST', message, requestId, timestamp },
      };
    }
    if (exception instanceof CardIssuerError) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        body: { code: exception.code, message: exception.message, requestId, timestamp },
      };
    }
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: {
          code: 'HTTP_ERROR',
          message: this.extractHttpMessage(exception),
          requestId,
          timestamp,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_ERROR', message: 'Unexpected error', requestId, timestamp },
    };
  }

  private extractHttpMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    const candidate = response as { message?: string | string[] };
    if (Array.isArray(candidate.message)) {
      return candidate.message.join(', ');
    }
    return candidate.message ?? exception.message;
  }
}
