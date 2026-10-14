import { PrismaClient } from "@prisma/client";

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

const prisma = new PrismaClient();

export default prisma;