import { PrismaClient } from "./src/generated/prisma/index.js";
const prisma = new PrismaClient();

async function main() {
  // Show all students & leaders in the DB
  const users = await prisma.user.findMany({
    where: { role: { in: ["STUDENT", "LEADER"] } },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, accountStatus: true },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  console.log(`Total STUDENT/LEADER accounts: ${users.length}`);
  console.log("--- Sample ---");
  users.slice(0, 10).forEach(u =>
    console.log(`${u.role.padEnd(8)} | ${u.accountStatus.padEnd(9)} | ${u.email.padEnd(30)} | "${u.firstName} ${u.lastName}"`)
  );
}

main().finally(() => prisma.$disconnect());
