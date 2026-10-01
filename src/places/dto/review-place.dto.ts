import {
  IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';

export class ReviewPlaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  place_name: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;

  @IsBoolean()
  @IsOptional()
  liked?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  destination?: string;

  @IsString()
  @IsOptional()
  trip_id?: string;
}
