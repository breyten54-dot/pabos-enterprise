import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  policyId: string;

  @IsDateString()
  incidentDate: string;

  @IsOptional()
  @IsString()
  description?: string;
}
