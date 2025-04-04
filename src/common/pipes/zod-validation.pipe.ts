import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';
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
      this.logger.error(`Validation failed: ${JSON.stringify(error)}`);
      throw error; // Let the global exception filter handle it
    }
  }
} 