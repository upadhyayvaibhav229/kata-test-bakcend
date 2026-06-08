// prisma/seed.ts
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a sample form
  const form = await prisma.form.upsert({
    where: { id: "seed-form-1" },
    update: {},
    create: {
      id:        "seed-form-1",
      name:      "Shotokan Championship 2026",
      startDate: "2026-06-01",
      endDate:   "2026-07-31",
      active:    true,
    },
  });

  console.log("Created form:", form.name);

  // Create sample registrations
  const regs = [
    {
      formId:      form.id,
      studentName: "Arjun Sharma",
      age:         14,
      phone:       "9876543210",
      parentPhone: "9876543211",
      branch:      "Andheri",
      belt:        "yellow",
      kata1:       "Taikyoku Shodan",
      kata2:       "Taikyoku Nidan",
      kata3:       "Heian Shodan",
    },
    {
      formId:      form.id,
      studentName: "Priya Patel",
      age:         12,
      phone:       "9123456789",
      parentPhone: "9123456780",
      branch:      "Bandra",
      belt:        "green",
      kata1:       "Heian Shodan",
      kata2:       "Heian Nidan",
      kata3:       "Heian Sandan",
    },
  ];

  for (const r of regs) {
    await prisma.registration.create({ data: r });
    console.log("Registered:", r.studentName);
  }

  console.log("Seeding done ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
