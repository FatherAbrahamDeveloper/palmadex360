import { productRepository } from "../repositories/product.repository.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const num = (v) => (v === null || v === undefined ? null : Number(v));

const computeStatus = (p) => {
  if (!p.isActive) return "INACTIVE";
  return Number(p.stockQuantity) <= 0 ? "OUT_OF_STOCK" : "ACTIVE";
};

const toDto = (p) => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  description: p.description,
  categoryId: p.categoryId,
  category: p.category || null,
  unit: p.unit,
  price: num(p.price),
  priceUpdatedAt: p.priceUpdatedAt,
  currency: p.currency,
  stockQuantity: Number(p.stockQuantity),
  minimumOrderQuantity: num(p.minimumOrderQuantity),
  hsCode: p.hsCode,
  originCountry: p.originCountry,
  packaging: p.packaging,
  specifications: p.specifications,
  isNewListing: p.isNewListing,
  isActive: p.isActive,
  status: computeStatus(p),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

async function generateSku(companyId, name) {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PRD";
  const existing = await productRepository.findSkusByPrefix(companyId, prefix);

  const max = existing.reduce((m, { sku }) => {
    const n = parseInt(sku.split("-")[1], 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function buildWhere(companyId, { search, categoryId, status }) {
  const where = { companyId };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;

  if (status === "active") {
    Object.assign(where, { isActive: true, stockQuantity: { gt: 0 } });
  }

  if (status === "out_of_stock") {
    Object.assign(where, { isActive: true, stockQuantity: { lte: 0 } });
  }

  if (status === "inactive") where.isActive = false;

  return where;
}

export const productService = {
  async list(companyId, query) {
    const { page, limit, sortBy, sortOrder } = query;

    const { items, total } = await productRepository.list({
      where: buildWhere(companyId, query),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data: items.map(toDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async get(companyId, id) {
    const product = await productRepository.findById(companyId, id);

    if (!product) throw new HttpError(404, "Product not found");

    return toDto(product);
  },

  // CREATE PRODUCT
  async create(companyId, input) {
    const data = {
      ...input,
      companyId,

      // Record when the initial FOB price is entered.
      priceUpdatedAt: input.price != null ? new Date() : null,
    };

    if (!data.sku) {
      data.sku = await generateSku(companyId, input.name);
    }

    return toDto(await productRepository.create(data));
  },

  // UPDATE PRODUCT
 async update(companyId, id, input) {
  const existing = await productRepository.findById(companyId, id);

  if (!existing) {
    throw new HttpError(404, "Product not found");
  }

  const priceWasProvided = Object.prototype.hasOwnProperty.call(
    input,
    "price"
  );

  const oldPrice =
    existing.price == null ? null : Number(existing.price).toFixed(2);

  const newPrice =
    input.price == null ? null : Number(input.price).toFixed(2);

  const priceChanged = priceWasProvided && oldPrice !== newPrice;

  const data = {
    ...input,

    ...(priceChanged && {
      priceUpdatedAt: new Date(),
    }),
  };

  return toDto(await productRepository.update(id, data));
},

  async remove(companyId, id) {
    const existing = await productRepository.findById(companyId, id);

    if (!existing) {
      throw new HttpError(404, "Product not found");
    }

    await productRepository.remove(id);
  },

  categories: () => productRepository.listCategories(),
};