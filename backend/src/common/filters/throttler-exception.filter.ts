import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many requests. Please wait a moment and try again.',
      error: 'Too Many Requests',
    });
  }
}
