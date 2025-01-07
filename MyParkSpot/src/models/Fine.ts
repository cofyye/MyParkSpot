import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { ParkingSpot } from './ParkingSpot';
import { Car } from './Car';
import { ColumnDecimalTransformer } from '../utils/decimal.transformer';
import { FineStatus } from '../enums/fine-status.enum';

@Entity({ name: 'fines' })
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'license_plate',
    type: 'varchar',
    length: 15,
    nullable: false,
  })
  licensePlate: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: false,
    transformer: new ColumnDecimalTransformer(),
  })
  amount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: FineStatus,
    default: FineStatus.ISSUED,
    nullable: false,
  })
  status: FineStatus;

  @Column({
    name: 'issued_at',
    type: 'datetime',
    nullable: false,
  })
  issuedAt: Date;

  // Relation Ids

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'parking_spot_id', nullable: false })
  parkingSpotId: string;

  @Column({ name: 'car_id', nullable: true })
  carId?: string;

  @Column({ name: 'issued_by_user_id', nullable: false })
  issuedById: string;

  // Relations

  @ManyToOne(() => ParkingSpot, parkingSpot => parkingSpot.fines, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parking_spot_id' })
  parkingSpot: ParkingSpot;

  @ManyToOne(() => User, user => user.fines, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Car, car => car.fines, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'car_id' })
  car?: Car;

  @ManyToOne(() => User, user => user.issuedFines, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'issued_by_user_id' })
  issuedBy: User;
}
