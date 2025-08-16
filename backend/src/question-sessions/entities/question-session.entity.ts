// backend/src/sessions/entities/question-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from 'src/sessions/entities/session.entity';

@Entity()
export class QuestionSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, (session) => session.questions)
  @JoinColumn()
  session: Session;

  @Column('text')
  questionId: string; // references external Mongo Question

  @Column('text')
  response: string;

  @Column('boolean')
  correct: boolean;

  @Column('int')
  timeTaken: number; // in seconds

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column('int', { nullable: true })
  attemptNumber?: number; // for multi-attempt questions

  @Column('jsonb', { nullable: true })
  agentFeedback?: any; // agent's feedback, explanation, encouragement

  @Column('text', { nullable: true })
  strategyTip?: string; // tip given by agent

  @Column('jsonb', { nullable: true })
  answerVariants?: string[]; // accepted variants

  @Column('jsonb', { nullable: true })
  extraData?: any; // extensible for future agent/session analytics
}
