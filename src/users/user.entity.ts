import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base.entity.js';
import { Role } from './role.enum.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 160, unique: true })
  email: string;

  @Column({ length: 120 })
  name: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'simple-enum', enum: Role, default: Role.Staff })
  role: Role;
}
