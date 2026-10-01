import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateCircleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  avatar_emoji?: string;

  @IsString()
  @IsOptional()
  cover_image_url?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  destination_city?: string;

  @IsString()
  @IsOptional()
  destination_country?: string;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
