import {
  ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';

export class UpsertJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  poi_name: string;

  @IsInt()
  @Min(1)
  @Max(60)
  day: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  mood_tags?: string[];

  @IsBoolean()
  @IsOptional()
  visited?: boolean;
}
