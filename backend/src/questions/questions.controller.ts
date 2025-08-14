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
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly topicsService: TopicsService, // <-- Inject TopicsService
  ) {}

  @MinimumRole(UserRole.TEACHER)
  @Post()
  create(
    @Body() createQuestionDto: CreateQuestionDto[],
    @Request() req,
  ): Promise<any> {
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

  // --- TOPIC ENDPOINTS ---

  @MinimumRole(UserRole.TEACHER)
  @Post('topics')
  async createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @Request() req,
  ): Promise<any> {
    const createdBy = req.user.fullName || req.user.userId || 'Unknown';
    return this.topicsService.create({ ...createTopicDto, createdBy });
  }

  @Get('topics')
  async findAllTopics(
    @Query('slug') slug?: string,
    @Query('title') title?: string,
  ): Promise<any> {
    return this.topicsService.findAll(slug, title);
  }

  @Get('topics/:id')
  async findOneTopic(@Param('id') id: string): Promise<any> {
    return this.topicsService.findOne(id);
  }

  @MinimumRole(UserRole.TEACHER)
  @Patch('topics/:id')
  async updateTopic(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @Request() req,
  ): Promise<any> {
    const updatedBy = req.user.fullName || req.user.userId || 'Unknown';
    return this.topicsService.update(id, { ...updateTopicDto, updatedBy });
  }

  @MinimumRole(UserRole.ADMIN)
  @Delete('topics/:id')
  async removeTopic(@Param('id') id: string): Promise<any> {
    return this.topicsService.remove(id);
  }
}
