import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuestionSessionsService } from './question-sessions.service';
import { CreateQuestionSessionDto } from './dto/create-question-session.dto';
import { UpdateQuestionSessionDto } from './dto/update-question-session.dto';

@Controller('question-sessions')
export class QuestionSessionsController {
  constructor(
    private readonly questionSessionsService: QuestionSessionsService,
  ) {}

  @Post()
  create(@Body() createQuestionSessionDto: CreateQuestionSessionDto) {
    return this.questionSessionsService.create(createQuestionSessionDto);
  }

  @Get()
  findAll() {
    return this.questionSessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionSessionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuestionSessionDto: UpdateQuestionSessionDto,
  ) {
    return this.questionSessionsService.update(id, updateQuestionSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionSessionsService.remove(id);
  }
}
