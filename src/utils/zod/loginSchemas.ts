import { z } from 'zod';

export const loginSchema = z.object({
    email_or_username: z.string().min(1, "Email or username is required"),
    password: z.string().min(1, "Password is required"),
    remember_me: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;