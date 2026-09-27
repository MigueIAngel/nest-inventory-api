import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { databaseConfig } from './config/database.config.js';
import { ProductsModule } from './products/products.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    SuppliersModule,
    ProductsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
