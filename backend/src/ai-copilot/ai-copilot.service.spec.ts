import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiCopilotService } from './ai-copilot.service';

describe('AiCopilotService', () => {
  let service: AiCopilotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCopilotService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'OLLAMA_BASE_URL') return 'http://localhost:11434';
              if (key === 'OLLAMA_MODEL') return 'llama3.2';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get<AiCopilotService>(AiCopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('masks RSA ID numbers', () => {
    const input = 'My ID is 9001015001087 and I need car insurance.';
    const masked = service.maskPii(input);
    expect(masked).toContain('[RSA_ID]');
    expect(masked).not.toContain('9001015001087');
  });

  it('returns fallback result when Ollama is unreachable', async () => {
    const result = await service.intake('I want a new motor policy.');
    expect(result.maskedInput).toBeDefined();
    expect(result.activityCode).toBe('MANUAL_REVIEW');
    expect(result.complianceFlags.length).toBeGreaterThan(0);
  });
});
