// src/questions/schemas/question.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export enum QuestionType {
  MCQ = 'mcq',
  FREE_TEXT = 'free_text',
  NUMERIC = 'numeric',
  TRUE_FALSE = 'true_false',
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true })
  text: string; // question statement (HTML or markdown allowed)

  // Reference to topic slug or ObjectId (you may prefer slug for simpler joins)
  @Prop({ type: String, required: true })
  topic: string; // e.g. 'Arithmetic' or slug 'arithmetic'

  @Prop({ type: String, required: false })
  subtopic?: string; // e.g. 'Multiplication'

  @Prop({ required: true, min: 1, max: 5 })
  difficulty: number;

  @Prop({ enum: QuestionType, default: QuestionType.NUMERIC })
  type: QuestionType;

  @Prop({ type: [{ label: String, value: String }], default: [] })
  options?: { label: string; value: string }[]; // for MCQ

  @Prop()
  correctAnswer?: string; // canonical single answer

  @Prop({ type: [String], default: [] })
  answerVariants?: string[]; // alternative acceptable answers (strings normalized)

  @Prop({ type: [String], default: [] })
  tags: string[]; // flexible tags: '2-digit','estimation','speed'

  @Prop({ type: [String], default: [] })
  mentalSkill: string[]; // e.g. ['chunking','complements','visualization']

  @Prop({ type: [String], default: [] })
  hints: string[]; // progressive hints (short to longer)

  @Prop({ type: String, default: '' })
  strategyTip?: string; // short tip or strategy summary

  @Prop({ type: Number, default: 30 })
  estimatedTime: number; // seconds — used by agent to detect 'slow' responses

  @Prop({ type: String, default: 'programmatic' })
  origin: 'programmatic' | 'curated' | 'llm-assisted';

  @Prop({ type: String, required: true })
  addedById: string;

  @Prop({ type: String, required: false })
  addedByName?: string;

  @Prop({ type: String, default: null })
  lastModifiedById?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
