import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline/promises";
import { stdin, stdout } from "process";

const prisma = new PrismaClient();
const rl = readline.createInterface({ input: stdin, output: stdout });

async function promptUser(label: string) {
  console.log(`\n--- ${label} ---`);
  const name = await rl.question("Name: ");
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");

  if (!name || !email || !password) {
    throw new Error(`Missing input for ${label}. All fields are required.`);
  }

  return { name, email, password };
}

async function main() {
  const superAdminInput = await promptUser("SUPER ADMIN");
  const adminInput = await promptUser("ADMIN");

  rl.close();

  const users = [
    { ...superAdminInput, role: "SUPER_ADMIN" as const },
    { ...adminInput, role: "ADMIN" as const },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: hashedPassword,
        role: u.role,
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
      },
    });

    console.log(`✅ Seeded ${user.role}: ${user.email}`);
  }

  console.log("\n🌱 Seeding complete. Credentials were not saved anywhere.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });