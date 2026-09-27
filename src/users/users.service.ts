import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from './role.enum.js';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: number) {
    return this.users.findOne({ where: { id } });
  }

  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findAll() {
    return this.users.find({ order: { createdAt: 'ASC' } });
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: Role;
  }) {
    const email = data.email.toLowerCase();
    if (await this.users.exists({ where: { email } })) {
      throw new ConflictException('Email already registered');
    }
    const user = this.users.create({
      email,
      name: data.name,
      role: data.role ?? Role.Staff,
      passwordHash: await bcrypt.hash(data.password, 10),
    });
    const saved = await this.users.save(user);
    const { passwordHash: _hash, ...safe } = saved;
    return safe;
  }
}
