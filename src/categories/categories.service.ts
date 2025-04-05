import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponse } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(private categoryRepository: CategoryRepository) { }

  async getAllCategories(userId: string): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAllByUserId(userId);
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type as 'income' | 'expense',
      icon: category.icon,
      color: category.color,
    }));
  }

  async createCategory(data: CreateCategoryDto, userId: string): Promise<CategoryResponse> {
    const category = await this.categoryRepository.create(data, userId);
    return {
      id: category.id,
      name: category.name,
      type: category.type as 'income' | 'expense',
      icon: category.icon,
      color: category.color,
    };
  }

  async updateCategory(id: string, data: UpdateCategoryDto, userId: string): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findById(id, userId);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updatedCategory = await this.categoryRepository.update(id, data, userId);

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      type: updatedCategory.type as 'income' | 'expense',
      icon: updatedCategory.icon,
      color: updatedCategory.color,
    };
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, userId);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.categoryRepository.delete(id, userId);
  }
} 