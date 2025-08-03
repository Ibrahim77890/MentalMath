import { Injectable } from '@nestjs/common';
import { CreateQuestionSessionDto } from './dto/create-question-session.dto';
import { UpdateQuestionSessionDto } from './dto/update-question-session.dto';

@Injectable()
export class QuestionSessionsService {
  create(createQuestionSessionDto: CreateQuestionSessionDto) {
    return 'This action adds a new questionSession';
  }

  findAll() {
    return `This action returns all questionSessions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} questionSession`;
  }

  update(id: number, updateQuestionSessionDto: UpdateQuestionSessionDto) {
    return `This action updates a #${id} questionSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} questionSession`;
  }
}
