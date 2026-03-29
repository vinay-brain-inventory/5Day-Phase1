import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  dueDate: z.string().date().optional()
});

export const taskPutSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  dueDate: z.string().date().nullable().optional()
});

export const taskPatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(10_000).nullable().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    dueDate: z.string().date().nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  });

