import { IsString } from 'class-validator';

export class GoogleSessionDto {
  @IsString()
  session_id: string;
}
