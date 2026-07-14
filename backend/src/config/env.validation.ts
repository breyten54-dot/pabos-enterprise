import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsNumber()
  @IsOptional()
  PORT?: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX?: string = '/api/v1';

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY?: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY?: string = '7d';

  @IsString()
  @IsOptional()
  TOTP_ISSUER?: string = 'PABOS';

  @IsString()
  @IsOptional()
  OLLAMA_BASE_URL?: string = 'http://localhost:11434';

  @IsString()
  @IsOptional()
  OLLAMA_MODEL?: string = 'llama3.2';

  @IsString()
  @IsOptional()
  MINIO_ENDPOINT?: string = 'localhost';

  @IsNumber()
  @IsOptional()
  MINIO_PORT?: number = 9000;

  @IsBoolean()
  @IsOptional()
  MINIO_USE_SSL?: boolean = false;

  @IsString()
  @IsOptional()
  MINIO_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  MINIO_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  MINIO_BUCKET_DOCUMENTS?: string = 'pabos-documents';

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number = 587;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string = 'noreply@praeto.local';

  @IsBoolean()
  @IsOptional()
  SMS_PROVIDER_STUB?: boolean = true;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.toString()).join('\n'));
  }
  return validated;
}
