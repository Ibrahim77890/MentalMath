// filepath: e:\MentalMath\backend\src\question-sessions\question-sessions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionSessionsService } from './question-sessions.service';
import { QuestionSessionsController } from './question-sessions.controller';
import { QuestionSession } from './entities/question-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionSession])],
  controllers: [QuestionSessionsController],
  providers: [QuestionSessionsService],
  exports: [QuestionSessionsService],
})
export class QuestionSessionsModule {}
