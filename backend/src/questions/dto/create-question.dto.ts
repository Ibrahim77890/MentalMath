import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum QuestionTopic {
  ARITHMETIC = 'Arithmetic',
  ALGEBRA = 'Algebra',
  DIFFERENTIAL_EQUATIONS = 'DifferentialEquations',
  WORD_PROBLEM = 'WordProblem',
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsEnum(QuestionTopic)
  topic: QuestionTopic;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @IsString()
  correctAnswer: string;

  @IsString()
  @IsOptional()
  strategyTip?: string;

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  estimatedTime?: number;

  // Don't include addedById in the DTO, it will be set by the controller
}
