import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Inventory API (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let staffToken: string;

  const login = async (email: string, password: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  };

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_NAME = ':memory:';
    process.env.SEED_DEMO_DATA = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    adminToken = await login('admin@inventory.dev', 'admin123');
    staffToken = await login('staff@inventory.dev', 'staff123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes a public health check', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });

  it('rejects requests without a token', () => {
    return request(app.getHttpServer()).get('/api/products').expect(401);
  });

  it('rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@inventory.dev', password: 'wrong-password' })
      .expect(401);
  });

  it('lists seeded products with pagination and filters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products?lowStock=true&limit=2')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(res.body.total).toBe(4);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.pages).toBe(2);
  });

  it('only allows admins to create products', async () => {
    const product = {
      sku: 'TST-001',
      name: 'Test product',
      price: 10,
      stock: 5,
    };
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(product)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(product)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(product)
      .expect(409);
  });

  it('validates the product payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'bad sku', name: 'x', price: -5 })
      .expect(400);
    expect(res.body.message).toHaveLength(3);
  });

  it('updates stock through movements and prevents negative stock', async () => {
    const server = app.getHttpServer();
    const { body: page } = await request(server)
      .get('/api/products?search=TST-001')
      .set('Authorization', `Bearer ${staffToken}`);
    const productId = page.items[0].id;

    const inbound = await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId, type: 'in', quantity: 7, reason: 'Restock' })
      .expect(201);
    expect(inbound.body.stockAfter).toBe(12);

    await request(server)
      .post('/api/movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId, type: 'out', quantity: 13 })
      .expect(400);

    const product = await request(server)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(product.body.stock).toBe(12);
  });

  it('returns the dashboard summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(res.body.totalProducts).toBe(11);
    expect(res.body.movementsByDay).toHaveLength(7);
    expect(res.body.inventoryValue).toBeGreaterThan(0);
  });
});
