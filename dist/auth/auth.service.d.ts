import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { UserSessionDocument } from './schemas/user-session.schema';
import { PasswordResetDocument } from './schemas/password-reset.schema';
import { ProfileDocument } from '../gamification/schemas/profile.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSessionDto } from './dto/google-session.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthService {
    private readonly userModel;
    private readonly sessionModel;
    private readonly passwordResetModel;
    private readonly profileModel;
    private readonly configService;
    private resend;
    constructor(userModel: Model<UserDocument>, sessionModel: Model<UserSessionDocument>, passwordResetModel: Model<PasswordResetDocument>, profileModel: Model<ProfileDocument>, configService: ConfigService);
    private generateSessionToken;
    private createSession;
    private createProfile;
    private sanitizeUser;
    emailSignup(dto: SignupDto): Promise<{
        session_token: string;
        user_id: string;
        user: object;
    }>;
    emailLogin(dto: LoginDto): Promise<{
        session_token: string;
        user_id: string;
        user: object;
    }>;
    googleSession(dto: GoogleSessionDto): Promise<{
        session_token: string;
        user_id: string;
        user: object;
    }>;
    guestLogin(guest_user_id: string): Promise<{
        session_token: string;
        user_id: string;
        user: object;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getMe(user: UserDocument): Promise<object>;
    updateMe(user: UserDocument, dto: UpdateProfileDto): Promise<object>;
    logout(sessionToken: string): Promise<{
        message: string;
    }>;
    getAuthOptions(): object;
}
