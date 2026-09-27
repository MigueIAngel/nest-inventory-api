import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  type AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { MovementQueryDto } from './dto/movement-query.dto.js';
import { MovementsService } from './movements.service.js';

@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  findAll(@Query() query: MovementQueryDto) {
    return this.movementsService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMovementDto, @CurrentUser() user: AuthUser) {
    return this.movementsService.create(dto, user);
  }
}
