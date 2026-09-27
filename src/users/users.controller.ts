import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from './role.enum.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.usersService.findAll();
  }
}
