import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Car } from './Car';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', nullable: false, length: 20 })
  firstName: string;

  @Column({ name: 'last_name', nullable: false, length: 20 })
  lastName: string;

  @Column({ name: 'username', unique: true, nullable: false, length: 20 })
  username: string;

  @Column({ name: 'email', unique: true, nullable: false, length: 100 })
  email: string;

  @Column({ name: 'password', nullable: false, length: 100 })
  password: string;

  @Column({
    name: 'credit',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  credit: number;

  @CreateDateColumn({
    name: 'registration_date',
    type: 'datetime',
    nullable: false,
  })
  registrationDate: Date;

  // Relations

  @OneToMany(() => Car, car => car.user)
  cars: Car[];
}
