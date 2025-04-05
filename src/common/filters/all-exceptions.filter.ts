import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    // Log the exception for debugging
    this.logger.error(`Exception: ${exception}`);
    this.logger.error(`Stack: ${(exception as any)?.stack || 'No stack trace'}`);

    // Handle BadRequestException with validation errors specifically
    if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      error = 'Bad Request';

      // Extract response data
      const responseData = exception.getResponse() as any;

      // Check if this is from our ZodValidationPipe
      if (responseData && typeof responseData === 'object' && responseData.errors) {
        message = responseData.message || 'Validation failed';
        details = responseData.errors;
      } else if (responseData && typeof responseData === 'object' && Array.isArray(responseData.message)) {
        // Handle class-validator errors (array of validation errors)
        message = 'Validation failed';
        details = responseData.message.map((msg: string) => ({
          message: msg
        }));
      } else {
        // Default BadRequestException handling
        message = typeof responseData === 'object'
          ? responseData.message || exception.message
          : responseData || exception.message;
      }
    }
    // Handle other HttpExceptions (NestJS built-in)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'object'
        ? (errorResponse as any).message || exception.message
        : errorResponse || exception.message;
      error = exception.name;
    }
    // Handle Zod validation errors
    else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error';
      error = 'Bad Request';
      details = exception.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    }
    // Handle Prisma errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database error';
      error = 'Bad Request';

      // Customize messages for specific Prisma error codes
      switch (exception.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          details = exception.meta?.target
            ? { fields: exception.meta.target }
            : null;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'Not Found';
          break;
        default:
          message = `Database error: ${exception.code}`;
      }
    }

    // Avoid exposing internal errors in production
    if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      details = null;
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
} 