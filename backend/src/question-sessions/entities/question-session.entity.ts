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

  @Column('text') // Changed from uuid to text for MongoDB ObjectId
  questionId: string; // references external Mongo Question

  @Column('text')
  response: string;

  @Column('boolean')
  correct: boolean;

  @Column('int')
  timeTaken: number; // in seconds

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
