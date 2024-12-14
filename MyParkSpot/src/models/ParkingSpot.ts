import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Car } from './Car';
import { ParkingReservation } from './ParkingReservation';

@Entity({
  name: 'parking_spots',
})
export class ParkingSpot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'longitude',
    nullable: false,
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  longitude: number;

  @Column({
    name: 'latitude',
    nullable: false,
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  latitude: number;

  @Column({ name: 'is_occupied', nullable: false, default: false })
  isOccupied: boolean;

  @Column({
    name: 'price',
    nullable: false,
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  price: number;

  // Relations

  @OneToMany(
    () => ParkingReservation,
    parkingReservation => parkingReservation.parkingSpot
  )
  parkingReservations: ParkingReservation[];
}
