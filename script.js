/**
 * MML26 Website Script
 * Works on GitHub Pages (no server required)
 */

const CONFIG = {
  LEAGUE_NAME: "MML26 — Madden Money League",
  CASHAPP_TAG: "$MaddenMoneyChampions",
  CASHAPP_URL: "https://cash.app/$MaddenMoneyChampions",
  DISCORD_INVITE_URL: "PASTE_YOUR_DISCORD_INVITE_LINK_HERE",
  START_DATETIME: "Feb 7 @ 1:00 PM ET (Cincinnati)",
  ADVANCE_CADENCE: "Every 72 hours @ 1:00 PM ET",
  RULESET: ["Competitive", "6-Min Quarters", "Coaches", "Salary Cap ON", "72-Hour Advances"],

  // Team availability source:
  // - "json": edit teams.json in the repo (easy + free)
  // - "sheet": publish a Google Sheet as CSV and paste the CSV URL
  TEAMS_SOURCE: "json",
  TEAMS_JSON_URL: "teams.json",
  SHEET_CSV_URL: "PASTE_PUBLISHED_CSV_URL_HERE", // Only used if TEAMS_SOURCE === "sheet"
};

// Admissions are "all-in" totals (tier fee + ops combined)
const TIERS = [
  { key: "S", range: "89–91", total: 95, deposit: 47.50, trades: 4, cls: "s" },
  { key: "A", range: "86–88", total: 85, deposit: 42.50, trades: 5, cls: "a" },
  { key: "B", range: "83–85", total: 75, deposit: 37.50, trades: 7, cls: "b" },
  { key: "C", range: "80–82", total: 65, deposit: 32.50, trades: 9, cls: "c" },
  { key: "D", range: "74–79", total: 55, deposit: 27.50, trades: 9, cls: "d" },
];

const PAYOUT_HIGHLIGHTS = [
  { title: "Super Bowl Champion", amount: "$460" },
  { title: "Super Bowl Runner‑Up", amount: "$200" },
  { title: "Conf. Title Game Losers", amount: "$100 each" },
  { title: "Regular Season Awards Pool", amount: "$260 total" },
  { title: "Playoff Teams Pool", amount: "$190 total" },
];

const FAQ = [
  {
    q: "How do tiers work with Official Roster Updates?",
    a: "We use the Current Official Roster Update (EA). Staff posts a Tier Snapshot before Week 1. After the snapshot is posted, tiers are locked for the season."
  },
  {
    q: "How do I lock a team?",
    a: "Pay the 50% deposit first. Staff assigns the Paid ✅ role, then you claim a team and it becomes locked after staff confirms in the ledger."
  },
  {
    q: "How long is one season at 72-hour advances?",
    a: "Regular season is ~54 days + playoffs ~12 days. With offseason, most seasons land around 10–12 weeks depending on how fast the offseason runs."
  }
];

function $(sel){ return document.querySelector(sel); }
function $$ (sel){ return Array.from(document.querySelectorAll(sel)); }

function money(n){
  // show 2 decimals only if needed
  const fixed = (Math.round(n*100)/100).toFixed(2);
  return fixed.endsWith(".00") ? fixed.slice(0,-3) : fixed;
}

function showToast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(()=>t.classList.remove("show"), 1600);
}

function renderBasics(){
  $("#leagueName").textContent = CONFIG.LEAGUE_NAME;
  $("#startDate").textContent = CONFIG.START_DATETIME;
  $("#advanceCadence").textContent = CONFIG.ADVANCE_CADENCE;
  $("#cashappTag").textContent = CONFIG.CASHAPP_TAG;
  $("#cashappLink").href = CONFIG.CASHAPP_URL;
  $("#discordLink").href = CONFIG.DISCORD_INVITE_URL;

  const quick = $("#quickFacts");
  quick.innerHTML = "";
  const facts = [
    { b: "72‑Hour Advance", s: CONFIG.ADVANCE_CADENCE },
    { b: "Realism First", s: "Salary Cap ON • Coaches • No cheese" },
    { b: "All‑In Admission", s: "Tier-based totals (ops included)" },
    { b: "Deposit Required", s: "50% deposit locks your spot" },
  ];
  facts.forEach(f=>{
    const el = document.createElement("div");
    el.className = "metric";
    el.innerHTML = `<b>${f.b}</b><span>${f.s}</span>`;
    quick.appendChild(el);
  });
}

