import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BrandVoice AI database...');

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@brandvoice.ai' },
    update: {},
    create: {
      email: 'demo@brandvoice.ai',
      name: 'Sarah Connor',
      passwordHash,
      isEmailVerified: true,
    },
  });

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'pro',
    },
  });

  // 3. Member
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  });

  // 4. Brand
  let brand = await prisma.brand.findFirst({ where: { organizationId: org.id } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: 'Acme Corp',
        websiteUrl: 'https://acme.com',
        industry: 'SaaS / B2B Software',
        description: 'Enterprise workflow automation platform that empowers operations teams to streamline repetitive processes.',
        targetAudience: 'Operations Managers, CTOs, and Enterprise team leads seeking high productivity.',
        productsServices: 'AI Workflow Engine, Smart Form Automation, Integration Hub',
        organizationId: org.id,
      },
    });
  }

  // 5. Brand Guidelines
  const existingGuideline = await prisma.brandGuideline.findFirst({ where: { brandId: brand.id } });
  if (!existingGuideline) {
    await prisma.brandGuideline.create({
      data: {
        brandId: brand.id,
        identity: 'Acme Corp is an enterprise workflow automation platform dedicated to empowering operations teams.',
        mission: 'Eliminate friction from work by providing intelligent, seamless automation for modern businesses.',
        values: 'Customer empowerment, ruthless simplicity, engineering excellence, and transparency.',
        personality: 'Visionary, reliable, confident, and approachable.',
        toneOfVoice: 'Professional, empowering, data-driven with human warmth. Confident without being aggressive.',
        writingPrinciples: 'Lead with value. Use active voice. Keep sentences concise (15–25 words). Avoid empty buzzwords.',
        preferredVocabulary: ['empower', 'streamline', 'scale', 'intelligent', 'seamless', 'enterprise-grade', 'optimize', 'transform'],
        prohibitedVocabulary: ['cheap', 'basic', 'simple', 'just', 'easy', 'obviously', 'simply'],
        isApproved: true,
      },
    });
  }

  // 6. Brand Preferences
  await prisma.brandPreference.upsert({
    where: { brandId: brand.id },
    update: {},
    create: {
      brandId: brand.id,
      professional: 65,
      friendly: 70,
      innovative: 58,
      simple: 55,
      persuasive: 72,
      emotional: 45,
    },
  });

  // 7. Seed Sample Content
  const sampleCount = await prisma.content.count({ where: { brandId: brand.id } });
  if (sampleCount === 0) {
    await prisma.content.createMany({
      data: [
        {
          brandId: brand.id,
          title: 'Q4 Product Launch – Instagram',
          platform: 'INSTAGRAM',
          contentType: 'POST',
          status: 'APPROVED',
          consistencyScore: 92,
          content: '🚀 Transform the way your team works.\n\nRepetitive tasks are holding your best people back. Acme Corp empowers operations leaders to streamline workflows, scale without overhead, and deliver enterprise-grade performance.\n\nDiscover how leading teams save 14+ hours every week.\n👉 Link in bio to start your free 14-day trial.\n\n#EnterpriseAI #WorkflowAutomation #Productivity #FutureOfWork',
        },
        {
          brandId: brand.id,
          title: 'LinkedIn Thought Leadership',
          platform: 'LINKEDIN',
          contentType: 'POST',
          status: 'APPROVED',
          consistencyScore: 88,
          content: 'Most workflow inefficiencies don\'t come from complex problems.\n\nThey come from small, repetitive manual tasks that compound across teams.\n\nWhen we built Acme Corp, our goal was simple: empower operations leaders to automate friction without writing a single line of code.\n\nThe result? Teams scale their impact without scaling headcount.\n\nHow is your organization approaching intelligent automation this quarter?\n\n#Leadership #Operations #Automation #BusinessGrowth',
        },
        {
          brandId: brand.id,
          title: 'Welcome Email Campaign',
          platform: 'EMAIL',
          contentType: 'EMAIL',
          status: 'APPROVED',
          consistencyScore: 94,
          content: 'Subject Line: Welcome to Acme Corp — Let\'s automate your first workflow\nPreview Text: 3 quick steps to streamline your operations\n\nHi there,\n\nWelcome to Acme Corp! We\'re thrilled to empower your team on your journey toward seamless workflow automation.\n\nHere is how to get started in under 5 minutes:\n1. Connect your primary workspace tools\n2. Select a pre-built automation template\n3. Activate your first automated workflow\n\nReady to scale? Click below to launch your dashboard.\n\n[Launch Acme Corp]',
        },
      ],
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

