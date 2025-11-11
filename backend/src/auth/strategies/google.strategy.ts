import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { eq } from 'drizzle-orm';
import { type Database, DATABASE } from '../../database/database.module';
import { users, type User } from '../../database/schema';

interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

interface ValidatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Google OAuth Strategy - Handles Google OAuth 2.0 authentication
 *
 * Used by GET /auth/google and GET /auth/google/callback endpoints
 * Creates or updates user on successful authentication
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    try {
      if (!profile.emails || profile.emails.length === 0) {
        throw new BadRequestException('No email found in Google profile');
      }

      const email = profile.emails[0].value.toLowerCase();
      const firstName = profile.displayName.split(' ')[0] || 'User';
      const lastName = profile.displayName.split(' ').slice(1).join(' ') || '';
      const avatar = profile.photos?.[0]?.value;
      const googleId = profile.id;

      // Check if user exists by email
      const [existingUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let user: User;

      if (existingUser) {
        // User exists - update googleId if not already set
        if (!existingUser.googleId) {
          const [updatedUser] = await this.db
            .update(users)
            .set({
              googleId,
              oauthProvider: 'google',
              avatar: avatar || existingUser.avatar,
            })
            .where(eq(users.id, existingUser.id))
            .returning();

          user = updatedUser;
        } else {
          user = existingUser;
        }
      } else {
        // Create new user from Google profile
        const [newUser] = await this.db
          .insert(users)
          .values({
            email,
            firstName,
            lastName,
            avatar,
            googleId,
            oauthProvider: 'google',
            emailVerified: true, // Google emails are pre-verified
            emailVerifiedAt: new Date(),
          })
          .returning();

        user = newUser;
      }

      // Return user without password
      const validatedUser: ValidatedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || undefined,
      };

      return done(null, validatedUser);
    } catch (error) {
      return done(error as Error, false);
    }
  }
}
