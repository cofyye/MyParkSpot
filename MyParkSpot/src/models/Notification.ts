import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { NotificationType } from '../enums/notification-type.enum';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'message',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  message: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: NotificationType,
    nullable: false,
  })
  type: NotificationType;

  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isRead: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    nullable: false,
  })
  createdAt: Date;

  // Relation Ids

  @Column({ name: 'user_id', nullable: false })
  userId: string;

  // Relations

  @ManyToOne(() => User, user => user.notifications, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
