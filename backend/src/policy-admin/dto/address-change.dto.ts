import { IsString, IsDateString, IsOptional } from 'class-validator';

export class AddressChangeDto {
  @IsDateString()
  effectiveDate: string;

  @IsString()
  newAddressLine1: string;

  @IsOptional()
  @IsString()
  newAddressLine2?: string;

  @IsOptional()
  @IsString()
  newSuburb?: string;

  @IsString()
  newCity: string;

  @IsOptional()
  @IsString()
  newProvince?: string;

  @IsString()
  newPostalCode: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
