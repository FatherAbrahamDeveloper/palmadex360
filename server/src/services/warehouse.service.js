import { warehouseRepository as repo } from "../repositories/warehouse.repository.js";
import { HttpError } from "./product.service.js";

const toDto = (w) => ({
  id: w.id,
  name: w.name,
  code: w.code,
  city: w.city,
  state: w.state,
  address: w.address,
  isActive: w.isActive,
  stockItemCount: w._count?.stockLevels ?? 0,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

export const warehouseService = {
  async list(companyId) {
    return { data: (await repo.list(companyId)).map(toDto) };
  },

  async create(companyId, input) {
    return toDto(await repo.create({ ...input, companyId }));
  },

  async update(companyId, id, input) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Warehouse not found");
    return toDto(await repo.update(id, input));
  },

  async remove(companyId, id) {
    const existing = await repo.findById(companyId, id);
    if (!existing) throw new HttpError(404, "Warehouse not found");
    await repo.remove(id); // blocked by the database if it still holds stock items (P2003)
  },
};