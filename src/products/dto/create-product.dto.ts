import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Matches(/^[A-Z0-9-]{3,40}$/, {
    message: 'sku must be 3-40 uppercase letters, digits or dashes',
  })
  sku: string;

  @IsString()
  @Length(2, 160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsInt()
  supplierId?: number;
}
