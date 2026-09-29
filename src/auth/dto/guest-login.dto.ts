import { IsOptional, IsString } from 'class-validator';

export class GuestLoginDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  guest_id?: string;
}
