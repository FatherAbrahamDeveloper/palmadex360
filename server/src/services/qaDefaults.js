// Starting checklists, created the first time a company opens Quality checks.
// Hibiscus follows Palmadex's paper "Hibiscus Flower Loading QA/QC Checklist".
// The others are drafts built from common export specifications: review and adjust
// them to your buyer contracts before relying on them.
//
// Row types (see qa.service.js):
//   CHOICE  tick one option. With `measure: true` the inspector also enters the
//           measured value, which must fall inside the ticked option's min/max.
//           An option with `acceptable: false` fails when ticked.
//   CONFIRM a requirement answered Yes / No. No fails.
//   NUMBER  a measured value checked against min / max.
//   TEXT    free text, recorded only.
// `critical: false` rows are recorded but never block loading.

const opt = (label, min = null, max = null) => ({ label, min, max, acceptable: true });
const maxOpt = (n) => opt(`${n}% max`, null, n);
const info = (key, label, options) => ({ key, label, type: "CHOICE", options: options.map((o) => opt(o)), measure: false, critical: false, required: true });
const confirm = (key, label, requirement) => ({ key, label, type: "CONFIRM", requirement, critical: true, required: true });
const number = (key, label, { min = null, max = null, unit = "%", critical = true, help } = {}) => ({ key, label, type: "NUMBER", min, max, unit, critical, required: true, ...(help ? { help } : {}) });
const source = { key: "source", label: "Source (State & LGA)", type: "TEXT", required: true, critical: false, help: "State and Local Government Area the produce came from" };

const DRAFT_NOTE = "Draft based on common export specifications. Check the limits against your buyer contract before use.";

