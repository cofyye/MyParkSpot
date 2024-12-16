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

@Entity({ name: 'parking_rental' })
export class ParkingRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.parkingRentals)
  user: User;

  @ManyToOne(() => ParkingSpot, parkingSpot => parkingSpot.parkingRentals)
  parkingSpot: ParkingSpot;

  @ManyToOne(() => Car, car => car.parkingRentals)
  car: Car;

  @Column()
  hours: number;

  @CreateDateColumn()
  startTime: Date;

  @Column()
  endTime: Date;
}
