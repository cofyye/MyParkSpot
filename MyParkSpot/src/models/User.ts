import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({
  name: "users",
})
export class User {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({ name: "first_name", nullable: false, length: 20 })
  public firstName: string;

  @Column({ name: "last_name", nullable: false, length: 20 })
  public lastName: string;

  @Column({ name: "username", unique: true, nullable: false, length: 20 })
  public username: string;

  @Column({ name: "email", unique: true, nullable: false, length: 100 })
  public email: string;

  @Column({ name: "password", nullable: false, length: 100 })
  public password: string;

  @CreateDateColumn({
    name: "registration_date",
    type: "datetime",
    nullable: false,
  })
  public registrationDate: Date;

  // Relations
}
