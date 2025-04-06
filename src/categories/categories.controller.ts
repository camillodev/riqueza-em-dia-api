import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CategorySchema, UpdateCategorySchema, CategoryResponse } from './category.schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@clerk/backend';

@Controller('categories')
  @UseGuards(ClerkAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) { }

  @Get()
  async getAllCategories(@CurrentUser() user: User): Promise<CategoryResponse[]> {
    return this.categoriesService.getAllCategories(user.id);
  }

  @Post()
  async createCategory(
    @Body(new ZodValidationPipe(CategorySchema)) body,
    @CurrentUser() user: User,
  ): Promise<CategoryResponse> {
    return this.categoriesService.createCategory(body, user.id);
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) body,
    @CurrentUser() user: User,
  ): Promise<CategoryResponse> {
    return this.categoriesService.updateCategory(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.categoriesService.deleteCategory(id, user.id);
  }
} 