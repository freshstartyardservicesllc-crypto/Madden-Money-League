// ===========================
// MML26 Site Config
// ===========================
const CASHAPP_TAG = "$MaddenMoneyChampions";

// Optional: add your Discord invite when ready
const DISCORD_INVITE_URL = ""; // e.g. "https://discord.gg/XXXXXXX"

// ===========================
// Helpers
// ===========================
function $(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===========================
// Cash App Note Auto-Fill + Copy
// ===========================
function updateCashAppNote() {
  const team = ($("teamWant")?.value || "____").trim() || "____";
  const tier = ($("tierSelect")?.value || "____").trim() || "____";
  const gt = ($("gamertag")?.value || "____").trim() || "____";

  const note = `MML26 | S1 | Team: ${team} | Tier: ${tier} | GT: ${gt}`;
  if ($("cashAppNote")) $("cashAppNote").value = note;
  return note;
}

async function copySignupPacket() {
  const team = ($("teamWant")?.value || "").trim();
  const tier = ($("tierSelect")?.value || "").trim();
  const gt = ($("gamertag")?.value || "").trim();
  const discord = ($("discordName")?.value || "").trim();
  const tz = ($("timezone")?.value || "").trim();
  const avail = ($("availability")?.value || "").trim();

  if (!team || !tier || !gt || !discord) {
    alert("Please fill: Team, Tier, Gamertag, and Discord name.");
    return;
  }

  const note = updateCashAppNote();

  const packet =
`MML26 SIGNUP (copy/paste)

Team: ${team}
Tier: ${tier}
Gamertag: ${gt}
Discord: ${discord}
Timezone: ${tz || "N/A"}
Availability: ${avail || "N/A"}

Cash App: ${CASHAPP_TAG}
Required Note: ${note}`;

  await navigator.clipboard.writeText(packet);
  alert("Copied! Paste this in Discord if staff asks.");
}

// ===========================
// Teams List Renderer (teams.json)
// ===========================
async function loadTeams() {
  const container = $("teamsContainer");
  if (!container) return;

  try {
    // cache-bust so updates show quickly
    const res = await fetch("teams.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch teams.json");

    const teams = await res.json();

    if (!Array.isArray(teams) || teams.length === 0) {
      container.innerHTML = `<div class="muted small">No teams found in teams.json yet.</div>`;
      return;
    }

    // Sort: Available first, then by tier, then by name
    const tierOrder = { S: 1, A: 2, B: 3, C: 4, D: 5 };
    teams.sort((a, b) => {
      const aTaken = (a.status || "").toLowerCase() === "taken";
      const bTaken = (b.status || "").toLowerCase() === "taken";
      if (aTaken !== bTaken) return aTaken ? 1 : -1;

      const ta = tierOrder[(a.tier || "").toUpperCase()] || 99;
      const tb = tierOrder[(b.tier || "").toUpperCase()] || 99;
      if (ta !== tb) return ta - tb;

      return String(a.team || "").localeCompare(String(b.team || ""));
    });

    // Build cards
    const rows = teams.map(t => {
      const team = escapeHtml(t.team || "");
      const ovr = escapeHtml(t.ovr ?? "");
      const tier = escapeHtml((t.tier || "").toUpperCase());
      const status = escapeHtml(t.status || "Available");
      const owner = escapeHtml(t.owner || "");

      const taken = (t.status || "").toLowerCase() === "taken";
      const badge = taken
        ? `<span style="padding:4px 8px;border-radius:999px;background:rgba(255,80,80,.14);border:1px solid rgba(255,80,80,.22);">LOCKED</span>`
        : `<span style="padding:4px 8px;border-radius:999px;background:rgba(0,255,120,.12);border:1px solid rgba(0,255,120,.22);">AVAILABLE</span>`;

      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.03);margin-top:10px;">
          <div style="min-width:0;">
            <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${team}</div>
            <div class="muted small">OVR: <strong>${ovr}</strong> • Tier: <strong>${tier}</strong> ${owner ? `• Owner: <strong>${owner}</strong>` : ""}</div>
          </div>
          <div>${badge}</div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="muted small">Live from <code>teams.json</code> (staff updates when teams are claimed).</div>
      ${rows}
    `;

  } catch (err) {
    container.innerHTML = `
      <div class="muted small">
        Could not load teams.json. Make sure <code>teams.json</code> is in the repo root (same level as index.html).
      </div>
    `;
  }
}

// ===========================
// Init
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // CashApp note live update
  ["teamWant", "tierSelect", "gamertag"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", updateCashAppNote);
    el.addEventListener("change", updateCashAppNote);
  });

  // Copy button
  const copyBtn = $("copySignupBtn");
  if (copyBtn) copyBtn.addEventListener("click", copySignupPacket);

  // Initial note fill
  updateCashAppNote();

  // Teams list
  loadTeams();
});