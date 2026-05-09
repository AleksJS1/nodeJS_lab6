import { BookModel, HydratedBook, IBook } from '../models/book.model';
import { CreateBookInput, UpdateBookInput, BookFilters } from '../schemas/entity.schema';

// Get all books with filtering, sorting, and pagination
export const getAllBooks = async (filters: BookFilters = {}) => {
  const { genre, minYear, q, sort = 'createdAt:-1', page = 1, limit = 10 } = filters;

  // Build filter query
  const query: Record<string, any> = {};

  if (genre) {
    query.genre = genre;
  }

  if (minYear) {
    query.publicationYear = { $gte: minYear };
  }

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
    ];
  }

  // Parse sort parameter (format: "field:direction" or "field" for ascending)
  const sortObj: Record<string, 1 | -1> = {};
  if (sort) {
    const parts = sort.split(':');
    const field = parts[0];
    const direction = parts[1] === '-1' || parts[1] === 'desc' ? -1 : 1;
    sortObj[field] = direction;
  }

  // Calculate pagination
  const skipAmount = (page - 1) * limit;

  // Execute queries in parallel
  const [books, total] = await Promise.all([
    BookModel.find(query).sort(sortObj).skip(skipAmount).limit(limit).lean(),
    BookModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: books as HydratedBook[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

// Get book by ID
export const getBookById = async (id: string): Promise<HydratedBook | null> => {
  try {
    const book = await BookModel.findById(id);
    return book ? (book.toObject({ virtuals: true }) as HydratedBook) : null;
  } catch (err) {
    // Invalid ObjectId format
    return null;
  }
};

// Create book
export const createBook = async (input: CreateBookInput): Promise<HydratedBook> => {
  const book = await BookModel.create(input);
  return book.toObject({ virtuals: true }) as HydratedBook;
};

// Update book
export const updateBook = async (
  id: string,
  patch: UpdateBookInput
): Promise<HydratedBook | null> => {
  try {
    const book = await BookModel.findByIdAndUpdate(
      id,
      patch,
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    return book as HydratedBook | null;
  } catch (err) {
    // Invalid ObjectId or validation error
    throw err;
  }
};

// Delete book
export const deleteBook = async (id: string): Promise<boolean> => {
  try {
    const result = await BookModel.findByIdAndDelete(id);
    return result !== null;
  } catch (err) {
    // Invalid ObjectId format
    return false;
  }
};

// Get classic books (published before 2000) - domain-specific route
export const getClassicBooks = async (): Promise<HydratedBook[]> => {
  const books = await BookModel.find({ publicationYear: { $lt: 2000 } })
    .sort({ publicationYear: 1 })
    .lean();
  return books as HydratedBook[];
};
