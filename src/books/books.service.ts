import { Injectable, Inject, ConflictException } from "@nestjs/common";
import { BOOKS_REPOSITORY_TOKEN, IBooksRepository } from "./interfaces/books-repository.interface";
import { CreateBookDto } from "./dto/create-book.dto";
import { Book } from "./entities/book.entity";

@Injectable()
export class BooksService {
  constructor(
    @Inject(BOOKS_REPOSITORY_TOKEN)
    private readonly booksRepository: IBooksRepository,
  ) { }

  async create(createBookDto: CreateBookDto): Promise<Book>{
    const existing = await this.booksRepository.findByIsbn(createBookDto.isbn);
    if (existing) {
      throw new ConflictException(`Book with ISBN "${createBookDto.isbn}" alredy exists`);
    }

    const newBook = new Book({
      id: crypto.randomUUID(),
      title: createBookDto.title,
      author: createBookDto.author,
      isbn: createBookDto.isbn,
      isAvailable: true,
    });

    return this.booksRepository.create(newBook);
  }
}