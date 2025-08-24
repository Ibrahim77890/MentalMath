import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from './entities/session.entity';
import { UsersModule } from 'src/users/users.module';
import { User } from '@/users/entities/user.entity';
import { Topic, TopicSchema } from '@/questions/entities/topic.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '@/questions/entities/question.entity';
import { AgentDecision } from './entities/agent-decision.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, User, AgentDecision]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService, TypeOrmModule.forFeature([Session, User])],
})
export class SessionsModule {}
