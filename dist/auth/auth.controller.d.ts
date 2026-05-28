import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleSessionDto } from './dto/google-session.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getOptions(): object;
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
    guestLogin(dto: GuestLoginDto): Promise<{
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
    getMe(user: any): Promise<object>;
    updateMe(user: any, dto: UpdateProfileDto): Promise<object>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
