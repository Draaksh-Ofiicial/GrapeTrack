import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');

export type Database = ReturnType<typeof drizzle>;

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL environment variable is not set');
        }
        const queryClient = postgres(connectionString);
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
