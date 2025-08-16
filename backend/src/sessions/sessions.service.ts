import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { Model } from 'mongoose';
import { Topic, TopicDocument } from '@/questions/entities/topic.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  Question,
  QuestionDocument,
} from '@/questions/entities/question.entity';
import axios from 'axios';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async create(createSessionDto: CreateSessionDto, userPayload: any) {
    // Find the user by ID
    const user = await this.userRepository.findOne({
      where: { id: userPayload.userId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with id ${userPayload.userId} not found`,
      );
    }

    // Verify all topics in topicOrder exist in Topics collection
    const topicSlugs = createSessionDto.topicOrder;
    const foundTopics = await this.topicModel
      .find({ slug: { $in: topicSlugs } })
      .exec();

    const foundSlugs = foundTopics.map((t) => t.slug);
    const missingSlugs = topicSlugs.filter(
      (slug) => !foundSlugs.includes(slug),
    );
    if (missingSlugs.length > 0) {
      throw new BadRequestException(
        `Topics not found: ${missingSlugs.join(', ')}`,
      );
    }

    // Fetch a simple question for the first topic to gauge the user
    let initialQuestion: QuestionDocument | null = null;
    if (topicSlugs.length > 0) {
      initialQuestion = await this.questionModel
        .findOne({ topic: topicSlugs[0] })
        .sort({ difficulty: 1 }) // Assuming lower difficulty means simpler
        .exec();
    }

    // Create the session entity
    const currentTime = new Date();
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);

    const session = this.sessionRepository.create({
      user,
      topicOrder: createSessionDto.topicOrder,
      startTime: currentTime,
      endTime: oneHourLater,
      questions: initialQuestion
        ? [
            {
              questionId: (initialQuestion._id as any).toString(),
              response: '', // <-- Provide default empty response
              correct: false, // <-- Provide default value
              timeTaken: 0, // <-- Provide default value
            },
          ]
        : [],
    });

    // Save the session
    return await this.sessionRepository.save(session);
  }

  async findAll() {
    return await this.sessionRepository.find({
      relations: ['user', 'questions'],
    });
  }

  async findOne(id: string) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['user', 'questions'],
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    Object.assign(session, updateSessionDto);
    return await this.sessionRepository.save(session);
  }

  async remove(id: string) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    await this.sessionRepository.remove(session);
    return { deleted: true, id };
  }

  async findOneUserQuestionPopulated(sessionId: string) {
    // Find the session with its questions
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'questions'],
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    // Get the current question session (first in array)
    const currentQuestionSession = session.questions?.[0];
    let questionDetails: any = null;

    if (currentQuestionSession && currentQuestionSession.questionId) {
      // Fetch the question details from MongoDB
      questionDetails = await this.questionModel
        .findById(currentQuestionSession.questionId)
        .lean()
        .exec();
    }

    return {
      session,
      currentQuestionSession,
      currentQuestion: questionDetails,
    };
  }

  async postCurrentQuestionAnswer(
    sessionId: string,
    answerDto: { response: string; timeTaken: number },
    user: any,
  ) {
    // Find the session with its questions
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'questions'],
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    // Get the current question session (first in array)
    const currentQuestionSession = session.questions?.[0];
    if (!currentQuestionSession) {
      throw new BadRequestException('No current question found in session');
    }

    // Fetch the question details from MongoDB
    const questionDetails = await this.questionModel
      .findById(currentQuestionSession.questionId)
      .lean()
      .exec();

    if (!questionDetails) {
      throw new NotFoundException('Question details not found');
    }

    // Update the current question session with user's answer and timing
    currentQuestionSession.response = answerDto.response;
    currentQuestionSession.timeTaken = answerDto.timeTaken;
    // You may want to check correctness here
    currentQuestionSession.correct =
      answerDto.response === questionDetails.correctAnswer;

    // Save the updated session
    await this.sessionRepository.save(session);

    // If answered correctly, call agent for next question suggestion
    let nextQuestion: QuestionDocument | null = null;
    if (currentQuestionSession.correct) {
      // Prepare payload for agent
      const agentPayload = {
        topic: questionDetails.topic,
        previousQuestionId: questionDetails._id,
        estimatedTime: questionDetails.estimatedTime,
        actualTime: answerDto.timeTaken,
        userId: session.user.id,
        sessionId: session.id,
      };

      // Call agent API (adjust URL and payload as needed)
      const agentResponse = await axios.post(
        'http://localhost:5000/next-question',
        agentPayload,
      );
      nextQuestion = agentResponse.data?.question as QuestionDocument;

      // Optionally, add the next question to the session
      if (nextQuestion && nextQuestion._id) {
        session.questions.push({
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          questionId: nextQuestion._id.toString(),
          response: '',
          correct: false,
          timeTaken: 0,
          id: '',
          session: new Session(),
          timestamp: new Date(),
        });
        await this.sessionRepository.save(session);
      }
    }

    return {
      session,
      currentQuestionSession,
      nextQuestion,
    };
  }
}
