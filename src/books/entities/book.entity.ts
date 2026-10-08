export class Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  isAvailable: boolean;

  constructor(partial: Partial<Book>) {
    Object.assign(this, partial)
  }
}
