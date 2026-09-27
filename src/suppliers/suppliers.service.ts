import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  PaginationQueryDto,
  paginate,
} from '../common/dto/pagination-query.dto.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { Supplier } from './supplier.entity.js';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.suppliers.findAndCount({
      where: query.search ? { name: ILike(`%${query.search}%`) } : {},
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const supplier = await this.suppliers.findOne({
      where: { id },
      relations: { products: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  create(dto: CreateSupplierDto) {
    return this.suppliers.save(this.suppliers.create(dto));
  }

  async update(id: number, dto: UpdateSupplierDto) {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  async remove(id: number) {
    const supplier = await this.findOne(id);
    await this.suppliers.remove(supplier);
  }
}
