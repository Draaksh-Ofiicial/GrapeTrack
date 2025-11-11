import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { OrganizationGuard } from './guards/organization.guard';
import { RolesGuard } from './guards/roles.guard';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    DatabaseModule,
    UsersModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    GoogleAuthGuard,
    OrganizationGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [
    JwtAuthGuard,
    LocalAuthGuard,
    GoogleAuthGuard,
    OrganizationGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
