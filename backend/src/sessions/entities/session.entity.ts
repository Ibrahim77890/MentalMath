// backend/src/sessions/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuestionSession } from 'src/question-sessions/entities/question-session.entity';

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions)
  user: User;

  @Column({ type: 'jsonb', nullable: false })
  topicOrder: string[]; // user-selected topics in order

  @CreateDateColumn()
  startTime: Date;

  @UpdateDateColumn()
  endTime: Date;

  @OneToMany(() => QuestionSession, (q) => q.session, {
    cascade: true,
  })
  questions: QuestionSession[];

  @Column('int', { nullable: true })
  totalScore?: number;

  @Column('int', { nullable: true })
  totalCorrect?: number;

  @Column('int', { nullable: true })
  totalQuestions?: number;

  @Column('jsonb', { nullable: true })
  agentSummary?: any; // agent's session summary, recommendations

  @Column('jsonb', { nullable: true })
  adaptiveDifficulty?: any; // difficulty progression metadata

  @Column('jsonb', { nullable: true })
  sessionMeta?: any; // extensible for future agent/session analytics
}
