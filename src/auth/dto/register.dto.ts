import { IsString, Length } from 'class-validator';
import { LoginDto } from './login.dto.js';

export class RegisterDto extends LoginDto {
  @IsString()
  @Length(2, 120)
  name: string;
}
