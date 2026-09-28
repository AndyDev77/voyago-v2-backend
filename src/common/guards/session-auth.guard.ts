import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSession } from '../../auth/schemas/user-session.schema';
import { User } from '../../auth/schemas/user.schema';
import { GLOBAL_DB_CONNECTION } from '../constants';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @InjectModel(UserSession.name, GLOBAL_DB_CONNECTION) private readonly sessionModel: Model<UserSession>,
    @InjectModel(User.name, GLOBAL_DB_CONNECTION) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No session token provided');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Empty session token');
    }

    const session = await this.sessionModel.findOne({ session_token: token }).exec();
    if (!session) {
      throw new UnauthorizedException('Invalid session token');
    }

    if (new Date() > session.expires_at) {
      await this.sessionModel.deleteOne({ session_token: token }).exec();
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userModel.findOne({ user_id: session.user_id }).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenantId =
      request.headers['x-tenant-id']?.toString() ||
      user.tenant_id ||
      'default';

    user.tenant_id = tenantId;
    request.tenantId = tenantId;
    request.user = user;
    request.session_token = token;
    return true;
  }
}
