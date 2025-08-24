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
import { QuestionSession } from '@/question-sessions/entities/question-session.entity';
import { AgentDecision } from './entities/agent-decision.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(AgentDecision)
    private readonly agentDecisionRepository: Repository<AgentDecision>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  // ...existing code...

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
        .sort({ difficulty: 1 })
        .lean()
        .exec();
    }

    // Create the session entity
    const currentTime = new Date();
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);

    // Prepare initial QuestionSession entity
    let initialQuestionSession: QuestionSession | null = null;
    if (initialQuestion) {
      initialQuestionSession = this.sessionRepository.manager.create(
        QuestionSession,
        {
          questionId: (initialQuestion._id as any).toString(),
          response: '',
          correct: false,
          timeTaken: 0,
          timestamp: currentTime,
          // session will be set after session is created
        },
      );
      // Save the QuestionSession entity
      initialQuestionSession = await this.sessionRepository.manager.save(
        initialQuestionSession,
      );
    }

    // Create the session entity and assign the QuestionSession
    const session = this.sessionRepository.create({
      user,
      topicOrder: createSessionDto.topicOrder,
      startTime: currentTime,
      endTime: oneHourLater,
      questions: initialQuestionSession ? [initialQuestionSession] : [],
    });

    // Save the session
    const newSession = await this.sessionRepository.save(session);

    // Populate question details for all QuestionSession entries before returning
    const populatedQuestions = await Promise.all(
      (newSession.questions || []).map(async (qs: any) => {
        let questionData = initialQuestion;
        if (!questionData && qs.questionId) {
          questionData = await this.questionModel
            .findById(qs.questionId)
            .lean()
            .exec();
        }
        return {
          ...qs,
          question: questionData || null,
        };
      }),
    );

    // Build the response object matching your frontend interface
    const responseSession = {
      ...newSession,
      questions: populatedQuestions,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };

    return { data: responseSession, success: true };
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

    // Get the current question session (last in array)
    const currentQuestionSession =
      session.questions?.[session.questions?.length - 1];
    let questionDetails: any = null;
    let previousAgentDecision: AgentDecision | null = null;

    if (currentQuestionSession && currentQuestionSession.questionId) {
      // Fetch the question details from MongoDB
      questionDetails = await this.questionModel
        .findById(currentQuestionSession.questionId)
        .lean()
        .exec();

      // Get the last agent decision for this session where this was the next_question_id
      try {
        // Use TypeORM query builder to get the latest agent_decision
        previousAgentDecision = await this.agentDecisionRepository.findOne({
          where: {
            session_id: sessionId,
            next_question_id: currentQuestionSession.questionId,
          },
          order: { created_at: 'DESC' },
          select: ['trace', 'mastery', 'reason'],
        });
      } catch (error) {
        console.error('Error fetching agent decision:', error);
      }
    }

    // Format the agent decision trace
    const agentReflection = previousAgentDecision
      ? {
          trace: previousAgentDecision.trace,
          mastery: previousAgentDecision.mastery,
          reason: previousAgentDecision.reason,
          llmResponse: previousAgentDecision.trace?.llm_response || null,
          prompt: previousAgentDecision.trace?.prompt || null,
        }
      : '';

    return {
      success: true,
      data: {
        session,
        currentQuestionSession,
        currentQuestion: questionDetails,
        previousQuestionAgenticPromptReflection: agentReflection,
      },
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
    const nextQuestion: QuestionDocument | null = null;
    if (currentQuestionSession.correct) {
      // Prepare payload for agent
      const agentPayload = {
        questionId: questionDetails._id, // MongoDB question ID
        topic: questionDetails.topic,
        subTopic: questionDetails.subtopic,
        difficulty: questionDetails.difficulty,
        wasCorrect: currentQuestionSession.correct,
        timeTaken: answerDto.timeTaken,
        estimatedTime: questionDetails.estimatedTime,
        answer: answerDto.response,
        sessionId: session.id,
        userId: session.user.id,
      };

      // Call agent API (adjust URL and payload as needed)
      const agentResponse = await axios.post(
        'http://localhost:8001/agent/suggest-next-question-final',
        agentPayload,
      );

      console.log('[postCurrentQuestionAnswer] agent response:', agentResponse);

      // Fetch the next question details from MongoDB using nextQuestionId
      let nextQuestion: QuestionDocument | null = null;
      if (agentResponse.data?.nextQuestionId) {
        nextQuestion = await this.questionModel
          .findById(agentResponse.data.nextQuestionId)
          .lean()
          .exec();

        if (nextQuestion) {
          // Create a new QuestionSession entity
          const newQuestionSession = this.sessionRepository.manager.create(
            QuestionSession,
            {
              questionId: agentResponse.data.nextQuestionId,
              response: '',
              correct: false,
              timeTaken: 0,
              timestamp: new Date(),
            },
          );

          // Save the QuestionSession entity
          const savedQuestionSession =
            await this.sessionRepository.manager.save(
              QuestionSession,
              newQuestionSession,
            );

          // Add the saved QuestionSession to the session
          session.questions.push(savedQuestionSession);
          await this.sessionRepository.save(session);

          // Add the full question details to the response
          const questionWithStrategy = {
            ...nextQuestion,
            strategyTip: agentResponse.data.strategyTip,
          };
          nextQuestion = questionWithStrategy as unknown as QuestionDocument;
        }
      }

      return {
        success: true,
        data: {
          session,
          currentQuestionSession,
          nextQuestion,
          agentMessage: agentResponse.data.message,
          strategyTip: agentResponse.data.strategyTip,
          reflectionPrompt: agentResponse.data.reflectionPrompt,
        },
      };
    }
  }

  async getDashboardData(user: any, topic?: string) {
    // Create query builder for more complex queries
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.questions', 'questions')
      .where('session.user.id = :userId', { userId: user.userId })
      .orderBy('session.startTime', 'DESC')
      .take(10);

    // Add topic filter if provided
    if (topic) {
      queryBuilder.andWhere(':topic = ANY(session.topicOrder)', { topic });
    }

    // Fetch sessions for the user and topic
    const sessions = await queryBuilder.getMany();

    // Calculate stats
    let accuracy: number | null = null;
    let avgTime: number | null = null;
    let recent: any[] = [];
    let chart: any = null;

    if (sessions.length) {
      let totalQuestions = 0;
      let correctAnswers = 0;
      let totalTime = 0;
      const labels: string[] = [];
      const accuracyData: number[] = [];
      const timeData: number[] = [];

      sessions.forEach((session, idx) => {
        const sessionQuestions = session.questions || [];
        const sessionCorrect = sessionQuestions.filter((q) => q.correct).length;
        const sessionTotal = sessionQuestions.length;
        const sessionTime = sessionQuestions.reduce(
          (sum, q) => sum + (q.timeTaken || 0),
          0,
        );

        totalQuestions += sessionTotal;
        correctAnswers += sessionCorrect;
        totalTime += sessionTime;

        labels.push(`Session ${idx + 1}`);
        accuracyData.push(
          sessionTotal ? Math.round((sessionCorrect / sessionTotal) * 100) : 0,
        );
        timeData.push(
          sessionTotal ? Math.round(sessionTime / sessionTotal) : 0,
        );

        recent.push({
          id: session.id,
          startTime: session.startTime,
          topicOrder: session.topicOrder,
          accuracy: accuracyData[accuracyData.length - 1],
          duration: Math.round(
            (new Date(session.endTime).getTime() -
              new Date(session.startTime).getTime()) /
              60000,
          ),
        });
      });

      accuracy = totalQuestions
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
      avgTime = totalQuestions ? Math.round(totalTime / totalQuestions) : 0;
      chart = { labels, accuracyData, timeData };
    } else {
      // Dummy data if no sessions found
      accuracy = 75;
      avgTime = 42;
      recent = [
        {
          id: 'dummy1',
          startTime: new Date().toISOString(),
          topicOrder: [topic || 'Arithmetic'],
          accuracy: 80,
          duration: 60,
        },
        {
          id: 'dummy2',
          startTime: new Date(Date.now() - 86400000).toISOString(),
          topicOrder: [topic || 'Algebra'],
          accuracy: 70,
          duration: 55,
        },
      ];
      chart = {
        labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4'],
        accuracyData: [70, 80, 85, 88],
        timeData: [45, 40, 38, 36],
      };
    }

    const returningData = {
      stats: { accuracy, avgTime },
      recent,
      chart,
    };

    return returningData;
  }
}
