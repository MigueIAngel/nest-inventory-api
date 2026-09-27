import { Column, Entity, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../common/base.entity.js';
import { decimalTransformer } from '../common/decimal.transformer.js';
import { Supplier } from '../suppliers/supplier.entity.js';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 40, unique: true })
  sku: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 5 })
  minStock: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.products, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  supplier: Relation<Supplier> | null;
}
