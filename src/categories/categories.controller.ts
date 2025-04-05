import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategorySchema, UpdateCategorySchema, CategoryResponse } from './category.schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) { }

  @Get()
  async getAllCategories(@Request() req): Promise<CategoryResponse[]> {
    return this.categoriesService.getAllCategories(req.user.id);
  }

  @Post()
  async createCategory(
    @Body(new ZodValidationPipe(CategorySchema)) body,
    @Request() req,
  ): Promise<CategoryResponse> {
    return this.categoriesService.createCategory(body, req.user.id);
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) body,
    @Request() req,
  ): Promise<CategoryResponse> {
    return this.categoriesService.updateCategory(id, body, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    await this.categoriesService.deleteCategory(id, req.user.id);
  }
} 