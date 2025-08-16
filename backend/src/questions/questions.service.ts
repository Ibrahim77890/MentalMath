import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionDocument } from './entities/question.entity';
import { Topic, TopicDocument } from './entities/topic.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto[],
    userId: string,
    userName?: string,
  ) {
    for (const dto of createQuestionDto) {
      // 1. Check topic exists
      const topicDoc = await this.topicModel
        .findOne({ slug: dto.topic })
        .exec();
      if (!topicDoc) {
        throw new BadRequestException(`Topic '${dto.topic}' does not exist`);
      }

      // 2. Check subtopic (if provided)
      if (dto.subtopic && !topicDoc.subtopics.includes(dto.subtopic)) {
        throw new BadRequestException(
          `Subtopic '${dto.subtopic}' is not valid for topic '${dto.topic}'`,
        );
      }

      // 3. Check canonicalMentalSkills (if provided)
      if (dto.mentalSkill && dto.mentalSkill.length > 0) {
        const invalidSkills = dto.mentalSkill.filter(
          (skill) => !topicDoc.canonicalMentalSkills.includes(skill),
        );
        if (invalidSkills.length > 0) {
          throw new BadRequestException(
            `Mental skills [${invalidSkills.join(', ')}] are not valid for topic '${dto.topic}'`,
          );
        }
      }

      // 4. Check tags (if provided)
      if (dto.tags && dto.tags.length > 0 && topicDoc.tags) {
        const invalidTags = dto.tags.filter(
          (tag) => !topicDoc.tags?.includes(tag),
        );
        if (invalidTags.length > 0) {
          throw new BadRequestException(
            `Tags [${invalidTags.join(', ')}] are not valid for topic '${dto.topic}'`,
          );
        }
      }
    }

    // If all checks pass, insert questions
    const questionsToInsert = createQuestionDto.map((dto) => ({
      ...dto,
      addedById: userId,
      addedByName: userName || 'Unknown',
    }));
    return await this.questionModel.insertMany(questionsToInsert);
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
