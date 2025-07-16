import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User, Payment, Receipt, Admin } from '../entities';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [User, Payment, Receipt, Admin],
  synchronize: true,
  logging: true,
  ssl: { rejectUnauthorized: false },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
