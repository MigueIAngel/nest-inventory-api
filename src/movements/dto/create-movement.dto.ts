import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType } from '../movement-type.enum.js';

export class CreateMovementDto {
  @IsInt()
  productId: number;

  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
