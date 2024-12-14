// ParkingReservation.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { ParkingSpot } from './ParkingSpot';
import { Car } from './Car';

@Entity({ name: 'parking_reservations' })
export class ParkingReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.parkingReservations)
  user: User;

  @ManyToOne(() => ParkingSpot, parkingSpot => parkingSpot.parkingReservations)
  parkingSpot: ParkingSpot;

  @ManyToOne(() => Car, car => car.parkingReservations)
  car: Car;

  @Column()
  hours: number;

  @CreateDateColumn()
  startTime: Date;

  @Column()
  endTime: Date;
}
