import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  supplierId?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @IsIn(['name', 'price', 'stock', 'createdAt'])
  sort: 'name' | 'price' | 'stock' | 'createdAt' = 'name';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';
}
