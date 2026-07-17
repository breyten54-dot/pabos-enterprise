import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { ClientType, IdType } from '@prisma/client';

import request from 'supertest';

describe('CrmController (integration)', () => {
  let app: INestApplication;
  let crmService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    crmService = {
      create: jest.fn().mockResolvedValue({ id: 'client-1', firstName: 'Jane' }),
      findAll: jest.fn().mockResolvedValue([{ id: 'client-1' }]),
      findOne: jest.fn().mockResolvedValue({ id: 'client-1' }),
    };

    const testUser = {
      userId: 'user-1',
      organisationId: 'org-1',
      email: 'test@praeto.co.za',
      roles: [],
      permissions: [],
    };

    const module = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [{ provide: CrmService, useValue: crmService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = testUser;
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const validClient = {
    type: ClientType.INDIVIDUAL,
    idType: IdType.RSA_ID,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
  };

  describe('POST /clients', () => {
    it('creates a client with a valid DTO', async () => {
      const res = await request(app.getHttpServer()).post('/clients').send(validClient).expect(201);

      expect(res.body.id).toBe('client-1');
      expect(crmService.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane' }),
        expect.anything(),
      );
    });

    it('rejects an invalid DTO (missing required type)', async () => {
      const invalid = { firstName: 'Jane' };
      await request(app.getHttpServer()).post('/clients').send(invalid).expect(400);

      expect(crmService.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /clients', () => {
    it('returns the list from the service', async () => {
      const res = await request(app.getHttpServer()).get('/clients').expect(200);
      expect(res.body).toEqual([{ id: 'client-1' }]);
      expect(crmService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /clients/:id', () => {
    it('returns a single client', async () => {
      const res = await request(app.getHttpServer()).get('/clients/client-1').expect(200);
      expect(res.body.id).toBe('client-1');
      expect(crmService.findOne).toHaveBeenCalledWith('client-1', expect.anything());
    });
  });
});
