import { setupTestDB, teardownTestDB, clearCollections } from '../setup';
import { BookModel, IBook } from '../../src/models/book.model';

describe('Book Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearCollections();
  });

  describe('Schema Validation', () => {
    it('should create a valid book', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      expect(book).toHaveProperty('_id');
      expect(book.title).toBe('The Great Gatsby');
      expect(book.author).toBe('F. Scott Fitzgerald');
      expect(book.publicationYear).toBe(1925);
      expect(book.genre).toBe('drama');
      expect(book.rating).toBe(8.5);
    });

    it('should require title', async () => {
      const bookData: any = {
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should require author', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should require genre', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should require rating', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should reject invalid genre', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'invalid-genre',
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should validate title length', async () => {
      const bookData: any = {
        title: '',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should validate publication year range', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1400,
        genre: 'drama',
        rating: 8.5,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });

    it('should validate rating range', async () => {
      const bookData: any = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 11,
      };

      await expect(BookModel.create(bookData)).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const book = await BookModel.create({
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'drama',
        rating: 9.0,
      });

      expect(book.createdAt).toBeDefined();
      expect(book.updatedAt).toBeDefined();
      expect(book.createdAt).toBeInstanceOf(Date);
      expect(book.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const book = await BookModel.create({
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'drama',
        rating: 9.0,
      });

      const originalUpdatedAt = book.updatedAt;

      // Wait a bit to ensure timestamp differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await BookModel.findByIdAndUpdate(
        book._id,
        { rating: 9.5 },
        { new: true }
      );

      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Virtual Properties', () => {
    it('should have isClassic virtual property for books published before 2000', async () => {
      const book = await BookModel.create({
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'drama',
        rating: 9.0,
      });

      const doc = book.toObject({ virtuals: true });
      expect((doc as any).isClassic).toBe(true);
    });

    it('should have isClassic = false for modern books', async () => {
      const book = await BookModel.create({
        title: 'The Midnight Library',
        author: 'Matt Haig',
        publicationYear: 2020,
        genre: 'fiction',
        rating: 8.0,
      });

      const doc = book.toObject({ virtuals: true });
      expect((doc as any).isClassic).toBe(false);
    });

    it('should include virtuals in toJSON', async () => {
      const book = await BookModel.create({
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'drama',
        rating: 9.0,
      });

      const json = JSON.parse(JSON.stringify(book));
      expect(json.isClassic).toBe(true);
    });
  });

  describe('Trim Whitespace', () => {
    it('should trim title whitespace', async () => {
      const book = await BookModel.create({
        title: '  The Great Gatsby  ',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      expect(book.title).toBe('The Great Gatsby');
    });

    it('should trim author whitespace', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: '  F. Scott Fitzgerald  ',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      expect(book.author).toBe('F. Scott Fitzgerald');
    });
  });

  describe('Default Values', () => {
    it('should have empty string as default description', async () => {
      const book = await BookModel.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationYear: 1925,
        genre: 'drama',
        rating: 8.5,
      });

      expect(book.description).toBe('');
    });
  });
});
