import { IsString } from 'class-validator';

export class GuestLoginDto {
  @IsString()
  user_id: string;
}
