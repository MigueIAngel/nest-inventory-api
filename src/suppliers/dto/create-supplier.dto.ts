import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 40)
  phone?: string;
}
