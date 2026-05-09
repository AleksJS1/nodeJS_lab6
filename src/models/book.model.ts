import { Schema, model, Document, HydratedDocument, Model } from 'mongoose';

export const bookGenres = [
  'fantasy',
  'sci-fi',
  'non-fiction',
  'fiction',
  'drama',
  'mystery',
] as const;

export interface IBook {
  title: string;
  description?: string;
  author: string;
  publicationYear: number;
  genre: typeof bookGenres[number];
  rating: number;
}

export interface IBookDocument extends IBook, Document {
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title must be at least 1 character long'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: '',
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      minlength: [1, 'Author must be at least 1 character long'],
      maxlength: [100, 'Author must not exceed 100 characters'],
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1450, 'Publication year must be at least 1450'],
      max: [2100, 'Publication year must not exceed 2100'],
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: 'Publication year must be an integer',
      },
    },
    genre: {
      type: String,
      enum: {
        values: bookGenres,
        message: `Genre must be one of: ${bookGenres.join(', ')}`,
      },
      required: [true, 'Genre is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating must be at least 0'],
      max: [10, 'Rating must not exceed 10'],
      validate: {
        validator: (value: number) => value >= 0 && value <= 10,
        message: 'Rating must be between 0 and 10',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property: isClassic (book published before 2000)
bookSchema.virtual('isClassic').get(function (this: IBookDocument) {
  return this.publicationYear < 2000;
});

export const BookModel = model<IBook>('Book', bookSchema) as unknown as Model<IBookDocument>;

export type HydratedBook = HydratedDocument<IBookDocument>;
