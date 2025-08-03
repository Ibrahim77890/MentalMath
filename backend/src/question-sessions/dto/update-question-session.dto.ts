import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionSessionDto } from './create-question-session.dto';

export class UpdateQuestionSessionDto extends PartialType(CreateQuestionSessionDto) {}
