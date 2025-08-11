import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '@/config/auth/jwt-auth.guard';
import { RolesGuard } from '@/config/auth/role.guard';
import { MinimumRole, Public } from '@/config/auth/public.decorator';
import { UserRole } from '@/users/entities/user.entity';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @MinimumRole(UserRole.TEACHER)
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto, @Request() req) {
    // Extract user info from JWT token
    const userId = req.user.userId;
    const userName = req.user.fullName || 'Unknown'; // If available in token

    return this.questionsService.create(createQuestionDto, userId, userName);
  }

  @Get()
  findAll(
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: number,
  ) {
    return this.questionsService.findAll(topic, difficulty);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @MinimumRole(UserRole.TEACHER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.questionsService.update(id, updateQuestionDto, userId);
  }

  @MinimumRole(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  // Public endpoint for accessing practice questions
  @Public()
  @Get('practice/random')
  getRandomPracticeQuestions(
    @Query('count') count: number = 5,
    @Query('difficulty') difficulty?: number,
    @Query('topic') topic?: string,
  ) {
    return this.questionsService.getRandomQuestions(count, difficulty, topic);
  }
}
