import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ParkingRental } from './ParkingRental';
import { Zone } from './Zone';
import { ColumnDecimalTransformer } from '../utils/decimal.transformer';

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
    transformer: new ColumnDecimalTransformer(),
  })
  longitude: number;

  @Column({
    name: 'latitude',
    nullable: false,
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: new ColumnDecimalTransformer(),
  })
  latitude: number;

  @Column({ name: 'is_occupied', nullable: false, default: false })
  isOccupied: boolean;

  // Relation Ids

  @Column({ name: 'zone_id', nullable: false })
  zoneId: string;

  // Relations

  @OneToMany(() => ParkingRental, rental => rental.parkingSpot)
  parkingRentals: ParkingRental[];

  @ManyToOne(() => Zone, zone => zone.parkingSpots, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}
