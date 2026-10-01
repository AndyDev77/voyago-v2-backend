import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class ArrivalDto {
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

  @IsString()
  @IsOptional()
  trip_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  destination?: string;

  @IsInt()
  @IsOptional()
  day?: number;

  @IsString()
  @IsOptional()
  image_url?: string;
}
