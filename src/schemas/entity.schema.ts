import { z } from "zod";

export const bookGenres = [
  "fantasy",
  "sci-fi",
  "non-fiction",
  "fiction",
  "drama",
  "mystery",
] as const;

export const createBookSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  author: z.string().min(1).max(100),
  publicationYear: z.number().int().min(1450).max(2100),
  genre: z.enum(bookGenres),
  rating: z.number().min(0).max(10),
});

export const updateBookSchema = createBookSchema.partial();

export const bookQuerySchema = z.object({
  genre: z.enum(bookGenres).optional(),
  minYear: z.coerce.number().int().min(1450).max(2100).optional(),
  q: z.string().min(1).max(100).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookFilters = z.infer<typeof bookQuerySchema>;

export type Book = CreateBookInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
