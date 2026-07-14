import { IsString, IsOptional, IsEnum, IsDateString, IsNumberString } from 'class-validator';
import { LineOfBusiness } from '@prisma/client';

export class CreatePolicyDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  insurerId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  policyNumber: string;

  @IsEnum(LineOfBusiness)
  lineOfBusiness: LineOfBusiness;

  @IsDateString()
  inceptionDate: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsNumberString()
  sumInsured?: string;

  @IsOptional()
  @IsNumberString()
  premium?: string;

  @IsOptional()
  @IsNumberString()
  excess?: string;

  @IsOptional()
  @IsString()
  riskAddressLine1?: string;

  @IsOptional()
  @IsString()
  riskCity?: string;

  @IsOptional()
  @IsString()
  riskProvince?: string;

  @IsOptional()
  @IsString()
  riskPostalCode?: string;
}
