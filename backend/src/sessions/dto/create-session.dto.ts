import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateSessionDto {
  @IsArray()
  @IsString({ each: true })
  topicOrder: string[]; // user-selected topics in order
}
