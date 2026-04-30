//what does this file do? It sets up and manages the database connection using Prisma ORM. It exports the PrismaClient instance and functions to connect and disconnect from the database.
// prisma دي حاجة بتريط بين الdb والapp

import { PrismaClient } from "../generated/prisma/index.js";

export const prisma = new PrismaClient();

export async function dbConnect() {
  await prisma.$connect();
  console.log("✅ DB connected");
}

export async function dbDisconnect() {
  await prisma.$disconnect();
  console.log("🛑 DB disconnected");
}
