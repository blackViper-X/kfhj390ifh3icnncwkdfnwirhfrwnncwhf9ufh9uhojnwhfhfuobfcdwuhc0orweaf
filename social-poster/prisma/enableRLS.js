const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableRLS() {
  console.log('Enabling Row Level Security...');

  const tables = [
    'companies',
    'company_memberships',
    'company_platform_configs',
    'social_accounts',
    'oauth_credentials',
    'posts',
    'post_targets',
    'post_versions',
    'media',
    'media_variants',
    'publications',
    'publication_targets',
    'publishing_attempts',
    'comments',
    'conversations',
    'messages',
    'analytics_snapshots',
    'audit_logs',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      console.log(`RLS enabled for ${table}`);
    } catch (error) {
      console.warn(`Failed to enable RLS for ${table}: ${error.message}`);
    }
  }

  console.log('RLS setup complete');
}

enableRLS()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
