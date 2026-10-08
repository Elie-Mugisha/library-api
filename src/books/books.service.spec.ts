import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
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
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn()
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

  describe('findById', () => {
    const bookId = 'target-book-id';

    it('should throw NotFoundException when repository returns null', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(bookId)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(bookId);
    });

    it('should return the found book when repository finds it', async () => {
      const expectedBook = new Book({
        id: bookId,
        title: 'Refactoring',
        author: 'Martin Fowler',
        isbn: '978-0201485677',
        isAvailable: true
      });
      repository.findById.mockResolvedValue(expectedBook);

      const result = await service.findById(bookId);

      expect(repository.findById).toHaveBeenCalledWith(bookId);
      expect(result).toEqual(expectedBook);
    })
  })

  describe('checkoutBook', () => {
    const bookId = 'target-book-id';

    it('should throw ConflictException if book is already checked out', async () => {
      const unavailableBook = new Book({
        id: bookId,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        isAvailable: false,
      });
      repository.findById.mockResolvedValue(unavailableBook);

      await expect(service.checkoutBook(bookId)).rejects.toThrow(ConflictException)
      expect(repository.findById).toHaveBeenCalledWith(bookId);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should update availability to false and return updated book when available', async () => {
      const availableBook = new Book({
        id: bookId,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        isAvailable: true,
      })
      const updatedBook = new Book({ ...availableBook, isAvailable: false });

      repository.findById.mockResolvedValue(availableBook);
      repository.update.mockResolvedValue(updatedBook);

      const result = await service.checkoutBook(bookId);

      expect(repository.findById).toHaveBeenCalledWith(bookId);
      expect(repository.update).toHaveBeenCalledWith(bookId, { isAvailable: false });
      expect(result.isAvailable).toBe(false);
    })
  })

  describe('returnBook', () => {
    const bookId = 'target-book'

    it('should find the book and update availability if the book is returned', async () => {
      const borrowedBook = new Book({
        id: bookId,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        isAvailable: false,
      })

      const updatedBook = { ...borrowedBook, isAvailable: true };

      repository.findById.mockResolvedValue(borrowedBook);
      repository.update.mockResolvedValue(updatedBook);

      await expect(service.returnBook(bookId)).resolves.toBe(updatedBook);
      expect(repository.findById).toHaveBeenCalledWith(bookId);
      expect(repository.update).toHaveBeenCalled()
      
      
    })
    
    it('should throw a ConflictException if the book being returned is already available', async () => {
      const availableBook = new Book({
        id: bookId,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        isAvailable: true,
      })

      repository.findById.mockResolvedValue(availableBook)

      await expect(service.returnBook(bookId)).rejects.toThrow(ConflictException)
      expect(repository.findById).toHaveBeenCalledWith(bookId);
      expect(repository.update).not.toHaveBeenCalled();
    })

  })

  describe('findByIsbn', () => {
    const isbn = '978-0132350884'
    
    it('should find a book by its isbn', async () => {
      const existingBook = new Book({
        id: 'target-book',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn,
        isAvailable: true,
      })
      repository.findByIsbn.mockResolvedValue(existingBook);

      const result = await service.findByIsbn(isbn);
      expect(result).toEqual(existingBook);
      expect(repository.findByIsbn).toHaveBeenCalledWith(isbn);
    })

    it('should throw NotFoundException if the book with the isbn is not found', async () => {
      repository.findByIsbn.mockResolvedValue(null);
      await expect(service.findByIsbn(isbn)).rejects.toThrow(NotFoundException);
    })
  })

  describe('findAll', () => {
    it('should return an array of Boks', async () => {
      const books: Book[] = [
        {
          id: 'target-book',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          isAvailable: true,
        }
      ];
      
      repository.findAll.mockResolvedValue(books)
      const result = await service.findAll();
      expect(result).toEqual(books)
      expect(repository.findAll).toHaveBeenCalledTimes(1)
    })
  })
  
})