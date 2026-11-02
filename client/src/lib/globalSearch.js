
import { MODULES } from "@/lib/RoleConfig";

export function globalModuleSearch(query, role) {
  if (!query?.trim() || !role) return [];

  const searchTerm = query.toLowerCase().trim();

  return MODULES
    .filter((module) => module.roles.includes(role))
    .map((module) => ({
      ...module,
      searchText: `${module.label} ${module.id}`.toLowerCase(),
    }))
    .filter((module) => {
      return module.searchText.includes(searchTerm);
    })
    .slice(0, 8);
}
