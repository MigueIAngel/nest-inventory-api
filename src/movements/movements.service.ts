import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { paginate } from '../common/dto/pagination-query.dto.js';
import { Product } from '../products/product.entity.js';
import { User } from '../users/user.entity.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { MovementQueryDto } from './dto/movement-query.dto.js';
import { MovementType } from './movement-type.enum.js';
import { StockMovement } from './stock-movement.entity.js';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movements: Repository<StockMovement>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll(query: MovementQueryDto) {
    const [items, total] = await this.movements.findAndCount({
      where: {
        ...(query.productId ? { product: { id: query.productId } } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return paginate(items, total, query);
  }

  /**
   * Registers a stock movement and updates the product stock atomically.
   * On PostgreSQL the product row is locked so concurrent movements cannot oversell.
   */
  create(dto: CreateMovementDto, author: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const supportsLocking = this.dataSource.options.type === 'postgres';
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        ...(supportsLocking
          ? { lock: { mode: 'pessimistic_write' as const } }
          : {}),
      });
      if (!product)
        throw new NotFoundException(`Product ${dto.productId} not found`);

      const delta = dto.type === MovementType.In ? dto.quantity : -dto.quantity;
      if (product.stock + delta < 0) {
        throw new BadRequestException(
          `Insufficient stock for ${product.sku}: available ${product.stock}, requested ${dto.quantity}`,
        );
      }

      product.stock += delta;
      await manager.save(product);

      const movement = manager.create(StockMovement, {
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason ?? null,
        stockAfter: product.stock,
        product,
        user: { id: author.id } as User,
      });
      return manager.save(movement);
    });
  }
}
