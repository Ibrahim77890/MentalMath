// src/questions/schemas/question.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  text: string;

  @Prop({
    required: true,
    enum: ['Arithmetic', 'Algebra', 'DifferentialEquations', 'WordProblem'],
  })
  topic: string;

  @Prop({ required: true, min: 1, max: 5 })
  difficulty: number;

  @Prop()
  correctAnswer: string;

  @Prop()
  strategyTip: string;

  @Prop({ type: String, required: true })
  addedById: string;

  @Prop({ type: String, required: false })
  addedByName: string;

  @Prop({ type: String, required: false })
  lastModifiedById: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Number, default: 60 }) // estimated seconds
  estimatedTime: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
