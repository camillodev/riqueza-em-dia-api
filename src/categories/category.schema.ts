import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' }),
  }),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
});

export type CreateCategoryDto = z.infer<typeof CategorySchema>;

export const UpdateCategorySchema = CategorySchema.partial();

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

export type CategoryResponse = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}; 