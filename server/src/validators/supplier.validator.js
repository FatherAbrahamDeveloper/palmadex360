const BUSINESS_TYPES = [
  "FARMER",
  "COOPERATIVE",
  "AGGREGATOR",
  "PROCESSOR",
  "MANUFACTURER",
  "EXPORTER",
  "WHOLESALER",
  "OTHER",
];

const REGISTRATION_STATUSES = [
  "REGISTERED",
  "NOT_REGISTERED",
  "IN_PROGRESS",
];

function validateSupplier(input, { isUpdate = false } = {}) {
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return ["A valid supplier object is required."];
  }

  const requiredFields = [
    "companyName",
    "email",
    "phone",
    "country",
    "city",
    "address",
    "contactPerson",
  ];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (
        typeof input[field] !== "string" ||
        input[field].trim().length === 0
      ) {
        errors.push(`${field} is required.`);
      }
    }
  }

  if (
    input.companyName !== undefined &&
    (typeof input.companyName !== "string" ||
      input.companyName.trim().length > 200)
  ) {
    errors.push("Company name must be a string of at most 200 characters.");
  }

  if (
    input.email !== undefined &&
    (typeof input.email !== "string" ||
      input.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
  ) {
    errors.push("A valid email address is required.");
  }

  if (
    input.businessType !== undefined &&
    !BUSINESS_TYPES.includes(input.businessType)
  ) {
    errors.push("Invalid business type.");
  }

  if (
    input.registrationStatus !== undefined &&
    !REGISTRATION_STATUSES.includes(input.registrationStatus)
  ) {
    errors.push("Invalid registration status.");
  }

  if (input.rating !== undefined && input.rating !== null) {
    const rating = Number(input.rating);

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      errors.push("Rating must be between 0 and 5.");
    }
  }

  if (
    input.exportExperienceYears !== undefined &&
    input.exportExperienceYears !== null &&
    (!Number.isInteger(input.exportExperienceYears) ||
      input.exportExperienceYears < 0 ||
      input.exportExperienceYears > 100)
  ) {
    errors.push("Export experience years must be an integer from 0 to 100.");
  }

  return errors;
}

export { validateSupplier };
