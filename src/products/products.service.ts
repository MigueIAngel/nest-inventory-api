import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from '../common/dto/pagination-query.dto.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './product.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly suppliersService: SuppliersService,
  ) {}

  async findAll(query: ProductQueryDto) {
    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    if (query.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.sku) LIKE :search)',
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }
    if (query.supplierId) {
      qb.andWhere('supplier.id = :supplierId', {
        supplierId: query.supplierId,
      });
    }
    if (query.lowStock) {
      qb.andWhere('product.stock <= product.minStock');
    }

    const [items, total] = await qb
      .orderBy(`product.${query.sort}`, query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create({ supplierId, ...dto }: CreateProductDto) {
    await this.ensureSkuIsFree(dto.sku);
    const product = this.products.create(dto);
    if (supplierId)
      product.supplier = await this.suppliersService.findOne(supplierId);
    return this.products.save(product);
  }

  async update(id: number, { supplierId, ...dto }: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.sku && dto.sku !== product.sku) await this.ensureSkuIsFree(dto.sku);
    Object.assign(product, dto);
    if (supplierId !== undefined) {
      product.supplier = supplierId
        ? await this.suppliersService.findOne(supplierId)
        : null;
    }
    return this.products.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.products.remove(product);
  }

  private async ensureSkuIsFree(sku: string) {
    if (await this.products.exists({ where: { sku } })) {
      throw new ConflictException(`SKU ${sku} already exists`);
    }
  }
}
