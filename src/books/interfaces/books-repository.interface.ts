import { Book } from "../entities/book.entity";

export interface IBooksRepository {
  create(book: Book): Promise<Book>;
  findById(id: string): Promise<Book | null>;
  findByIsbn(isbn: string): Promise<Book | null>;
  findAll(): Promise<Book[]>;
  update(id: string, updates: Partial<Book>): Promise<Book | null>;
  delete(id: string): Promise<boolean>;
}

export const BOOKS_REPOSITORY_TOKEN = Symbol('BOOKS_REPOSITORY_TOKEN');