function renderTiers(){
  const tbody = $("#tiersBody");
  tbody.innerHTML = "";
  TIERS.forEach(t=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="badge ${t.cls}">Tier ${t.key}</span></td>
      <td>${t.range} OVR</td>
      <td>$${t.total}</td>
      <td>$${money(t.deposit)}</td>
      <td>${t.trades}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPayouts(){
  const wrap = $("#payoutGrid");
  wrap.innerHTML = "";
  PAYOUT_HIGHLIGHTS.forEach(p=>{
    const el = document.createElement("div");
    el.className = "metric";
    el.innerHTML = `<b>${p.amount}</b><span>${p.title}</span>`;
    wrap.appendChild(el);
  });
}

function renderFAQ(){
  const wrap = $("#faq");
  wrap.innerHTML = "";
  FAQ.forEach(item=>{
    const el = document.createElement("div");
    el.className = "metric";
    el.innerHTML = `<b>${item.q}</b><span>${item.a}</span>`;
    wrap.appendChild(el);
  });
}

async function fetchTeams(){
  if(CONFIG.TEAMS_SOURCE === "sheet"){
    if(!CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL.includes("PASTE_")){
      throw new Error("SHEET_CSV_URL not set. Paste your published CSV URL or switch TEAMS_SOURCE to 'json'.");
    }
    const res = await fetch(CONFIG.SHEET_CSV_URL, { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to fetch Google Sheet CSV.");
    const text = await res.text();
    return parseCSVTeams(text);
  } else {
    const res = await fetch(CONFIG.TEAMS_JSON_URL, { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to fetch teams.json.");
    return await res.json();
  }
}

/**
 * Expected CSV columns:
 * team,ovr,tier,status,owner
 * status: Open | Taken
 */
function parseCSVTeams(csv){
  const lines = csv.split(/\r?\n/).filter(l=>l.trim().length);
  const header = lines.shift().split(",").map(s=>s.trim().toLowerCase());
  const idx = (name)=>header.indexOf(name);
  const out = [];
  for(const line of lines){
    const cols = line.split(",").map(s=>s.trim());
    out.push({
      team: cols[idx("team")] || "",
      ovr: cols[idx("ovr")] || "",
      tier: cols[idx("tier")] || "",
      status: cols[idx("status")] || "Open",
      owner: cols[idx("owner")] || ""
    });
  }
  return out;
}

let TEAMS = [];

function normalize(s){ return (s||"").toLowerCase().trim(); }

function renderTeams(){
  const q = normalize($("#teamSearch").value);
  const tier = $("#tierFilter").value;
  const status = $("#statusFilter").value;

  const filtered = TEAMS.filter(t=>{
    const matchQ = !q || normalize(t.team).includes(q) || normalize(t.owner).includes(q);
    const matchTier = tier === "ALL" || normalize(t.tier) === normalize(tier);
    const matchStatus = status === "ALL" || normalize(t.status) === normalize(status);
    return matchQ && matchTier && matchStatus;
  });

  $("#teamsCount").textContent = `${filtered.length} shown • ${TEAMS.filter(t=>normalize(t.status)!=="taken").length} open`;

  const tbody = $("#teamsBody");
  tbody.innerHTML = "";
  filtered.forEach(t=>{
    const taken = normalize(t.status) === "taken";
    const tierKey = (t.tier||"").toUpperCase();
    const cls = (tierKey==="S"?"s":tierKey==="A"?"a":tierKey==="B"?"b":tierKey==="C"?"c":tierKey==="D"?"d":"c");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.team}</td>
      <td>${t.ovr || "—"}</td>
      <td><span class="badge ${cls}">Tier ${tierKey || "—"}</span></td>
      <td>${taken ? "Taken" : "Open"}</td>
      <td>${t.owner || (taken ? "—" : "")}</td>
      <td><button class="btn secondary" data-pick="${encodeURIComponent(t.team)}" ${taken ? "disabled" : ""}>Pick</button></td>
    `;
    tbody.appendChild(tr);
  });

  $$("button[data-pick]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const team = decodeURIComponent(btn.getAttribute("data-pick"));
      $("#signupTeam").value = team;
      showToast(`Selected team: ${team}`);
      document.getElementById("signup").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function tierByKey(key){
  return TIERS.find(t=>t.key === key) || null;
}

function buildCashAppNote({team, tier, gt}){
  return `MML26 | S1 | Team: ${team || "____"} | Tier: ${tier || "___"} | GT: ${gt || "____"}`;
}

function buildSignupMessage(payload){
  const note = buildCashAppNote(payload);
  const tierInfo = tierByKey((payload.tier||"").toUpperCase());
  const deposit = tierInfo ? `$${money(tierInfo.deposit)}` : "50% deposit";
  const total = tierInfo ? `$${tierInfo.total}` : "tier total";

  return [
    `MML26 SIGNUP`,
    `Team: ${payload.team || ""}`,
    `Tier: ${payload.tier || ""} • All-in: ${total} • Deposit: ${deposit}`,
    `Gamertag: ${payload.gamertag || ""}`,
    `Discord: ${payload.discord || ""}`,
    `Timezone: ${payload.timezone || ""}`,
    `Availability: ${payload.availability || ""}`,
    ``,
    `Cash App: ${CONFIG.CASHAPP_TAG}`,
    `Required note: ${note}`
  ].join("\n");
}

async function copyToClipboard(text){
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard ✅");
}

function wireSignup(){
  $("#signupForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    const payload = {
      team: $("#signupTeam").value.trim(),
      tier: $("#signupTier").value,
      gamertag: $("#signupGT").value.trim(),
      discord: $("#signupDiscord").value.trim(),
      timezone: $("#signupTZ").value.trim(),
      availability: $("#signupAvail").value.trim(),
    };
    const message = buildSignupMessage(payload);
    $("#signupOutput").value = message;

    try{
      await copyToClipboard(message);
    }catch(err){
      $("#signupOutput").select();
      showToast("Select + copy manually");
    }
  });

  $("#btnCashApp").addEventListener("click", ()=>{
    window.open(CONFIG.CASHAPP_URL, "_blank", "noopener,noreferrer");
  });

  $("#btnDiscord").addEventListener("click", ()=>{
    if(!CONFIG.DISCORD_INVITE_URL || CONFIG.DISCORD_INVITE_URL.includes("PASTE_")){
      alert("Add your Discord invite link inside script.js (CONFIG.DISCORD_INVITE_URL).");
      return;
    }
    window.open(CONFIG.DISCORD_INVITE_URL, "_blank", "noopener,noreferrer");
  });

  $("#btnCopyNote").addEventListener("click", async ()=>{
    const team = $("#signupTeam").value.trim();
    const tier = $("#signupTier").value;
    const gt = $("#signupGT").value.trim();
    const note = buildCashAppNote({team, tier, gt});
    try{
      await copyToClipboard(note);
    }catch(e){
      showToast("Copy note manually");
    }
  });
}

function wireTeamFilters(){
  ["teamSearch","tierFilter","statusFilter"].forEach(id=>{
    $("#"+id).addEventListener("input", renderTeams);
    $("#"+id).addEventListener("change", renderTeams);
  });
}

async function init(){
  renderBasics();
  renderTiers();
  renderPayouts();
  renderFAQ();
  wireSignup();
  wireTeamFilters();

  try{
    TEAMS = await fetchTeams();
    renderTeams();
  }catch(err){
    console.warn(err);
    $("#teamsCount").textContent = "Teams list not loaded (edit teams.json or set Google Sheet CSV URL).";
  }
}

document.addEventListener("DOMContentLoaded", init);