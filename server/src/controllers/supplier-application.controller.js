import prisma from "../config/prisma.js";
import { validateSupplier } from "../validators/supplier.validator.js";

const ALLOWED_FIELDS = [
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

function normalizeSupplierData(body) {
  const data = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Convert the date only after copying the allowed fields.
  if (data.establishedDate) {
    const date = new Date(`${data.establishedDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      return {
        data: null,
        error: "establishedDate must be a valid date in YYYY-MM-DD format.",
      };
    }

    data.establishedDate = date;
  } else if (data.establishedDate === "") {
    data.establishedDate = null;
  }

  return { data, error: null };
}

export async function submit(req, res, next) {
  try {
    const body = req.body ?? {};

    // 1. Check the required declarations.
    if (
      body.declarationAccepted !== true ||
      body.privacyNoticeAccepted !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Please accept the declaration and privacy notice.",
        errors: [
          "declarationAccepted must be true.",
          "privacyNoticeAccepted must be true.",
        ],
      });
    }

    // 2. Normalize and whitelist the submitted fields.
    const normalized = normalizeSupplierData(body);

    if (normalized.error) {
      return res.status(400).json({
        success: false,
        message: "Invalid application data.",
        errors: [normalized.error],
      });
    }

    const data = normalized.data;

    // 3. Validate the supplier data.
    const validationErrors = validateSupplier(data);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validationErrors,
      });
    }

    // 4. Find the company that owns supplier applications.
    const companyId = process.env.SUPPLIER_APPLICATION_COMPANY_ID;

    if (!companyId) {
      return res.status(500).json({
        success: false,
        message:
          "Supplier application is not configured. Set SUPPLIER_APPLICATION_COMPANY_ID.",
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      return res.status(500).json({
        success: false,
        message: "The configured supplier company was not found.",
      });
    }

    // 5. Save the supplier and application in one transaction.
    const supplier = await prisma.$transaction(async (tx) => {
      return tx.supplier.create({
        data: {
          ...data,
          company: {
            connect: { id: company.id },
          },
          status: "PENDING",
          application: {
            create: {
              declarationAccepted: true,
              privacyNoticeAccepted: true,
            },
          },
        },
        select: {
          id: true,
          companyName: true,
          email: true,
          status: true,
          createdAt: true,
          application: {
            select: {
              id: true,
              submittedAt: true,
            },
          },
        },
      });
    });

    // 6. Return the created record.
    return res.status(201).json({
      success: true,
      message: "Supplier application submitted successfully.",
      supplier,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "A supplier with one of these unique values already exists.",
        fields: error.meta?.target ?? [],
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message:
          "The application references a related record that does not exist.",
      });
    }

    if (error.code === "P2025") {
      return res.status(400).json({
        success: false,
        message: "A required related record could not be found.",
      });
    }

    return next(error);
  }
}