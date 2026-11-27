import prisma from "../config/prisma.js";
import {
  DEFAULT_PERMISSIONS, MODULE_IDS, ROLE_IDS, ACCESS_LEVELS, atLeast,
} from "../config/access.js";
import { HttpError } from "../utils/httpError.js";

// companyId -> { role -> { module -> level } }. Cleared whenever the matrix changes.
const cache = new Map();

async function loadMatrix(companyId) {
  if (cache.has(companyId)) return cache.get(companyId);
  const rows = await prisma.rolePermission.findMany({ where: { companyId } });
  const matrix = {};
  for (const role of ROLE_IDS) matrix[role] = { ...DEFAULT_PERMISSIONS[role] };
  for (const row of rows) {
    if (row.role === "SUPER_ADMIN") continue;
    if (matrix[row.role] && MODULE_IDS.includes(row.module)) matrix[row.role][row.module] = row.access;
  }
  cache.set(companyId, matrix);
  return matrix;
}

export const permissionService = {
  async forRole(companyId, role) {
    const matrix = await loadMatrix(companyId);
    return { ...(matrix[role] || {}) };
  },

  async can(user, module, level = "VIEW") {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    const perms = user.permissions || (await this.forRole(user.companyId, user.role));
    return atLeast(perms[module] || "NONE", level);
  },

  async matrix(companyId) {
    const matrix = await loadMatrix(companyId);
    return ROLE_IDS.map((role) => ({ role, permissions: { ...matrix[role] } }));
  },

  // changes: [{ role, module, access }]
  async update(companyId, changes) {
    for (const c of changes) {
      if (!ROLE_IDS.includes(c.role) || !MODULE_IDS.includes(c.module) || !ACCESS_LEVELS.includes(c.access)) {
        throw new HttpError(400, "Invalid permission change");
      }
      if (c.role === "SUPER_ADMIN") throw new HttpError(400, "Super Admin access cannot be reduced");
      if (c.role === "CUSTOMER" && !["portal", "communication", "support", "knowledge"].includes(c.module) && c.access !== "NONE") {
        throw new HttpError(400, "Customers can only be given the portal, messages, support and knowledge base");
      }
    }
    await prisma.$transaction(
      changes.map((c) =>
        prisma.rolePermission.upsert({
          where: { companyId_role_module: { companyId, role: c.role, module: c.module } },
          update: { access: c.access },
          create: { companyId, role: c.role, module: c.module, access: c.access },
        })
      )
    );
    cache.delete(companyId);
    return this.matrix(companyId);
  },

  async reset(companyId, role) {
    await prisma.rolePermission.deleteMany({ where: { companyId, ...(role ? { role } : {}) } });
    cache.delete(companyId);
    return this.matrix(companyId);
  },

  clearCache: () => cache.clear(),
};
