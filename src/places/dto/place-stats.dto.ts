import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class PlaceRefDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class PlaceStatsDto {
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => PlaceRefDto)
  places: PlaceRefDto[];
}
