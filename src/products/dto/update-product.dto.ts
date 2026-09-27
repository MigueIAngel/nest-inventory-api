import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto.js';

/** Stock is changed only through stock movements, never directly. */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['stock'] as const),
) {}
