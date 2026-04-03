// ============================================================
// ALLAN CRM 2026 — config.js
// ⚠️  THIS IS THE ONLY FILE YOU NEED TO EDIT
//    All customisation (names, insurers, labels, colours)
//    is done here. Do not modify other .js files.
// ============================================================
// Last updated: 2026-04-03
// ============================================================

const CONFIG = {

  // ── 1. GOOGLE APPS SCRIPT URL ──────────────────────────────
  //    Paste your Web App URL here after deploying
  // ──────────────────────────────────────────────────────────
  API_URL: "https://script.google.com/macros/s/AKfycbwJvyJW_RKs2idl0zBSHgMIxxiC_OKoQVzAE7Wd5o7wEV4Ak7aBE1lkqJyMD92kmTbB/exec",

  // ── 1b. LOGIN PASSWORD ─────────────────────────────────────
  //    Change this to your preferred password
  //    SESSION_MINUTES: how long before auto-logout (default 30)
  // ──────────────────────────────────────────────────────────
  PASSWORD: "roc",
  SESSION_MINUTES: 30,

  // ── 2. SYSTEM INFO ─────────────────────────────────────────
  SYSTEM: {
    name:         "Allan CRM 2026",
    company:      "ROC Wealth Advisory",
    advisor:      "Allan",
    currency:     "RM",
    timezone:     "Asia/Kuala_Lumpur",
    logo_text:    "AW",
    accent_color: "#0ea5e9"
  },

  // ── 3. INSURERS (dropdown list) ────────────────────────────
  INSURERS: [
    "AIA Life",
    "AIA Takaful",
    "Allianz General",
    "Great Eastern",
    "Prudential",
    "Others"
  ],

  // ── 4. PAYMENT FREQUENCIES ─────────────────────────────────
  PAYMENT_FREQUENCIES: [
    "Monthly",
    "Quarterly",
    "Semi-Annual",
    "Annual",
    "Single Premium"
  ],

  // ── 5. PAYMENT STATUS ──────────────────────────────────────
  //    Format: [ { value, label } ]
  // ──────────────────────────────────────────────────────────
  PAYMENT_STATUS: [
    { value: "pending",   label: "Pending" },
    { value: "paid",      label: "Paid" },
    { value: "overdue",   label: "Overdue" },
    { value: "cancelled", label: "Cancelled" }
  ],

  // ── 6. CLAIM STATUS ────────────────────────────────────────
  CLAIM_STATUS: [
    { value: "draft",      label: "Draft" },
    { value: "submitted",  label: "Submitted" },
    { value: "processing", label: "Processing" },
    { value: "approved",   label: "Approved" },
    { value: "paid_out",   label: "Paid Out" },
    { value: "rejected",   label: "Rejected" }
  ],

  // ── 7. CLAIM TYPES ─────────────────────────────────────────
  CLAIM_TYPES: [
    "Hospitalisation",
    "Critical Illness",
    "Accidental",
    "Death Benefit",
    "TPD",
    "Outpatient",
    "Dental",
    "Others"
  ],

  // ── 8. SERVICE TYPES ───────────────────────────────────────
  SERVICE_TYPES: [
    "Annual Review",
    "Policy Amendment",
    "Beneficiary Update",
    "Claims Assistance",
    "New Policy Consultation",
    "Renewal Reminder",
    "Medical Card Application",
    "Investment Review",
    "Trust / Will Advisory",
    "Follow-Up",
    "Others"
  ],

  // ── 9. SERVICE STATUS ──────────────────────────────────────
  SERVICE_STATUS: [
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "followup",  label: "Follow-Up" },
    { value: "cancelled", label: "Cancelled" }
  ],

  // ── 10. REMINDER DAYS ──────────────────────────────────────
  REMINDERS: {
    payment_due_warning_days:    30,
    payment_due_danger_days:      7,
    policy_renewal_warning_days: 60,
    follow_up_overdue_days:       7
  },

  // ── 11. CLIENT TIERS ───────────────────────────────────────
  CLIENT_TIERS: [
    "VIP (>RM5000 APE)",
    "Premium (RM2000-5000 APE)",
    "Standard (RM500-2000 APE)",
    "New Client"
  ],

  // ── 12. SHEET NAMES ────────────────────────────────────────
  //    Must match exactly with your Google Sheets tab names
  // ──────────────────────────────────────────────────────────
  SHEET_NAMES: {
    clients:   "Clients",
    payments:  "Payments",
    claims:    "Claims",
    servicing: "Servicing"
  },

  // ── 13. PAGE SIZE ──────────────────────────────────────────
  PAGE_SIZE: 20,

  // ── 14. CACHE DURATION (minutes) ───────────────────────────
  //    Reduces API calls to Google Sheets
  // ──────────────────────────────────────────────────────────
  CACHE_MINUTES: 5

};
