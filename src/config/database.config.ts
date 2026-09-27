import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const type = config.get<string>('DB_TYPE', 'postgres');

  if (type === 'sqlite') {
    return {
      type: 'better-sqlite3',
      database: config.get<string>('DB_NAME', ':memory:'),
      autoLoadEntities: true,
      synchronize: true,
    };
  }

  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5434),
    username: config.get<string>('DB_USER', 'inventory'),
    password: config.get<string>('DB_PASSWORD', 'inventory'),
    database: config.get<string>('DB_NAME', 'inventory'),
    autoLoadEntities: true,
    synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
  };
}
