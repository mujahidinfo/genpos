import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@genpos/db';
import type { Response } from 'express';

const PRISMA_ERRORS: Record<string, [number, string]> = {
  P2025: [HttpStatus.NOT_FOUND, 'Resource not found'],
  P2002: [HttpStatus.CONFLICT, 'Resource already exists'],
  P2003: [HttpStatus.BAD_REQUEST, 'Operation conflicts with related records'],
};

/** Maps common Prisma errors to proper HTTP responses instead of 500s. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = PRISMA_ERRORS[exception.code];
    if (!mapped) this.logger.error(exception);

    const [statusCode, message] = mapped ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
    ];
    response.status(statusCode).json({ statusCode, message });
  }
}
