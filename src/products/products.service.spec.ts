import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { Product } from './product.entity.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  const repo = {
    findOne: vi.fn(),
    exists: vi.fn(),
    create: vi.fn((dto) => ({ ...dto })),
    save: vi.fn(async (entity) => ({ id: 1, ...entity })),
    remove: vi.fn(),
  };
  const suppliers = { findOne: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
        { provide: SuppliersService, useValue: suppliers },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('creates a product linked to its supplier', async () => {
    repo.exists.mockResolvedValue(false);
    suppliers.findOne.mockResolvedValue({ id: 3, name: 'Acme' });

    const product = await service.create({
      sku: 'ABC-1',
      name: 'Widget',
      price: 9.5,
      supplierId: 3,
    });

    expect(suppliers.findOne).toHaveBeenCalledWith(3);
    expect(product).toMatchObject({ id: 1, sku: 'ABC-1', supplier: { id: 3 } });
  });

  it('rejects duplicated SKUs', async () => {
    repo.exists.mockResolvedValue(true);
    await expect(
      service.create({ sku: 'ABC-1', name: 'Widget', price: 1 }),
    ).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws when the product does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(42)).rejects.toThrow(NotFoundException);
  });

  it('detaches the supplier when supplierId is null', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      sku: 'ABC-1',
      supplier: { id: 3 },
    });
    const updated = await service.update(1, {
      supplierId: null as unknown as number,
    });
    expect(updated.supplier).toBeNull();
  });
});
