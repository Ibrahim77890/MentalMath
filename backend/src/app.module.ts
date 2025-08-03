import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { QuestionsModule } from './questions/questions.module';
import { SessionsModule } from './sessions/sessions.module';
import { QuestionSessionsModule } from './question-sessions/question-sessions.module';
import { Session } from './sessions/entities/session.entity';
import { QuestionSession } from './question-sessions/entities/question-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      entities: [User, Session, QuestionSession],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User]),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    UsersModule,
    QuestionsModule,
    SessionsModule,
    QuestionSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
