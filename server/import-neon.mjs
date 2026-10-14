import fs from "node:fs";
import { Client } from "pg";

const file = `${process.env.USERPROFILE}\\Desktop\\data.sql`;
const sql = fs.readFileSync(file, "utf8");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const tables = [
  "AuditLog", "Company", "Conversation", "ConversationMember",
  "CRMContact", "CRMImportBatch", "CRMNote", "CRMStatusHistory",
  "File", "Message", "MessageAttachment", "Notification",
  "Product", "ProductCategory", "Supplier", "SupplierApplication",
  "SupplierDocument", "SupplierProduct",
  "SupplierVerificationHistory", "User"
];

function parseCopyBlocks(input) {
  const lines = input.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(
      /^COPY\s+public\._?([a-z]+)\s*\((.*)\)\s+FROM stdin;$/i
    );

    if (!match) {
      i++;
      continue;
    }

    const table = tables.find(
      t => t.toLowerCase() === match[1].toLowerCase()
    );

    if (!table) throw new Error(`Unknown table: ${match[1]}`);

    const columns = match[2];
    const data = [];
    i++;

    while (i < lines.length && lines[i] !== "\\.") {
      data.push(lines[i]);
      i++;
    }

    if (i >= lines.length) {
      throw new Error(`Incomplete COPY block for ${table}`);
    }

    blocks.push({ table, columns, data });
    i++;
  }

  return blocks;
}

const blocks = parseCopyBlocks(sql);

if (!blocks.length) {
  throw new Error("No PostgreSQL COPY blocks found in data.sql");
}

console.log("COPY blocks found:", blocks.length);
console.log("Tables:", blocks.map(b => b.table).join(", "));
console.log("This script is a diagnostic only; no data has been written.");