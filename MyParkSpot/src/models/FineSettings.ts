import { ColumnDecimalTransformer } from '../utils/decimal.transformer';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'fine_settings' })
export class FineSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'default_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: new ColumnDecimalTransformer(),
  })
  amount: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    nullable: false,
  })
  createdAt: Date;
}
