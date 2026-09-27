import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { MovementType } from '../movements/movement-type.enum.js';
import { StockMovement } from '../movements/stock-movement.entity.js';
import { Product } from '../products/product.entity.js';
import { Supplier } from '../suppliers/supplier.entity.js';
import { Role } from '../users/role.enum.js';
import { User } from '../users/user.entity.js';

const SUPPLIERS = [
  {
    name: 'TechSource Ltd.',
    email: 'orders@techsource.example',
    phone: '+1 555 0101',
  },
  {
    name: 'Office Depot Co.',
    email: 'b2b@officedepot.example',
    phone: '+1 555 0102',
  },
  {
    name: 'Andes Electronics',
    email: 'ventas@andes.example',
    phone: '+57 605 000 0000',
  },
];

const PRODUCTS = [
  {
    sku: 'LAP-001',
    name: 'Laptop 14" Ryzen 7',
    price: 899.99,
    stock: 12,
    minStock: 5,
    s: 0,
  },
  {
    sku: 'MON-027',
    name: 'Monitor 27" 4K',
    price: 349.5,
    stock: 4,
    minStock: 5,
    s: 0,
  },
  {
    sku: 'KB-MEC',
    name: 'Mechanical keyboard',
    price: 79.9,
    stock: 25,
    minStock: 10,
    s: 2,
  },
  {
    sku: 'MS-WL',
    name: 'Wireless mouse',
    price: 24.99,
    stock: 40,
    minStock: 15,
    s: 2,
  },
  {
    sku: 'HD-USB',
    name: 'USB-C hub 7-in-1',
    price: 39.0,
    stock: 3,
    minStock: 8,
    s: 2,
  },
  {
    sku: 'CH-ERG',
    name: 'Ergonomic chair',
    price: 259.0,
    stock: 6,
    minStock: 3,
    s: 1,
  },
  {
    sku: 'DSK-STD',
    name: 'Standing desk',
    price: 429.0,
    stock: 2,
    minStock: 3,
    s: 1,
  },
  {
    sku: 'PAP-A4',
    name: 'A4 paper (500 sheets)',
    price: 6.5,
    stock: 120,
    minStock: 50,
    s: 1,
  },
  {
    sku: 'HS-BT',
    name: 'Bluetooth headset',
    price: 59.9,
    stock: 18,
    minStock: 6,
    s: 0,
  },
  {
    sku: 'CAM-HD',
    name: 'HD webcam',
    price: 45.0,
    stock: 0,
    minStock: 5,
    s: 2,
  },
];

/** Populates an empty database with demo users and inventory data. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('SEED_DEMO_DATA', 'true') !== 'true') return;
    if ((await this.dataSource.getRepository(User).count()) > 0) return;
    await this.seed();
    this.logger.log('Demo data created (admin@inventory.dev / admin123)');
  }

  async seed() {
    await this.dataSource.transaction(async (manager) => {
      const [admin] = await manager.save(User, [
        {
          email: 'admin@inventory.dev',
          name: 'Admin User',
          role: Role.Admin,
          passwordHash: await bcrypt.hash('admin123', 10),
        },
        {
          email: 'staff@inventory.dev',
          name: 'Staff User',
          role: Role.Staff,
          passwordHash: await bcrypt.hash('staff123', 10),
        },
      ]);
      const suppliers = await manager.save(Supplier, SUPPLIERS);
      const products = await manager.save(
        Product,
        PRODUCTS.map(({ s, ...p }) => ({ ...p, supplier: suppliers[s] })),
      );

      const movements: Partial<StockMovement>[] = [];
      for (let day = 6; day >= 0; day--) {
        const createdAt = new Date(Date.now() - day * 86_400_000);
        products.slice(0, 5).forEach((product, i) => {
          const type = (day + i) % 3 === 0 ? MovementType.In : MovementType.Out;
          movements.push({
            type,
            quantity: 1 + ((day * 3 + i) % 6),
            stockAfter: product.stock,
            reason: type === MovementType.In ? 'Purchase order' : 'Sale',
            product,
            user: admin,
            createdAt,
          });
        });
      }
      await manager.save(StockMovement, movements);
    });
  }
}
