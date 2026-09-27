import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { MovementType } from '../movements/movement-type.enum.js';
import { StockMovement } from '../movements/stock-movement.entity.js';
import { Product } from '../products/product.entity.js';
import { Supplier } from '../suppliers/supplier.entity.js';

export interface DailyMovement {
  date: string;
  in: number;
  out: number;
}

@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async summary(days = 7) {
    const products = this.dataSource.getRepository(Product);
    const movements = this.dataSource.getRepository(StockMovement);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [
      totalProducts,
      totalSuppliers,
      lowStockProducts,
      value,
      recentMovements,
      periodMovements,
    ] = await Promise.all([
      products.count(),
      this.dataSource.getRepository(Supplier).count(),
      products
        .createQueryBuilder('p')
        .where('p.stock <= p.minStock')
        .orderBy('p.stock', 'ASC')
        .getMany(),
      products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.price * p.stock), 0)', 'total')
        .getRawOne<{ total: string | number }>(),
      movements.find({ order: { createdAt: 'DESC', id: 'DESC' }, take: 5 }),
      movements.find({ where: { createdAt: MoreThanOrEqual(since) } }),
    ]);

    return {
      totalProducts,
      totalSuppliers,
      lowStockCount: lowStockProducts.length,
      inventoryValue: Math.round(Number(value?.total ?? 0) * 100) / 100,
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentMovements,
      movementsByDay: this.groupByDay(periodMovements, since, days),
    };
  }

  private groupByDay(
    movements: StockMovement[],
    since: Date,
    days: number,
  ): DailyMovement[] {
    const buckets = new Map<string, DailyMovement>();
    for (let i = 0; i < days; i++) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, { date: key, in: 0, out: 0 });
    }
    for (const movement of movements) {
      const bucket = buckets.get(
        new Date(movement.createdAt).toISOString().slice(0, 10),
      );
      if (!bucket) continue;
      if (movement.type === MovementType.In) bucket.in += movement.quantity;
      else bucket.out += movement.quantity;
    }
    return [...buckets.values()];
  }
}
