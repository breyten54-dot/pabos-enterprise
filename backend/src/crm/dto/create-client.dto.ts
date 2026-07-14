import { IsString, IsOptional, IsEmail, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ClientType, IdType, ConsentPurpose } from '@prisma/client';

export class CreateClientDto {
  @IsEnum(ClientType)
  type: ClientType;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsEnum(IdType)
  idType: IdType;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  suburb?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  consentGranted?: boolean;

  @IsOptional()
  @IsEnum(ConsentPurpose)
  consentPurpose?: ConsentPurpose;
}
