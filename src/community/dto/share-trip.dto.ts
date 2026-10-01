import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ShareTripToCircleDto {
  @IsString()
  @IsNotEmpty()
  trip_id: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
