import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('agent_decision')
export class AgentDecision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  prev_question_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  next_question_id: string;

  @Column({ type: 'integer' })
  next_difficulty: number;

  @Column({ type: 'float' })
  mastery: number;

  @Column({ type: 'varchar', length: 32 })
  reason: string;

  @Column({ type: 'jsonb' })
  trace: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
