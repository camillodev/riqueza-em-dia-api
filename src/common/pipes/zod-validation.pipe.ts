import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '@nestjs/common';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private schema: ZodSchema) { }

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      // Log input for debugging
      this.logger.debug(`Validating ${metadata.type} data: ${JSON.stringify(value)}`);

      // Check if we're validating the correct type of data
      if (metadata.type !== 'body' && metadata.type !== 'query' && metadata.type !== 'param') {
        return value;
      }

      // Handle empty objects for query parameters
      if (metadata.type === 'query' && (value === null || value === undefined || Object.keys(value).length === 0)) {
        this.logger.debug('Empty query parameters, returning default values');
        return this.schema.parse({});
      }

      // Validate against the schema
      const result = this.schema.parse(value);
      this.logger.debug(`Validation successful: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform ZodError into a structured format
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        this.logger.error(`Validation failed for ${metadata.type}: ${JSON.stringify(validationErrors)}`);
        this.logger.debug(`Input data was: ${JSON.stringify(value)}`);

        // Throw a BadRequestException with formatted errors
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      // For other errors, log and rethrow
      this.logger.error(`Unexpected error during validation: ${error.message}`);
      this.logger.debug(`Input data was: ${JSON.stringify(value)}`);
      throw new BadRequestException(`Invalid data provided: ${error.message}`);
    }
  }
} 