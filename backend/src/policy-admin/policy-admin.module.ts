import { Module } from '@nestjs/common';
import { PolicyAdminService } from './policy-admin.service';
import { PolicyAdminController } from './policy-admin.controller';

@Module({
  controllers: [PolicyAdminController],
  providers: [PolicyAdminService],
})
export class PolicyAdminModule {}
