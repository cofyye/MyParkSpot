import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ParkingSpot } from './ParkingSpot';
import { ZoneType } from '../enums/zone-type.enum';
import { ColumnDecimalTransformer } from '../utils/decimal.transformer';

type minutes = number;

@Entity({ name: 'zones' })
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ name: 'name', length: 50, nullable: false, unique: true })
  public name: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ZoneType,
    nullable: false,
    unique: true,
  })
  public type: ZoneType;

  @Column({
    name: 'max_parking_duration',
    type: 'int',
    nullable: true,
    default: null,
  })
  public maxParkingDuration?: minutes;

  @Column({
    name: 'max_extension_duration',
    type: 'int',
    nullable: true,
    default: null,
  })
  public maxExtensionDuration?: minutes;

  @Column({
    name: 'base_cost',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: false,
    transformer: new ColumnDecimalTransformer(),
  })
  public baseCost: number;

  @Column({
    name: 'extension_cost',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnDecimalTransformer(),
  })
  public extensionCost?: number;

  @Column({
    name: 'daily_pass_cost',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: new ColumnDecimalTransformer(),
  })
  public dailyPassCost?: number;

  // Relations

  @OneToMany(() => ParkingSpot, spot => spot.zone)
  public parkingSpots: ParkingSpot[];
}
