import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Car } from './Car';

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

  @OneToOne(() => Car, car => car.parkingSpot, { nullable: true })
  @JoinColumn()
  car: Car;
}
