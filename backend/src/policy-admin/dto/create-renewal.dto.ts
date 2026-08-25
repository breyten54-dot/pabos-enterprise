import { IsOptional, IsString } from 'class-validator';

export class CreateRenewalDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
