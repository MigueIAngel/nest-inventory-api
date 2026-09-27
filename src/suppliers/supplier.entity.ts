import { Column, Entity, OneToMany, type Relation } from 'typeorm';
import { BaseEntity } from '../common/base.entity.js';
import { Product } from '../products/product.entity.js';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @OneToMany(() => Product, (product) => product.supplier)
  products: Relation<Product[]>;
}
