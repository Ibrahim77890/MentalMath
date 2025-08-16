import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionSessionDto } from './dto/create-question-session.dto';
import { UpdateQuestionSessionDto } from './dto/update-question-session.dto';
import { QuestionSession } from './entities/question-session.entity';

@Injectable()
export class QuestionSessionsService {
  constructor(
    @InjectRepository(QuestionSession)
    private readonly questionSessionRepository: Repository<QuestionSession>,
  ) {}

  async create(createQuestionSessionDto: CreateQuestionSessionDto) {
    const questionSession = this.questionSessionRepository.create(
      createQuestionSessionDto,
    );
    return await this.questionSessionRepository.save(questionSession);
  }

  async findAll() {
    return await this.questionSessionRepository.find();
  }

  async findOne(id: string) {
    const questionSession = await this.questionSessionRepository.findOne({
      where: { id },
    });
    if (!questionSession) {
      throw new NotFoundException(`QuestionSession with id ${id} not found`);
    }
    return questionSession;
  }

  async update(id: string, updateQuestionSessionDto: UpdateQuestionSessionDto) {
    const questionSession = await this.findOne(id);
    Object.assign(questionSession, updateQuestionSessionDto);
    return await this.questionSessionRepository.save(questionSession);
  }

  async remove(id: string) {
    const questionSession = await this.findOne(id);
    await this.questionSessionRepository.remove(questionSession);
    return { deleted: true, id };
  }
}
