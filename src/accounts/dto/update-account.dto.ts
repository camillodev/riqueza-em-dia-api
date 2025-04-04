import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({ description: 'Account name', example: 'Nubank', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Account balance', example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ description: 'Account color (hex)', example: '#7158e2', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'Is account archived', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
} 