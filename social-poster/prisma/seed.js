const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERUSER_EMAIL || 'admin@socialposter.local';
  const password = process.env.SUPERUSER_PASSWORD || 'change-me-to-a-strong-password';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('SuperUser already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: 'SuperUser',
      passwordHash,
      systemRole: 'SUPERUSER',
    },
  });

  console.log('SuperUser created:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
