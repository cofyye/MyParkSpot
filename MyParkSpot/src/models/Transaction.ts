import { TransactionType } from '../enums/transaction-type.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { User } from './User';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  transactionType: TransactionType;

  @Column({
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
  })
  amount: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    nullable: false,
  })
  createdAt: Date;

  // Relation Ids

  @RelationId((transaction: Transaction) => transaction.user)
  userId: string;

  // Relations
  
  @ManyToOne(() => User, user => user.transactions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
