import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PrayerCategory } from '../prayer-request.entity';

export class CreatePrayerRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEnum(PrayerCategory, {
    message: `category must be one of: ${Object.values(PrayerCategory).join(', ')}`,
  })
  category: PrayerCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  request: string;
}
