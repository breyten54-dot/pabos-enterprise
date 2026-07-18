import { PrismaClient, AmendmentType, ClaimStatus, ConsentPurpose, KnowledgeCategory, LineOfBusiness, NotificationChannel, PolicyStatus, TaskPriority, TaskStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const demoOrgName = 'Praeto Demo';
  const adminEmail = 'admin@praeto.local';

  let organisation = await prisma.organisation.findFirst({
    where: { name: demoOrgName },
  });

  if (!organisation) {
    organisation = await prisma.organisation.create({
      data: {
        name: demoOrgName,
        legalName: 'Praeto Risk & Insurance Management Solutions (Demo)',
      },
    });
    console.log(`Created organisation: ${organisation.name} (${organisation.id})`);
  }

  let branch = await prisma.branch.findFirst({
    where: { organisationId: organisation.id, code: 'DBN' },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        organisationId: organisation.id,
        name: 'Durban',
        code: 'DBN',
      },
    });
    console.log(`Created branch: ${branch.name} (${branch.id})`);
  }

  // Seed permissions
  const permissionSeeds = [
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'user', action: 'delete' },
    { resource: 'client', action: 'create' },
    { resource: 'client', action: 'read' },
    { resource: 'client', action: 'update' },
    { resource: 'client', action: 'delete' },
    { resource: 'policy', action: 'create' },
    { resource: 'policy', action: 'read' },
    { resource: 'policy', action: 'update' },
    { resource: 'policy', action: 'delete' },
    { resource: 'policy', action: 'amend' },
    { resource: 'claim', action: 'create' },
    { resource: 'claim', action: 'read' },
    { resource: 'claim', action: 'update' },
    { resource: 'claim', action: 'settle' },
    { resource: 'task', action: 'create' },
    { resource: 'task', action: 'read' },
    { resource: 'task', action: 'update' },
    { resource: 'report', action: 'executive' },
    { resource: 'knowledge', action: 'create' },
    { resource: 'knowledge', action: 'read' },
    // Frontend route guard for /ai-intake requires 'ai:use' (App.tsx); the Admin role
    // receives every permission in this list, so seeding it opens the page for the demo admin.
    { resource: 'ai', action: 'use' },
  ];

  const permissions = await Promise.all(
    permissionSeeds.map(async (p) =>
      prisma.permission.upsert({
        where: {
          organisationId_resource_action: {
            organisationId: organisation.id,
            resource: p.resource,
            action: p.action,
          },
        },
        update: {},
        create: {
          organisationId: organisation.id,
          resource: p.resource,
          action: p.action,
        },
      }),
    ),
  );
  console.log(`Ensured ${permissions.length} permissions`);

  // Admin role
  let adminRole = await prisma.role.findFirst({
    where: { organisationId: organisation.id, name: 'Admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        organisationId: organisation.id,
        name: 'Admin',
        description: 'System administrator with full access',
        isSystem: true,
      },
    });
  }

  // Assign all permissions to admin
  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );
  console.log(`Assigned all permissions to Admin role`);

  // Admin user
  let adminUser = await prisma.user.findUnique({
    where: {
      organisationId_email: {
        organisationId: organisation.id,
        email: adminEmail,
      },
    },
  });

  if (!adminUser) {
    const passwordHash = await argon2.hash('Admin1234!');
    adminUser = await prisma.user.create({
      data: {
        organisationId: organisation.id,
        branchId: branch.id,
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        mfaEnabled: false,
      },
    });
    console.log(`Created admin user: ${adminUser.email}`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Activity codes
  const activityCodes = [
    {
      code: 'NEW_POLICY_MOTOR',
      name: 'New Policy - Motor',
      description: 'Capture a new personal lines motor policy',
      lineOfBusiness: LineOfBusiness.MOTOR,
      defaultSlaMinutes: 240,
      department: 'Personal Lines',
    },
    {
      code: 'ENDORSEMENT_ADDRESS_CHANGE',
      name: 'Endorsement - Address Change',
      description: 'Process a risk or postal address change endorsement',
      lineOfBusiness: null,
      defaultSlaMinutes: 120,
      department: 'Policy Administration',
    },
    {
      code: 'CLAIM_REGISTER',
      name: 'Claim Registration',
      description: 'Register a new claim against an active policy',
      lineOfBusiness: null,
      defaultSlaMinutes: 60,
      department: 'Claims',
    },
  ];

  await Promise.all(
    activityCodes.map((ac) =>
      prisma.activityCode.upsert({
        where: {
          organisationId_code: {
            organisationId: organisation.id,
            code: ac.code,
          },
        },
        update: {},
        create: {
          organisationId: organisation.id,
          code: ac.code,
          name: ac.name,
          description: ac.description,
          lineOfBusiness: ac.lineOfBusiness,
          defaultSlaMinutes: ac.defaultSlaMinutes,
          department: ac.department,
        },
      }),
    ),
  );
  console.log(`Ensured ${activityCodes.length} activity codes`);

  // Demo insurer and product
  const demoInsurer = await prisma.insurer.upsert({
    where: {
      organisationId_code: {
        organisationId: organisation.id,
        code: 'DEMO_INS',
      },
    },
    update: {},
    create: {
      organisationId: organisation.id,
      name: 'Demo Insurance Limited',
      code: 'DEMO_INS',
      contactEmail: 'support@demoinsure.local',
      isActive: true,
    },
  });

  const demoProduct = await prisma.product.upsert({
    where: {
      organisationId_code: {
        organisationId: organisation.id,
        code: 'MOTOR_COMP',
      },
    },
    update: {},
    create: {
      organisationId: organisation.id,
      insurerId: demoInsurer.id,
      name: 'Motor Comprehensive',
      code: 'MOTOR_COMP',
      lineOfBusiness: LineOfBusiness.MOTOR,
      description: 'Comprehensive motor insurance for private vehicles',
      isActive: true,
    },
  });

  // Knowledge article stub
  await prisma.knowledgeArticle.upsert({
    where: {
      organisationId_slug: {
        organisationId: organisation.id,
        slug: 'motor-new-policy-checklist',
      },
    },
    update: {},
    create: {
      organisationId: organisation.id,
      category: KnowledgeCategory.SOP,
      title: 'Motor New Policy Checklist',
      slug: 'motor-new-policy-checklist',
      content: 'Verify client identity, capture vehicle details, confirm cover, issue policy schedule.',
      lineOfBusiness: LineOfBusiness.MOTOR,
      tags: ['motor', 'new policy', 'checklist'],
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // ---------------------------------------------------------------------------
  // K-12 demo records — SYNTHETIC only (obviously-fake test values, no real PII).
  // Every record is keyed on a stable natural key and found-before-created, so
  // re-running this seed (every Render boot) NEVER creates duplicates.
  // ---------------------------------------------------------------------------

  // ~3 sample clients (stable key: organisationId + email — Client has no unique
  // email constraint, so findFirst-then-create is the idempotent pattern here).
  const demoClients = [
    {
      email: 'demo+thabo@praeto.local',
      firstName: 'Thabo',
      lastName: 'Mokoena',
      phone: '+27 82 000 0001',
      idNumber: '9001010000001',
      addressLine1: '12 Jacaranda Street',
      suburb: 'Morningside',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
    },
    {
      email: 'demo+aisha@praeto.local',
      firstName: 'Aisha',
      lastName: 'Patel',
      phone: '+27 83 000 0002',
      idNumber: '8512120000002',
      addressLine1: '78 Marine Parade',
      suburb: 'North Beach',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
    },
    {
      email: 'demo+johan@praeto.local',
      firstName: 'Johan',
      lastName: 'van der Merwe',
      phone: '+27 84 000 0003',
      idNumber: '7803030000003',
      addressLine1: '5 Ridge Road',
      suburb: 'Berea',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
    },
  ];

  const clientIds: Record<string, string> = {};
  for (const c of demoClients) {
    let client = await prisma.client.findFirst({
      where: { organisationId: organisation.id, email: c.email },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          organisationId: organisation.id,
          branchId: branch.id,
          type: 'INDIVIDUAL',
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          idNumber: c.idNumber,
          idType: 'RSA_ID',
          addressLine1: c.addressLine1,
          suburb: c.suburb,
          city: c.city,
          province: c.province,
          postalCode: c.postalCode,
          country: 'ZA',
          notes: 'Synthetic demo record (K-12) — not a real person.',
        },
      });
    }
    clientIds[c.email] = client.id;
  }

  // ~3 sample policies across those clients (stable key: organisationId + policyNumber,
  // which has a real @@unique constraint — plain upsert).
  const demoPolicies = [
    {
      policyNumber: 'DEMO-0001',
      clientEmail: 'demo+thabo@praeto.local',
      lineOfBusiness: LineOfBusiness.MOTOR,
      withProduct: true,
      sumInsured: 350000,
      premium: 1250.0,
      notes: 'Synthetic demo policy (K-12) — motor comprehensive.',
    },
    {
      policyNumber: 'DEMO-0002',
      clientEmail: 'demo+aisha@praeto.local',
      lineOfBusiness: LineOfBusiness.HOME,
      withProduct: false,
      sumInsured: 1200000,
      premium: 890.5,
      notes: 'Synthetic demo policy (K-12) — home contents.',
    },
    {
      policyNumber: 'DEMO-0003',
      clientEmail: 'demo+johan@praeto.local',
      lineOfBusiness: LineOfBusiness.COMMERCIAL,
      withProduct: false,
      sumInsured: 2500000,
      premium: 4300.75,
      notes: 'Synthetic demo policy (K-12) — small business.',
    },
  ];

  const policyIds: Record<string, string> = {};
  for (const p of demoPolicies) {
    const policy = await prisma.policy.upsert({
      where: {
        organisationId_policyNumber: {
          organisationId: organisation.id,
          policyNumber: p.policyNumber,
        },
      },
      update: {},
      create: {
        organisationId: organisation.id,
        branchId: branch.id,
        clientId: clientIds[p.clientEmail],
        insurerId: demoInsurer.id,
        productId: p.withProduct ? demoProduct.id : null,
        policyNumber: p.policyNumber,
        lineOfBusiness: p.lineOfBusiness,
        status: 'ACTIVE',
        inceptionDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-01-01'),
        sumInsured: p.sumInsured,
        premium: p.premium,
        riskCity: 'Durban',
        riskProvince: 'KwaZulu-Natal',
        riskCountry: 'ZA',
        notes: p.notes,
      },
    });
    policyIds[p.policyNumber] = policy.id;
  }

  // 1 sample address-change endorsement on DEMO-0001 (stable key: policyId + subType —
  // PolicyAmendment has no unique constraint, so findFirst-then-create).
  const existingEndorsement = await prisma.policyAmendment.findFirst({
    where: { policyId: policyIds['DEMO-0001'], subType: 'ADDRESS_CHANGE' },
  });
  if (!existingEndorsement) {
    await prisma.policyAmendment.create({
      data: {
        policyId: policyIds['DEMO-0001'],
        organisationId: organisation.id,
        branchId: branch.id,
        type: 'ENDORSEMENT',
        subType: 'ADDRESS_CHANGE',
        effectiveDate: new Date('2026-07-15'),
        previousValues: { addressLine1: '12 Jacaranda Street', suburb: 'Morningside', city: 'Durban', postalCode: '4001' },
        proposedValues: { addressLine1: '45 Palm Avenue', suburb: 'Umhlanga', city: 'Durban', postalCode: '4319' },
        reason: 'Client relocated — synthetic demo endorsement (K-12).',
        status: 'PENDING',
        createdById: adminUser.id,
      },
    });
  }

  console.log(
    `Ensured ${demoClients.length} demo clients, ${demoPolicies.length} demo policies, 1 demo endorsement (synthetic)`,
  );

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
