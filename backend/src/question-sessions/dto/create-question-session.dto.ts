import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';

export class CreateQuestionSessionDto {
  @IsString()
  sessionId: string; // UUID of the session

  @IsString()
  questionId: string; // references external Mongo Question

  @IsString()
  response: string;

  @IsBoolean()
  correct: boolean;

  @IsInt()
  timeTaken: number; // in seconds

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsInt()
  @IsOptional()
  attemptNumber?: number;

  @IsOptional()
  agentFeedback?: any;

  @IsString()
  @IsOptional()
  strategyTip?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answerVariants?: string[];
}
