import request from 'supertest';
import app from '../../src/app';
import { setupTestDB, teardownTestDB, clearCollections } from '../setup';
import { BookModel } from '../../src/models/book.model';
import mongoose from 'mongoose';

describe('Books API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearCollections();
  });

  describe('GET /api/books', () => {
    it('should return empty list when no books exist', async () => {
      const res = await request(app).get('/api/books');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return all books with default pagination', async () => {
      await BookModel.create([
        {
          title: 'Book 1',
          author: 'Author 1',
          publicationYear: 2000,
          genre: 'fantasy',
          rating: 8.0,
        },
        {
          title: 'Book 2',
          author: 'Author 2',
          publicationYear: 2010,
          genre: 'sci-fi',
          rating: 7.5,
        },
      ]);

      const res = await request(app).get('/api/books');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.totalPages).toBe(1);
    });

    it('should filter books by genre', async () => {
      await BookModel.create([
        {
          title: 'Fantasy Book',
          author: 'Author 1',
          publicationYear: 2000,
          genre: 'fantasy',
          rating: 8.0,
        },
        {
          title: 'Sci-Fi Book',
          author: 'Author 2',
          publicationYear: 2010,
          genre: 'sci-fi',
          rating: 7.5,
        },
      ]);

      const res = await request(app).get('/api/books?genre=fantasy');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].genre).toBe('fantasy');
    });

    it('should filter books by minimum publication year', async () => {
      await BookModel.create([
        {
          title: 'Old Book',
          author: 'Author 1',
          publicationYear: 1950,
          genre: 'drama',
          rating: 8.0,
        },
        {
          title: 'New Book',
          author: 'Author 2',
          publicationYear: 2020,
          genre: 'fantasy',
          rating: 7.5,
        },
      ]);

      const res = await request(app).get('/api/books?minYear=2000');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].publicationYear).toBe(2020);
    });

    it('should search books by title (case-insensitive)', async () => {
      await BookModel.create([
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          publicationYear: 1925,
          genre: 'drama',
          rating: 8.5,
        },
        {
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          publicationYear: 1960,
          genre: 'drama',
          rating: 8.3,
        },
      ]);

      const res = await request(app).get('/api/books?q=gatsby');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toContain('Gatsby');
    });

    it('should search books by author (case-insensitive)', async () => {
      await BookModel.create([
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          publicationYear: 1925,
          genre: 'drama',
          rating: 8.5,
        },
        {
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          publicationYear: 1960,
          genre: 'drama',
          rating: 8.3,
        },
      ]);

      const res = await request(app).get('/api/books?q=scott');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].author).toContain('Scott');
    });

    it('should combine multiple filters', async () => {
      await BookModel.create([
        {
          title: 'Old Fantasy',
          author: 'Author 1',
          publicationYear: 1980,
          genre: 'fantasy',
          rating: 8.0,
        },
        {
          title: 'New Fantasy',
          author: 'Author 2',
          publicationYear: 2020,
          genre: 'fantasy',
          rating: 8.5,
        },
        {
          title: 'New Drama',
          author: 'Author 3',
          publicationYear: 2020,
          genre: 'drama',
          rating: 7.5,
        },
      ]);

      const res = await request(app).get(
        '/api/books?genre=fantasy&minYear=2000'
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('New Fantasy');
    });

    it('should sort books ascending by publication year', async () => {
      await BookModel.create([
        {
          title: 'Book 2020',
          author: 'Author 1',
          publicationYear: 2020,
          genre: 'fantasy',
          rating: 8.0,
        },
        {
          title: 'Book 1950',
          author: 'Author 2',
          publicationYear: 1950,
          genre: 'fantasy',
          rating: 8.0,
        },
      ]);

      const res = await request(app).get(
        '/api/books?sort=publicationYear:1'
      );

      expect(res.status).toBe(200);
      expect(res.body.data[0].publicationYear).toBe(1950);
      expect(res.body.data[1].publicationYear).toBe(2020);
    });

    it('should sort books descending by publication year', async () => {
      await BookModel.create([
        {
          title: 'Book 1950',
          author: 'Author 1',
          publicationYear: 1950,
          genre: 'fantasy',
          rating: 8.0,
        },
        {
          title: 'Book 2020',
          author: 'Author 2',
          publicationYear: 2020,
          genre: 'fantasy',
          rating: 8.0,
        },
      ]);

      const res = await request(app).get(
        '/api/books?sort=publicationYear:-1'
      );

      expect(res.status).toBe(200);
      expect(res.body.data[0].publicationYear).toBe(2020);
      expect(res.body.data[1].publicationYear).toBe(1950);
    });

    it('should paginate books with custom limit', async () => {
      const books = Array.from({ length: 25 }, (_, i) => ({
        title: `Book ${i + 1}`,
        author: `Author ${i + 1}`,
        publicationYear: 2000 + i,
        genre: 'fantasy' as const,
        rating: 8.0,
      }));

      await BookModel.create(books);

      const res = await request(app).get('/api/books?limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.pagination.total).toBe(25);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it('should paginate books with custom page', async () => {
      const books = Array.from({ length: 25 }, (_, i) => ({
        title: `Book ${i + 1}`,
        author: `Author ${i + 1}`,
        publicationYear: 2000 + i,
        genre: 'fantasy' as const,
        rating: 8.0,
      }));

      await BookModel.create(books);

      const res = await request(app).get(
        '/api/books?limit=10&page=2'
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/books/classics', () => {
    it('should return all books published before 2000', async () => {
      await BookModel.create([
        {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'drama',
          rating: 9.0,
        },
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          publicationYear: 1925,
          genre: 'drama',
          rating: 8.5,
        },
        {
          title: 'Modern Book',
          author: 'Modern Author',
          publicationYear: 2020,
          genre: 'fantasy',
          rating: 8.0,
        },
      ]);

      const res = await request(app).get('/api/books/classics');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].publicationYear).toBeLessThan(2000);
      expect(res.body.data[1].publicationYear).toBeLessThan(2000);
    });

    it('should sort classic books by publication year ascending', async () => {
      await BookModel.create([
        {
          title: 'Book 1949',
          author: 'Author 1',
          publicationYear: 1949,
          genre: 'drama',
          rating: 8.0,
        },
        {
          title: 'Book 1925',
          author: 'Author 2',
          publicationYear: 1925,
          genre: 'drama',
          rating: 8.0,
        },
      ]);

      const res = await request(app).get('/api/books/classics');

      expect(res.status).toBe(200);
      expect(res.body.data[0].publicationYear).toBe(1925);
      expect(res.body.data[1].publicationYear).toBe(1949);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return book by valid ID', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      const res = await request(app).get(`/api/books/${book._id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('The Great Gatsby');
      expect(res.body.author).toBe('F. Scott Fitzgerald');
    });

    it('should return 404 for non-existent book', async () => {
      const validObjectId = new mongoose.Types.ObjectId();

      const res = await request(app).get(`/api/books/${validObjectId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/books/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });

    it('should include virtual properties in response', async () => {
      const book = await BookModel.create({
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'drama',
        rating: 9.0,
      });

      const res = await request(app).get(`/api/books/${book._id}`);

      expect(res.status).toBe(200);
      expect(res.body.isClassic).toBe(true);
    });
  });

  describe('POST /api/books', () => {
    it('should create a book with valid data', async () => {
      const newBook = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      const res = await request(app)
        .post('/api/books')
        .send(newBook);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe(newBook.title);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidBook = {
        title: 'The Great Gatsby',
        // missing author
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      const res = await request(app)
        .post('/api/books')
        .send(invalidBook);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation');
    });

    it('should validate genre enum', async () => {
      const invalidBook = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'invalid-genre',
        rating: 8.5,
      };

      const res = await request(app)
        .post('/api/books')
        .send(invalidBook);

      expect(res.status).toBe(400);
    });

    it('should reject invalid rating', async () => {
      const invalidBook = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 11,
      };

      const res = await request(app)
        .post('/api/books')
        .send(invalidBook);

      expect(res.status).toBe(400);
    });

    it('should allow optional description', async () => {
      const newBook = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
        description: 'A classic American novel',
      };

      const res = await request(app)
        .post('/api/books')
        .send(newBook);

      expect(res.status).toBe(201);
      expect(res.body.description).toBe(newBook.description);
    });
  });

  describe('PATCH /api/books/:id', () => {
    it('should update a book with valid data', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      const res = await request(app)
        .patch(`/api/books/${book._id}`)
        .send({ rating: 9.0 });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(9.0);
      expect(res.body.title).toBe('The Great Gatsby');
    });

    it('should return 404 for non-existent book', async () => {
      const validObjectId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/books/${validObjectId}`)
        .send({ rating: 9.0 });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .patch('/api/books/invalid-id')
        .send({ rating: 9.0 });

      expect(res.status).toBe(400);
    });

    it('should validate update data', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      const res = await request(app)
        .patch(`/api/books/${book._id}`)
        .send({ genre: 'invalid-genre' });

      expect(res.status).toBe(400);
    });

    it('should allow partial updates', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      const res = await request(app)
        .patch(`/api/books/${book._id}`)
        .send({ title: 'Gatsby' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Gatsby');
      expect(res.body.author).toBe('F. Scott Fitzgerald');
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete a book', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      const res = await request(app).delete(`/api/books/${book._id}`);

      expect(res.status).toBe(204);

      const deleted = await BookModel.findById(book._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent book', async () => {
      const validObjectId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(
        `/api/books/${validObjectId}`
      );

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).delete('/api/books/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('should handle MongoDB validation errors', async () => {
      const invalidBook = {
        title: '',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      const res = await request(app)
        .post('/api/books')
        .send(invalidBook);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation');
    });
  });
});
