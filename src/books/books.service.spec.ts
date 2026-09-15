import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { BooksService } from './books.service'
import { BOOKS_REPOSITORY_TOKEN, IBooksRepository } from './interfaces/books-repository.interface'
import { Book } from './entities/book.entity'
import { title } from 'process'

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<IBooksRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IBooksRepository>> = {
      findByIsbn: jest.fn(),
      create: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: BOOKS_REPOSITORY_TOKEN, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get(BOOKS_REPOSITORY_TOKEN);
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      title: 'Design patterns',
      author: 'Gang of Four',
      isbn: '978-0201633610'
    };
    
    it('should throw ConflictException if book with the same ISBN already exists', async () => {
      const existingBook = new Book({ id: 'book-1', ...dto, isAvailable: true })

      repository.findByIsbn.mockResolvedValue(existingBook);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repository.findByIsbn).toHaveBeenCalledWith(dto.isbn);
      expect(repository.create).not.toHaveBeenCalled();
    })

    it('should create and return a book when ISBN is unique', async () => {
      repository.findByIsbn.mockResolvedValue(null);
      repository.create.mockImplementation(async (book: Book) => book);

      const result = await service.create(dto)

      expect(repository.findByIsbn).toHaveBeenCalledWith(dto.isbn);
      expect(repository.create).toHaveBeenCalledTimes(1);

      expect(result.title).toBe(dto.title);
      expect(result.author).toBe(dto.author);
      expect(result.isbn).toBe(dto.isbn);
      expect(result.isAvailable).toBe(true);
      expect(result.id).toBeDefined();
    })
  })
})