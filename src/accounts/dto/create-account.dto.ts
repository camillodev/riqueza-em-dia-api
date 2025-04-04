import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ description: 'Account name', example: 'Nubank' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Account balance', example: 1000 })
  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @ApiProperty({ description: 'Account color (hex)', example: '#7158e2' })
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiProperty({ description: 'Is account archived', example: false, default: false })
  @IsBoolean()
  isArchived: boolean = false;
} 