import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  trip_id?: string;

  @IsString()
  @IsOptional()
  poi_title?: string;

  @IsString()
  @IsOptional()
  poi_city?: string;

  @IsString()
  @IsOptional()
  poi_country?: string;

  @IsArray()
  @IsOptional()
  image_urls?: string[];
}
