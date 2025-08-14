// src/topics/schemas/topic.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true, unique: true })
  slug: string; // machine id, e.g. 'arithmetic', 'algebra'

  @Prop({ required: true })
  title: string; // human title e.g. 'Arithmetic'

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  subtopics: string[]; // e.g. ['Multiplication','Estimation']

  @Prop({ type: [String], default: [] })
  canonicalMentalSkills: string[]; // e.g. ['chunking','doubling','complements']

  @Prop({ type: Object, default: {} })
  uiHints?: Record<string, any>; // optional UI presentation metadata (icons, color)

  @Prop({ type: Number, default: 1 })
  minDifficulty: number;

  @Prop({ type: Number, default: 5 })
  maxDifficulty: number;

  @Prop({ type: [String], default: [] })
  tags?: string[]; // synonyms or alternate groupings

  @Prop({ default: 'system' })
  createdBy?: string;

  @Prop({ default: null })
  updatedBy?: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
