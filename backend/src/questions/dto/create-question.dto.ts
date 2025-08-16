import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionTopic {
  ARITHMETIC = 'Arithmetic',
  ALGEBRA = 'Algebra',
  DIFFERENTIAL_EQUATIONS = 'DifferentialEquations',
  WORD_PROBLEM = 'WordProblem',
}

export enum QuestionType {
  MCQ = 'mcq',
  FREE_TEXT = 'free_text',
  NUMERIC = 'numeric',
  TRUE_FALSE = 'true_false',
}

export class OptionDto {
  @IsString()
  label: string;

  @IsString()
  value: string;
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsEnum(QuestionTopic)
  topic: QuestionTopic;

  @IsString()
  @IsOptional()
  subtopic?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsOptional()
  options?: OptionDto[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answerVariants?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentalSkill?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hints?: string[];

  @IsString()
  @IsOptional()
  strategyTip?: string;

  @IsInt()
  @IsOptional()
  estimatedTime?: number;

  @IsString()
  @IsOptional()
  origin?: 'programmatic' | 'curated' | 'llm-assisted';
}
