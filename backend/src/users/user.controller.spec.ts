import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-uuid-1',
    fullName: 'John Doe',
    age: 30,
    email: 'john@example.com',
    password: 'hashedpassword',
    topicsHistory: [],
  };

  const mockUserDto = {
    fullName: 'John Doe',
    age: 30,
    email: 'john@example.com',
    password: 'password123',
  };

  const mockUserResponse = {
    id: 'user-uuid-1',
    fullName: 'John Doe',
    age: 30,
    email: 'john@example.com',
    topicsHistory: [],
  };

  const mockLoginDto = {
    email: 'john@example.com',
    password: 'password123',
  };

  const mockLoginResponse = {
    accessToken: 'jwt-token',
    user: {
      id: 'user-uuid-1',
      email: 'john@example.com',
      fullName: 'John Doe',
    },
  };

  const mockUsersService = {
    create: jest.fn(),
    login: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(mockUserDto);

      expect(service.create).toHaveBeenCalledWith(mockUserDto);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.create(mockUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      mockUsersService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockLoginDto);

      expect(service.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.login.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.login({ ...mockLoginDto, email: 'nonexistent@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ ...mockLoginDto, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUserResponse,
        { ...mockUserResponse, id: 'user-uuid-2', email: 'jane@example.com' },
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a single user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User with ID 999 not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = { age: 31 };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUserResponse, age: 31 };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User with ID 999 not found'),
      );

      await expect(controller.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(mockUserResponse);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User with ID 999 not found'),
      );

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
