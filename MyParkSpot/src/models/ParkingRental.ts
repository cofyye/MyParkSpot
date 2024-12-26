import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { ParkingSpot } from './ParkingSpot';
import { Car } from './Car';

@Entity({ name: 'parking_rental' })
export class ParkingRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Column({ name: 'car_id', nullable: false })
  public carId: string;

  @Column({ name: 'parking_spot_id', nullable: false })
  public parkingSpotId: string;

  @Column()
  hours: number;

  @CreateDateColumn()
  startTime: Date;

  @Column()
  endTime: Date;

  // Relations

  @ManyToOne(() => User, user => user.parkingRentals, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ParkingSpot, parkingSpot => parkingSpot.parkingRentals, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parking_spot_id' })
  parkingSpot: ParkingSpot;

  @ManyToOne(() => Car, car => car.parkingRentals, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'car_id' })
  car: Car;
}
