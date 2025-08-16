import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './entities/question.entity';
import { Topic, TopicSchema } from './entities/topic.entity';
import { TopicsService } from './topics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, TopicsService],
})
export class QuestionsModule {}
