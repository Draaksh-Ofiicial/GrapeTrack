import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { eq } from 'drizzle-orm';
import { type Database, DATABASE } from '../../database/database.module';
import { users } from '../../database/schema';
import { AuthService } from '../auth.service';

/**
 * Local Strategy - Handles email/password authentication
 *
 * Used by POST /auth/login endpoint
 * Validates email and password, returns authenticated user
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private authService: AuthService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Fetch user by email
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.authService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return user without password hash
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    };
  }
}
