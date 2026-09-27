import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsController } from './movements.controller.js';
import { MovementsService } from './movements.service.js';
import { StockMovement } from './stock-movement.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  controllers: [MovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
