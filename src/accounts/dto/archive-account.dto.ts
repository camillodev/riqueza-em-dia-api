import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ArchiveAccountDto {
  @ApiProperty({ description: 'Is account archived', example: true })
  @IsNotEmpty()
  @IsBoolean()
  isArchived: boolean;
} 