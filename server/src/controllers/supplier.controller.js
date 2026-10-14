import * as supplierService from "../services/supplier.service.js";
import { validateSupplier } from "../validators/supplier.validator.js";

const writableFields = [
  "companyName",
  "tradingName",
  "businessType",
  "description",
  "establishedDate",
  "registrationStatus",
  "registrationNumber",
  "registrationCountry",
  "taxIdentificationNumber",
  "registrationAuthority",
  "email",
  "phone",
  "alternativePhone",
  "website",
  "contactPerson",
  "contactJobTitle",
  "country",
  "stateOrRegion",
  "city",
  "address",
  "warehouseAddress",
  "hasExportedBefore",
  "exportExperienceYears",
  "previousExportCountries",
  "exportDestinations",
  "logisticsCapabilities",
  "leadTimeDays",
  "qualityControlDescription",
  "traceabilityAvailable",
  "preferredPaymentTerms",
  "quotationCurrency",
  "tradeReferences",
];

function getCompanyId(req) {
  return req.user?.companyId;
}

function getUserId(req) {
  return req.user?.id;
}

function paginationValue(value, fallback, max) {
  const number = Number(value ?? fallback);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, max);
}

function pickWritableFields(body) {
  return Object.fromEntries(
    writableFields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]])
  );
}

function handleError(error, res, next) {
  if (error.code === "P2025") {
    return res.status(404).json({
      message: "Supplier not found.",
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      message: "A record with one of these unique values already exists.",
    });
  }

  return next(error);
}

export async function list(req, res, next) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        message: "Company access is required.",
      });
    }

    const page = paginationValue(req.query.page, 1, 100000);
    const pageSize = paginationValue(req.query.pageSize, 20, 100);

    const result = await supplierService.listSuppliers({
      companyId,
      search: String(req.query.search ?? "").slice(0, 100),
      status: req.query.status || undefined,
      page,
      pageSize,
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        message: "Company access is required.",
      });
    }

    const supplier = await supplierService.getSupplier({
      companyId,
      supplierId: req.params.id,
    });

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found.",
      });
    }

    return res.json({ supplier });
  } catch (error) {
    return next(error);
  }
}

export async function create(req, res, next) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        message: "Company access is required.",
      });
    }

    const data = pickWritableFields(req.body);
    const errors = validateSupplier(data);

    if (errors.length) {
      return res.status(400).json({
        message: "Validation failed.",
        errors,
      });
    }

    const supplier = await supplierService.createSupplier({
      companyId,
      createdById: getUserId(req),
      data,
    });

    return res.status(201).json({ supplier });
  } catch (error) {
    return handleError(error, res, next);
  }
}

export async function update(req, res, next) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        message: "Company access is required.",
      });
    }

    const data = pickWritableFields(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Provide at least one editable supplier field.",
      });
    }

    const errors = validateSupplier(data, { isUpdate: true });

    if (errors.length) {
      return res.status(400).json({
        message: "Validation failed.",
        errors,
      });
    }

    const supplier = await supplierService.updateSupplier({
      companyId,
      supplierId: req.params.id,
      data,
    });

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found.",
      });
    }

    return res.json({ supplier });
  } catch (error) {
    return handleError(error, res, next);
  }
}
export async function remove(req, res, next) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Company access is required.",
      });
    }

    await supplierService.deleteSupplier({
      companyId,
      supplierId: req.params.id,
    });

    return res.json({
      success: true,
      message: "Supplier deleted successfully.",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    if (error.code === "P2003" || error.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "This supplier has related records that prevent deletion. Review its linked products, documents, applications, or verification history first.",
      });
    }

    return next(error);
  }
}