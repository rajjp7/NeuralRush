import {z} from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z.string().min(3, 'Username must be at least 3 characters long').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
})