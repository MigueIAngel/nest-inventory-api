import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Product } from '../products/product.entity.js';
import { User } from '../users/user.entity.js';
import { MovementType } from './movement-type.enum.js';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  stockAfter: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', eager: true })
  product: Relation<Product>;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: true })
  user: Relation<User> | null;

  @CreateDateColumn()
  createdAt: Date;
}
