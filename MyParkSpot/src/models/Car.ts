import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { ParkingSpot } from './ParkingSpot';
import { ParkingReservation } from './ParkingReservation';

@Entity({
  name: 'cars',
})
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_plate', nullable: false, unique: true, length: 15 })
  licensePlate: string;

  @Column({ name: 'manufacturer', nullable: true, length: 50 })
  manufacturer: string;

  @Column({ name: 'model', nullable: true, length: 50 })
  model: string;

  @Column({ name: 'year', nullable: true })
  year: number;

  // Relations

  @ManyToOne(() => User, user => user.cars)
  user: User;

  @OneToMany(() => ParkingReservation, reservation => reservation.car)
  parkingReservations: ParkingReservation[];
}
