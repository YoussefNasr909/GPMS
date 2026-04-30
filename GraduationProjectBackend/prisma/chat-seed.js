import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = "demo123";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("Seeding 20 test users for chat...");

  const departments = [
    "COMPUTER_SCIENCE",
    "SOFTWARE_ENGINEERING",
    "INFORMATION_TECHNOLOGY",
    "COMPUTER_ENGINEERING",
    "DATA_SCIENCE",
  ];

  for (let i = 1; i <= 20; i++) {
    const user = {
      firstName: `TestUser${i}`,
      lastName: "Student",
      email: `testuser${i}@student.edu`,
      role: "STUDENT",
      academicId: `TEST-00${i.toString().padStart(2, "0")}`,
      phone: `010000020${i.toString().padStart(2, "0")}`,
      department: departments[i % departments.length],
      academicYear: "YEAR_3",
      preferredTrack: "FULLSTACK_DEVELOPMENT",
      bio: `Hi, I am test user ${i}. I'm here to test the cross-team chatting functionality.`,
    };

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...user,
        accountStatus: "ACTIVE",
        passwordHash,
        isEmailVerified: true,
      },
      create: {
        ...user,
        accountStatus: "ACTIVE",
        passwordHash,
        isEmailVerified: true,
      },
    });
    
    console.log(`Upserted user: ${user.email}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    console.log("You can login to any test user using password: demo123");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
