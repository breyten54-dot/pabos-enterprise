import { IsString, IsOptional } from 'class-validator';

export class IntakeDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string;
}
