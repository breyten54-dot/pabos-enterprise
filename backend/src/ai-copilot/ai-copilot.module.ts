import { Module } from '@nestjs/common';
import { AiCopilotService } from './ai-copilot.service';
import { AiCopilotController } from './ai-copilot.controller';

@Module({
  controllers: [AiCopilotController],
  providers: [AiCopilotService],
})
export class AiCopilotModule {}
