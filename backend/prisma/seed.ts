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

  await prisma.product.upsert({
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
