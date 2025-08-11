import { Session } from 'src/sessions/entities/session.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'learner',
  TEACHER = 'teacher',
  GUEST = 'guest',
  SYSTEM_AGENT = 'system_agent',
}

// Add a separate mapping for weights
export const UserRoleWeight = {
  [UserRole.ADMIN]: 100,
  [UserRole.SYSTEM_AGENT]: 90,
  [UserRole.TEACHER]: 70,
  [UserRole.USER]: 50,
  [UserRole.GUEST]: 10,
};

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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @Column('text', { array: true, default: [] })
  topicsHistory: string[];
}
