import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface IntakeResult {
  maskedInput: string;
  summary: string;
  activityCode: string;
  tasks: string[];
  missingInfo: string[];
  draftResponse: string;
  complianceFlags: string[];
}

@Injectable()
export class AiCopilotService {
  private readonly logger = new Logger(AiCopilotService.name);

  constructor(private readonly configService: ConfigService) {}

  maskPii(input: string): string {
    return input
      .replace(/\b\d{13}\b/g, '[RSA_ID]')
      .replace(/\b\d{2,3}\s?\d{3,4}\s?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b[A-Z]{2,3}\s?\d{3,4}\s?[A-Z]{0,2}\b/g, '[REG_NUMBER]')
      .replace(/\b\d{3}\s?\d{3}\s?\d{4}\b/g, '[POLICY_NUMBER]')
      .replace(/\b(?:[A-Z][a-z]+\s?){1,3}(?=[^a-zA-Z]*\d)/g, '[NAME]')
      .replace(/\b\d+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\b/g, '[ADDRESS]');
  }

  async intake(rawMessage: string, context?: string): Promise<IntakeResult> {
    const maskedInput = this.maskPii(rawMessage);
    const model = this.configService.get('OLLAMA_MODEL') || 'llama3.2';
    const baseUrl = this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434';

    const prompt = this.buildPrompt(maskedInput, context);

    try {
      const response = await this.ollamaGenerate(baseUrl, model, prompt);
      const parsed = this.parseModelOutput(response);
      return {
        maskedInput,
        ...parsed,
      };
    } catch (error) {
      this.logger.warn(`Ollama call failed: ${error.message}. Returning fallback.`);
      return {
        maskedInput,
        summary: 'AI intake service is unavailable; manual triage required.',
        activityCode: 'MANUAL_REVIEW',
        tasks: ['Review intake manually', 'Capture missing information'],
        missingInfo: ['Unable to determine due to service unavailability'],
        draftResponse: 'Thank you for your message. A consultant will respond shortly.',
        complianceFlags: ['AI output unverified - human approval required'],
      };
    }
  }

  private buildPrompt(maskedMessage: string, context?: string): string {
    return `You are an insurance brokerage intake assistant. Analyse the masked client message below and return a single JSON object with these exact keys: summary, activityCode, tasks (array), missingInfo (array), draftResponse, complianceFlags (array).

Context: ${context || 'General brokerage intake'}

Message: """${maskedMessage}"""

Guidance:
- activityCode should be one of: NEW_POLICY_MOTOR, ENDORSEMENT_ADDRESS_CHANGE, CLAIM_REGISTER, or MANUAL_REVIEW.
- complianceFlags should include POPIA/FAIS/FICA/TCF considerations where relevant.
- draftResponse must be professional and end with a note that it requires human approval.

Respond with JSON only.`;
  }

  private parseModelOutput(raw: string): Omit<IntakeResult, 'maskedInput'> {
    try {
      const cleaned = raw
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: String(parsed.summary || ''),
        activityCode: String(parsed.activityCode || 'MANUAL_REVIEW'),
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(String) : [],
        missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo.map(String) : [],
        draftResponse: String(parsed.draftResponse || ''),
        complianceFlags: Array.isArray(parsed.complianceFlags)
          ? parsed.complianceFlags.map(String)
          : [],
      };
    } catch {
      return {
        summary: 'Could not parse AI output',
        activityCode: 'MANUAL_REVIEW',
        tasks: ['Review AI output manually'],
        missingInfo: ['AI output parse failed'],
        draftResponse: 'Thank you for your message. A consultant will review and respond.',
        complianceFlags: ['AI output parse failed - human approval required'],
      };
    }
  }

  private ollamaGenerate(baseUrl: string, model: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${baseUrl}/api/generate`);
      const payload = JSON.stringify({ model, prompt, stream: false, format: 'json' });
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 60000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                resolve(json.response || '{}');
              } catch {
                resolve(data);
              }
            } else {
              reject(new Error(`Ollama returned ${res.statusCode}: ${data}`));
            }
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ollama request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }
}
