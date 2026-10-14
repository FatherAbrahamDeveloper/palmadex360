import bcrypt from "bcrypt";
import prisma from "./src/config/prisma.js";

const email = "admin@renamy.com";
const password = "Password123";

const company = await prisma.company.upsert({
  where: {
    email: "admin@renamy.com",
  },
  update: {},
  create: {
    name: "Renamy",
    email: "admin@renamy.com",
  },
});

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: {
    email,
  },
  update: {
    passwordHash,
    companyId: company.id,
    role: "SUPER_ADMIN",
    isActive: true,
  },
  create: {
    firstName: "Admin",
    lastName: "User",
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    companyId: company.id,
  },
});

console.log("User created/updated:");
console.log({
  id: user.id,
  email: user.email,
  companyId: user.companyId,
  role: user.role,
});

await prisma.$disconnect();
