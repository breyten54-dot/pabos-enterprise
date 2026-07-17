import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../iam/jwt-auth.guard';
import { PermissionsGuard } from '../iam/permissions.guard';
import { PolicyAdminController } from './policy-admin.controller';
import { PolicyAdminService } from './policy-admin.service';
import { LineOfBusiness } from '@prisma/client';

import request from 'supertest';

describe('PolicyAdminController (integration)', () => {
  let app: INestApplication;
  let policyAdminService: {
    findAll: jest.Mock;
    create: jest.Mock;
    addressChange: jest.Mock;
  };

  beforeEach(async () => {
    policyAdminService = {
      findAll: jest.fn().mockResolvedValue([{ id: 'policy-1' }]),
      create: jest.fn().mockResolvedValue({ id: 'policy-1', status: 'ACTIVE' }),
      addressChange: jest.fn().mockResolvedValue({ id: 'amendment-1' }),
    };

    const testUser = {
      userId: 'user-1',
      organisationId: 'org-1',
      email: 'test@praeto.co.za',
      roles: [],
      permissions: [],
    };

    const module = await Test.createTestingModule({
      controllers: [PolicyAdminController],
      providers: [{ provide: PolicyAdminService, useValue: policyAdminService }],
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

  const validPolicy = {
    clientId: 'client-1',
    policyNumber: 'POL001',
    lineOfBusiness: LineOfBusiness.MOTOR,
    inceptionDate: '2026-01-01',
    expiryDate: '2027-01-01',
  };

  const validAddressChange = {
    effectiveDate: '2026-07-01',
    newAddressLine1: '2 New Street',
    newCity: 'Cape Town',
    newPostalCode: '8001',
  };

  describe('GET /policies', () => {
    it('returns the policy list', async () => {
      const res = await request(app.getHttpServer()).get('/policies').expect(200);
      expect(res.body).toEqual([{ id: 'policy-1' }]);
      expect(policyAdminService.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /policies', () => {
    it('creates a policy with a valid DTO', async () => {
      const res = await request(app.getHttpServer())
        .post('/policies')
        .send(validPolicy)
        .expect(201);

      expect(res.body.id).toBe('policy-1');
      expect(policyAdminService.create).toHaveBeenCalledWith(
        expect.objectContaining({ policyNumber: 'POL001' }),
        expect.anything(),
      );
    });

    it('rejects an invalid DTO (missing clientId)', async () => {
      await request(app.getHttpServer())
        .post('/policies')
        .send({ lineOfBusiness: LineOfBusiness.MOTOR })
        .expect(400);

      expect(policyAdminService.create).not.toHaveBeenCalled();
    });

    it('propagates a NotFoundException from the service', async () => {
      policyAdminService.create.mockRejectedValue(new NotFoundException('Client not found'));

      await request(app.getHttpServer()).post('/policies').send(validPolicy).expect(404);
    });
  });

  describe('POST /policies/:id/endorsements/address-change', () => {
    it('creates an address-change endorsement with a valid DTO', async () => {
      const res = await request(app.getHttpServer())
        .post('/policies/policy-1/endorsements/address-change')
        .send(validAddressChange)
        .expect(201);

      expect(res.body.id).toBe('amendment-1');
      expect(policyAdminService.addressChange).toHaveBeenCalledWith(
        'policy-1',
        expect.objectContaining({ newCity: 'Cape Town' }),
        expect.anything(),
      );
    });

    it('rejects an invalid address-change DTO', async () => {
      await request(app.getHttpServer())
        .post('/policies/policy-1/endorsements/address-change')
        .send({ newCity: 'Cape Town' })
        .expect(400);

      expect(policyAdminService.addressChange).not.toHaveBeenCalled();
    });
  });
});
