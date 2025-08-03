import { Session } from 'src/sessions/entities/session.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  age: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @Column('text', { array: true, default: [] })
  topicsHistory: string[];
}
