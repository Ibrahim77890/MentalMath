import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  slug: string; // machine id, e.g. 'arithmetic', 'algebra'

  @IsString()
  title: string; // human title e.g. 'Arithmetic'

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subtopics?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  canonicalMentalSkills?: string[];

  @IsOptional()
  uiHints?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  minDifficulty?: number;

  @IsNumber()
  @IsOptional()
  maxDifficulty?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;
}
