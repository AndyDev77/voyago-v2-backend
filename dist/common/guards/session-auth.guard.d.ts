import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserSession } from '../../auth/schemas/user-session.schema';
import { User } from '../../auth/schemas/user.schema';
export declare class SessionAuthGuard implements CanActivate {
    private readonly sessionModel;
    private readonly userModel;
    constructor(sessionModel: Model<UserSession>, userModel: Model<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
