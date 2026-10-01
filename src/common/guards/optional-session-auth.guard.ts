import { ExecutionContext, Injectable } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';

/**
 * Like SessionAuthGuard, but never rejects the request.
 * When a valid Bearer token is present, request.user is the authenticated user;
 * otherwise the request continues anonymously (request.user has no user_id).
 */
@Injectable()
export class OptionalSessionAuthGuard extends SessionAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Anonymous access allowed
    }
    return true;
  }
}
