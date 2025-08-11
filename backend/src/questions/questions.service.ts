import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionDocument } from './entities/question.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    userId: string,
    userName?: string,
  ) {
    const newQuestion = new this.questionModel({
      ...createQuestionDto,
      addedById: userId,
      addedByName: userName || 'Unknown',
    });
    return await newQuestion.save();
  }

  async findAll(topic?: string, difficulty?: number) {
    const query = {};

    if (topic) {
      query['topic'] = topic;
    }

    if (difficulty) {
      query['difficulty'] = difficulty;
    }

    return await this.questionModel.find(query).exec();
  }

  async findOne(id: string) {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
    userId: string,
  ) {
    // Optionally track who modified the question
    const updates = {
      ...updateQuestionDto,
      lastModifiedById: userId,
    };

    const question = await this.questionModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async remove(id: string) {
    const question = await this.questionModel.findByIdAndDelete(id).exec();
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return { deleted: true, id };
  }

  async getRandomQuestions(
    count: number = 5,
    difficulty?: number,
    topic?: string,
  ) {
    const query = {};

    if (topic) {
      query['topic'] = topic;
    }

    if (difficulty) {
      query['difficulty'] = difficulty;
    }

    // Get random questions using MongoDB's aggregation
    return await this.questionModel
      .aggregate([{ $match: query }, { $sample: { size: count } }])
      .exec();
  }
}
