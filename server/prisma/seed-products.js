
// Run: node prisma/seed-products.js
// Optional: COMPANY_ID=your-company-id node prisma/seed-products.js

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CATALOG = [
  ["Spices & Botanicals", "SPB", "ton", [
    "Dried Dry Split Ginger",
    "Dried Hibiscus Flowers",
    "Turmeric",
    "Chilli Pepper",
    "Stone Flowers",
    "Cassia Tora",
    "Bay Leaves*",
  ]],

  ["Grains, Seeds & Legumes", "GSL", "ton", [
    "Sesame Seeds",
    "Soya Beans",
    "Soybeans",
    "Soybean Meal",
    "Tiger Nuts",
    "Peanuts (Groundnuts)",
    "Cassava Flakes",
    "Pigeon Peas*",
  ]],

  ["Nuts & Kola", "NUT", "ton", [
    "Shea Nuts",
    "Raw Cashew Nuts",
    "Cashew Kernel Nuts",
    "Kolanuts*",
    "Bitter Kola*",
  ]],

  ["Cocoa", "COC", "ton", [
    "Cocoa",
    "Cocoa Beans*",
  ]],

  ["Oils & Fats", "OIL", "ton", [
    "Palm Oil",
    "Shea Butter",
  ]],

  ["Timber & Wood", "TMB", "m3", [
    "Wood",
    "Tali",
    "Eku",
    "Iroko",
    "Bubinga",
    "Doussie",
  ]],

  ["Gums & Resins", "GUM", "ton", [
    "Gum Arabic",
  ]],

  ["By-products & Biomass", "BIO", "ton", [
    "Charcoal",
    "Shea Nut Shells*",
    "Cocoa Bean Shells*",
  ]],

  ["Services", "SVC", "service", [
    "Export Consultants",
  ]],
];

async function main() {
  console.log("Starting product catalogue seeding...");

  const companies = process.env.COMPANY_ID
    ? await prisma.company.findMany({
        where: { id: process.env.COMPANY_ID },
      })
    : await prisma.company.findMany({
        select: { id: true },
      });

  if (!companies.length) {
    throw new Error(
      "No company found. Create a company first or provide COMPANY_ID."
    );
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const [catName, prefix, unit, items] of CATALOG) {
    const category = await prisma.productCategory.upsert({
      where: {
        slug: slugify(catName),
      },
      update: {
        name: catName,
      },
      create: {
        name: catName,
        slug: slugify(catName),
      },
    });

    console.log(`Processing category: ${catName}`);

    for (const company of companies) {
      for (let i = 0; i < items.length; i++) {
        const isNew = items[i].endsWith("*");
        const name = items[i].replace(/\*$/, "");

        const sku = `${prefix}-${String(i + 1).padStart(3, "0")}`;

        const existing = await prisma.product.findUnique({
          where: {
            companyId_sku: {
              companyId: company.id,
              sku,
            },
          },
          select: { id: true },
        });

        await prisma.product.upsert({
          where: {
            companyId_sku: {
              companyId: company.id,
              sku,
            },
          },

          update: {
            name,
            categoryId: category.id,
            unit,
            currency: "USD",
            isNewListing: isNew,
          },

          create: {
            companyId: company.id,
            categoryId: category.id,
            name,
            sku,
            unit,
            currency: "USD",
            isNewListing: isNew,
          },
        });

        if (existing) {
          updatedCount++;
        } else {
          createdCount++;
        }
      }
    }
  }

  console.log("--------------------------------");
  console.log("PRODUCT SEEDING COMPLETED");
  console.log(`Companies: ${companies.length}`);
  console.log(`Products created: ${createdCount}`);
  console.log(`Products updated: ${updatedCount}`);
  console.log("--------------------------------");
}

main()
  .catch((error) => {
    console.error("Product seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
