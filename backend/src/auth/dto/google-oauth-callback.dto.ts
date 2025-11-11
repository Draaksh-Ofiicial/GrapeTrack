/**
 * Google OAuth Callback Response DTO
 * This DTO is used internally to handle Google OAuth callback
 * The validated user object from GoogleStrategy is passed here
 */
export class GoogleOAuthCallbackDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}