export const DEFAULT_QA_TEMPLATES = [
  {
    name: "Hibiscus Flower Loading QA/QC Checklist",
    commodity: "Hibiscus flower",
    description: "Palmadex loading checklist for dried hibiscus flower (one per container).",
    parameters: [
      info("colour", "Colour", ["Red", "Pink", "Dark red", "Purple-red"]),
      info("packaging", "Packaging", ["20kg", "25kg", "17kg", "18kg"]),
      { key: "purity", label: "Purity", type: "CHOICE", measure: true, unit: "%", critical: true, required: true,
        options: [opt("98%", 98), opt("97%", 97), opt("99%", 99), opt("100%", 100)],
        help: "Tick the contracted purity and enter the measured purity" },
      { key: "moisture", label: "Moisture content", type: "CHOICE", measure: true, unit: "%", critical: true, required: true,
        options: [opt("10-12%", 10, 12), opt("8-10%", 8, 10), opt("12-14%", 12, 14), opt("6-8%", 6, 8)],
        help: "Tick the contracted range and enter the moisture meter reading" },
      { key: "broken", label: "Broken flowers", type: "CHOICE", measure: true, unit: "%", critical: true, required: true,
        options: [maxOpt(3), maxOpt(2), maxOpt(1), maxOpt(4)] },
      { key: "foreign_matter", label: "Foreign matter", type: "CHOICE", measure: true, unit: "%", critical: true, required: true,
        options: [maxOpt(2), maxOpt(4), maxOpt(1), maxOpt(3)] },
      info("total_weight", "Total weight (40FCL)", ["13.5MT", "13MT", "14MT", "12MT"]),
      info("bags", "Number of bags", ["540", "520", "560", "480"]),
      { key: "admixture", label: "Admixture", type: "CHOICE", measure: true, unit: "%", critical: true, required: true,
        options: [maxOpt(1), maxOpt(0.5), maxOpt(2), maxOpt(0.3)] },
      info("type", "Type", ["Asta clean", "Kano clean"]),
      confirm("quality", "Quality", "Free from moulds and insects"),
      confirm("cleaning", "Means of cleaning", "Manual cleaning"),
      confirm("bag_type", "Type of bag", "Polypropylene sacks (PP bags)"),
      source,
    ],
  },
  {
    name: "Sesame Seed Loading QA/QC Checklist",
    commodity: "Sesame seed",
    description: DRAFT_NOTE,
    parameters: [
      info("variety", "Variety / colour", ["Natural white", "Mixed", "Brown", "Hulled white"]),
      number("purity", "Purity", { min: 98 }),
      number("moisture", "Moisture content", { max: 8 }),
      number("oil", "Oil content", { min: 48, critical: false }),
      number("ffa", "Free fatty acid (FFA)", { max: 2 }),
      number("admixture", "Admixture", { max: 2 }),
      number("foreign_matter", "Foreign matter", { max: 1 }),
      info("packaging", "Packaging", ["25kg", "50kg"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("quality", "Quality", "Free from live insects, mould and off-smell"),
      confirm("bag_type", "Type of bag", "New polypropylene bags, clean and sound"),
      source,
    ],
  },
  {
    name: "Cocoa Beans Loading QA/QC Checklist",
    commodity: "Cocoa beans",
    description: DRAFT_NOTE,
    parameters: [
      info("grade", "Grade", ["Grade 1", "Grade 2"]),
      number("moisture", "Moisture content", { max: 7.5 }),
      number("bean_count", "Bean count (per 100g)", { max: 100, unit: "beans" }),
      number("mouldy", "Mouldy beans", { max: 3 }),
      number("slaty", "Slaty beans", { max: 3 }),
      number("insect_damaged", "Insect-damaged / germinated / flat", { max: 3 }),
      number("foreign_matter", "Foreign matter", { max: 1 }),
      info("packaging", "Packaging", ["62.5kg jute", "64kg jute"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("fermentation", "Fermentation", "Well fermented and properly dried"),
      confirm("quality", "Quality", "Free from live insects, smoky or off-odour"),
      source,
    ],
  },
  {
    name: "Raw Cashew Nuts Loading QA/QC Checklist",
    commodity: "Raw cashew nuts",
    description: DRAFT_NOTE,
    parameters: [
      number("kor", "Out-turn (KOR)", { min: 46, unit: "lbs/80kg" }),
      number("nut_count", "Nut count (per kg)", { max: 200, unit: "nuts" }),
      number("moisture", "Moisture content", { max: 10 }),
      number("defective", "Defective nuts", { max: 10, critical: false }),
      number("foreign_matter", "Foreign matter", { max: 1 }),
      info("packaging", "Packaging", ["80kg jute", "50kg jute"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("quality", "Quality", "Free from live insects and mould"),
      source,
    ],
  },
  {
    name: "Dried Split Ginger Loading QA/QC Checklist",
    commodity: "Dried split ginger",
    description: DRAFT_NOTE,
    parameters: [
      info("form", "Form", ["Split", "Whole", "Sliced"]),
      number("moisture", "Moisture content", { max: 12 }),
      number("foreign_matter", "Foreign matter", { max: 1 }),
      number("extraneous", "Extraneous matter / dust", { max: 1 }),
      info("packaging", "Packaging", ["25kg", "30kg", "50kg"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("quality", "Quality", "Free from mould, insects and rot"),
      confirm("bag_type", "Type of bag", "Clean polypropylene or jute bags"),
      source,
    ],
  },
  {
    name: "Gum Arabic Loading QA/QC Checklist",
    commodity: "Gum arabic",
    description: DRAFT_NOTE,
    parameters: [
      info("grade", "Grade", ["Grade 1 (hand-picked)", "Grade 2", "Siftings"]),
      number("moisture", "Moisture content", { max: 15 }),
      number("impurities", "Impurities / foreign matter", { max: 1 }),
      number("ash", "Total ash", { max: 4, critical: false }),
      info("packaging", "Packaging", ["25kg", "50kg"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("quality", "Quality", "Clean, dry and free from bark and sand"),
      source,
    ],
  },
  {
    name: "Hardwood Charcoal Loading QA/QC Checklist",
    commodity: "Hardwood charcoal",
    description: DRAFT_NOTE,
    parameters: [
      info("size", "Size", ["3-15cm", "5-20cm", "Mixed"]),
      number("moisture", "Moisture content", { max: 8 }),
      number("fixed_carbon", "Fixed carbon", { min: 75 }),
      number("ash", "Ash content", { max: 4 }),
      number("fines", "Fines / dust", { max: 5 }),
      info("packaging", "Packaging", ["10kg", "15kg", "20kg", "25kg"]),
      number("bags", "Number of bags", { unit: "bags", critical: false }),
      confirm("quality", "Quality", "Fully carbonised, no uncarbonised wood or stones"),
      source,
    ],
  },
];
