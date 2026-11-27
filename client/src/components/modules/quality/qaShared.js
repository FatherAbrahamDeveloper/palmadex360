// Shared labels and logic for quality checklists (QA/QC).
// `evaluateRow` mirrors the server rules in server/src/services/qa.service.js so the
// inspector sees a row turn red while filling it in. The server decides on submit.

export const QA_STATUS = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  PASSED: { label: "Passed", className: "bg-emerald-100 text-emerald-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
  OVERRIDDEN: { label: "Released by admin", className: "bg-amber-100 text-amber-800" },
};

export const ROW_TYPES = {
  CHOICE: "Tick one option",
  CONFIRM: "Yes / No requirement",
  NUMBER: "Measured value",
  TEXT: "Free text",
};

export const OVERRIDE_ROLES = ["SUPER_ADMIN", "ADMIN"];

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(Number(n).toFixed(3))));
export const unitSuffix = (unit) => (unit === "%" ? "%" : unit ? ` ${unit}` : "");
const within = (v, min, max) => (min == null || v >= min) && (max == null || v <= max);
const hasNum = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

export function rangeText(min, max, unit) {
  const u = unitSuffix(unit);
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}${u}`;
  if (max != null) return `max ${fmt(max)}${u}`;
  if (min != null) return `min ${fmt(min)}${u}`;
  return "";
}

// -> { status: PASS | FAIL | WARN | INFO | MISSING, message }
export function evaluateRow(p, a = {}) {
  const u = unitSuffix(p.unit);
  let status = "PASS";
  let message = "";
  if (p.type === "CHOICE") {
    const chosen = (p.options || []).find((o) => o.label === a.option);
    if (!chosen) status = "MISSING";
    else if (p.measure) {
      if (!hasNum(a.value)) { status = "MISSING"; message = "Enter the measured value"; }
      else {
        const v = Number(a.value);
        const ok = within(v, chosen.min, chosen.max);
        status = ok ? "PASS" : "FAIL";
        message = ok ? `Within ${chosen.label}` : `${fmt(v)}${u} is outside ${chosen.label}`;
      }
    } else if (chosen.acceptable === false) { status = "FAIL"; message = `${chosen.label} is not acceptable`; }
    else status = "INFO";
  } else if (p.type === "CONFIRM") {
    if (a.confirmed === true) status = "PASS";
    else if (a.confirmed === false) { status = "FAIL"; message = `Not met: ${p.requirement}`; }
    else status = "MISSING";
  } else if (p.type === "NUMBER") {
    if (!hasNum(a.value)) status = "MISSING";
    else if (p.min == null && p.max == null) status = "INFO";
    else {
      const v = Number(a.value);
      const ok = within(v, p.min, p.max);
      status = ok ? "PASS" : "FAIL";
      message = ok ? `Within ${rangeText(p.min, p.max, p.unit)}` : `${fmt(v)}${u} is outside ${rangeText(p.min, p.max, p.unit)}`;
    }
  } else {
    status = (a.text || "").trim() ? "INFO" : "MISSING";
  }
  if (status === "FAIL" && p.critical === false) status = "WARN";
  if (status === "MISSING" && p.required === false) status = "INFO";
  return { status, message };
}

export const RESULT_STYLE = {
  PASS: "text-emerald-700 dark:text-emerald-400",
  FAIL: "text-red-700 dark:text-red-400",
  WARN: "text-amber-700 dark:text-amber-400",
  INFO: "text-muted-foreground",
  MISSING: "text-muted-foreground",
};
export const RESULT_LABEL = { PASS: "Pass", FAIL: "Fail", WARN: "Out of spec (not blocking)", INFO: "Recorded", MISSING: "To complete" };

export const formatDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// A printable copy laid out like the paper form, opened in a new window.
export function printChecklist(check) {
  const answers = check.answers || {};
  const resultFor = (key) => (check.results || []).find((r) => r.key === key);
  const rows = check.parameters.map((p, i) => {
    const a = answers[p.key] || {};
    const r = resultFor(p.key) || evaluateRow(p, a);
    let cells = "";
    if (p.type === "CHOICE") {
      cells = p.options.map((o) => `<td>${esc(o.label)}</td><td class="tick">${a.option === o.label ? "✔" : ""}</td>`).join("");
      cells += "<td></td><td></td>".repeat(Math.max(0, 4 - p.options.length));
      if (p.measure) cells += `<td class="measure">${a.value != null && a.value !== "" ? esc(a.value) + esc(unitSuffix(p.unit)) : ""}</td>`;
      else cells += `<td class="measure"></td>`;
    } else if (p.type === "CONFIRM") {
      cells = `<td colspan="7">${esc(p.requirement)}</td><td class="tick">${a.confirmed === true ? "✔ Yes" : a.confirmed === false ? "✘ No" : ""}</td><td class="measure"></td>`;
    } else if (p.type === "NUMBER") {
      cells = `<td colspan="7">Limit: ${esc(rangeText(p.min, p.max, p.unit) || "record only")}</td><td class="tick"></td><td class="measure">${a.value != null && a.value !== "" ? esc(a.value) + esc(unitSuffix(p.unit)) : ""}</td>`;
    } else {
      cells = `<td colspan="8">${esc(a.text || "")}</td><td class="measure"></td>`;
    }
    const flag = r.status === "FAIL" ? ' class="fail"' : "";
    return `<tr${flag}><td>${i + 1}</td><td><b>${esc(p.label)}</b></td>${cells}</tr>`;
  }).join("");

  const statusLine = check.status === "DRAFT" ? "DRAFT (not submitted)" : (QA_STATUS[check.status]?.label || check.status).toUpperCase();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(check.inspectionNumber)} ${esc(check.templateName)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:28px}
  .head{text-align:center} .head img{height:70px} h1{font-size:18px;margin:10px 0 4px}
  .meta{display:flex;flex-wrap:wrap;gap:6px 28px;font-size:13px;margin:12px 0}
  .meta span b{display:inline-block;min-width:110px}
  table{width:100%;border-collapse:collapse;font-size:11.5px} td,th{border:1px solid #555;padding:5px 6px;vertical-align:top}
  th{background:#eef6fb;text-align:left} td.tick{width:34px;text-align:center;font-weight:bold} td.measure{width:70px;text-align:center}
  tr.fail td{background:#fde8e8}
  .status{margin:10px 0;padding:8px 10px;border:1px solid #999;font-size:13px}
  .foot{margin-top:18px;font-size:13px;line-height:1.9}
  @media print{body{margin:10mm}}
</style></head><body>
<div class="head"><img src="${window.location.origin}/palmadex-logo-wide.png" alt="Palmadex"><h1>${esc(check.templateName.toUpperCase())}</h1></div>
<div class="meta">
  <span><b>Check no:</b> ${esc(check.inspectionNumber)}</span>
  <span><b>Crop year:</b> ${esc(check.cropYear || "")}</span>
  <span><b>Date:</b> ${esc(formatDay(check.inspectionDate))}</span>
  <span><b>Container no:</b> ${esc(check.containerNumber || "")}</span>
  ${check.purchaseRequest ? `<span><b>Purchase request:</b> ${esc(check.purchaseRequest.requestNumber)}</span>` : ""}
  ${check.supplier ? `<span><b>Supplier:</b> ${esc(check.supplier.companyName)}</span>` : ""}
  ${check.shipment ? `<span><b>Shipment:</b> ${esc(check.shipment.shipmentNumber)}</span>` : ""}
</div>
<p style="text-align:center;font-weight:bold;margin:8px 0">QUALITY SPECIFICATIONS (TICK APPROPRIATELY)</p>
<table><thead><tr><th>S/N</th><th>Parameter</th><th colspan="8">Specification / tick</th><th>Measured</th></tr></thead><tbody>${rows}</tbody></table>
<div class="status"><b>Result:</b> ${esc(statusLine)}${check.failureSummary ? `<br>${esc(check.failureSummary).replace(/\n/g, "<br>")}` : ""}${check.overrideReason ? `<br><b>Released by ${esc(check.overriddenBy?.name || "administrator")}:</b> ${esc(check.overrideReason)}` : ""}</div>
<div class="foot">
  <div><b>General comment:</b> ${esc(check.generalComment || "")}</div>
  <div><b>Name:</b> ${esc(check.inspectorName || "")} &nbsp;&nbsp;&nbsp; <b>Sign/Date:</b> ${check.signedAt ? `Signed electronically ${esc(formatDateTime(check.signedAt))}` : "________________"}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
