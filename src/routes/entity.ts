import { Router, Request, Response, NextFunction } from 'express';
import {
  bookQuerySchema,
  createBookSchema,
  updateBookSchema,
} from '../schemas/entity.schema';
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  getClassicBooks,
  updateBook,
} from '../storage/entity';
import { validate } from '../middleware/validate';
import mongoose from 'mongoose';

const router = Router();

// GET all books with filters, sorting, and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = bookQuerySchema.parse(req.query);
    const result = await getAllBooks(filters);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET classic books (published before 2000) - domain-specific route
router.get('/classics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await getClassicBooks();
    res.status(200).json({
      data: books,
      pagination: {
        page: 1,
        limit: books.length,
        total: books.length,
        totalPages: 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET book by ID
router.get(
  '/:id',
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // Validate ObjectId format before querying
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid book ID format' });
        return;
      }

      const book = await getBookById(req.params.id);

      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }

      res.status(200).json(book);
    } catch (err) {
      next(err);
    }
  }
);

// POST create book
router.post('/', validate(createBookSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await createBook(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PATCH update book
router.patch(
  '/:id',
  validate(updateBookSchema),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // Validate ObjectId format before querying
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid book ID format' });
        return;
      }

      const updated = await updateBook(req.params.id, req.body);

      if (!updated) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE book
router.delete(
  '/:id',
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // Validate ObjectId format before querying
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: 'Invalid book ID format' });
        return;
      }

      const deleted = await deleteBook(req.params.id);

      if (!deleted) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
