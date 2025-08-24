import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user with email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Create new user with hashed password
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      topicsHistory: [],
    });

    // Save the user
    const savedUser = await this.usersRepository.save(user);

    // Remove password from response
    const { password, ...result } = savedUser;

    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    // Find user by email
    const user = await this.usersRepository.findOne({
      where: { email: loginUserDto.email },
    });

    // If user doesn't exist or password doesn't match
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role, // Include role in JWT payload
    };

    const returningPayload = {
      success: true,
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role, // Include role in response
        },
      },
    };

    return returningPayload;
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findMe(userPayload: any) {
    const user = await this.usersRepository.findOne({
      where: { id: userPayload.sub },
    });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    // Remove password from response
    const { password, ...result } = user;
    return result;
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id: String(id) },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // If updating password, hash it
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}
