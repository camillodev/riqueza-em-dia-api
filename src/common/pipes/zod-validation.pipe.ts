import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '@nestjs/common';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private schema: ZodSchema) { }

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      // Check if we're validating the correct type of data
      if (metadata.type !== 'body' && metadata.type !== 'query' && metadata.type !== 'param') {
        return value;
      }

      // Validate against the schema
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform ZodError into a structured format
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        this.logger.error(`Validation failed: ${JSON.stringify(validationErrors)}`);

        // Throw a BadRequestException with formatted errors
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // For other errors, log and rethrow
      this.logger.error(`Unexpected error during validation: ${error}`);
      throw new BadRequestException('Invalid data provided');
    }
  }
} 