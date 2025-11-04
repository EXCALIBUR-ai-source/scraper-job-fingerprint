// ---- UI helpers (overlay) ----
const PANEL_ID = "__jf_job_panel";
function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `
    position: fixed; top: 12px; right: 12px; z-index: 2147483647;
    width: 280px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.08); font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  `;
  panel.innerHTML = `
    <div style="padding:12px 16px; border-bottom:1px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center;">
      <div style="font-weight:600">Job Details</div>
      <div style="cursor:pointer; font-size:18px; line-height:1" id="__jf_close">×</div>
    </div>
    <div style="padding:14px 16px; font-size:14px; color:#111827">
      <div style="margin-bottom:20px">JOB FINGERPRINT CHECK</div>
      <div style="margin-bottom:20px"><strong>Bookmarked:</strong> <span id="__jf_bookmark">Checking…</span></div>
      <div id="__jf_hint" style="color:#6b7280; font-size:12px; margin-top:8px"></div>
    </div>
  `;
  document.documentElement.appendChild(panel);
  panel.querySelector("#__jf_close").addEventListener("click", () => panel.remove());
  return panel;
}

function setBookmarkText(text) {
  const el = document.getElementById("__jf_bookmark") || ensurePanel().querySelector("#__jf_bookmark");
  el.textContent = text;
}

function setHint(text) {
  const el = document.getElementById("__jf_hint") || ensurePanel().querySelector("#__jf_hint");
  el.textContent = text || "";
}

// ---- URL / UUID helpers ----
function extractUuidFromUrl(url) {
  const u = url || location.href;
  const uuidMatch = u.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];
  // Fallback: try last path segment or jobId query
  const urlObj = new URL(u);
  const jobIdParam = urlObj.searchParams.get("jobId") || urlObj.searchParams.get("jk") || urlObj.searchParams.get("gh_jid");
  if (jobIdParam) return jobIdParam;
  const parts = urlObj.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && last.length >= 8) return last;
  return null;
}

// ---- DOM scraping for company/title (best-effort heuristics) ----
function guessJobData() {
  const url = location.href;

  // Common title selectors
  const titleSelectors = [
    'h1[data-testid="jobTitle"]',
    'h1[data-automation="job-detail-title"]',
    'h1[class*="title"]',
    'h1',
    'meta[property="og:title"]'
  ];
  let title = "";
  for (const sel of titleSelectors) {
    const n = document.querySelector(sel);
    if (n) { title = n.content || n.textContent.trim(); if (title) break; }
  }
  if (!title) title = (document.title || "").split(" - ")[0].split("|")[0].trim();

  // Common company selectors
  const companySelectors = [
    '[data-testid="company-name"]',
    '[data-automation="job-detail-company-name"]',
    'a[href*="company"], span[class*="company"], div[class*="company"]'
  ];
  let company = "";
  for (const sel of companySelectors) {
    const n = document.querySelector(sel);
    if (n) { company = n.textContent.trim(); if (company) break; }
  }
  // Fallback: if title contains " - Company"
  if (!company) {
    const t = document.title;
    const parts = t.split(" - ");
    if (parts.length > 1) company = parts[parts.length - 1].trim();
  }

  // Clean up overly long bits
  if (title.length > 140) title = title.slice(0, 140);
  if (company.length > 80) company = company.slice(0, 80);

  return { job_title: title || "(Unknown title)", company: company || "(Unknown company)", position_url: url };
}

// ---- Session helpers & refresh on 401 ----
async function getSession() {
  const { [STORAGE_KEYS.session]: session } = await storage.get([STORAGE_KEYS.session]);
  return session || null;
}

async function getUser() {
  const { [STORAGE_KEYS.user]: user } = await storage.get([STORAGE_KEYS.user]);
  return user || null;
}

async function ensureAccessToken() {
  const session = await getSession();
  if (!session?.access_token) return null;
  // Basic soft refresh after 55 mins
  const ageMs = Date.now() - (session.ts || 0);
  if (ageMs > 55 * 60 * 1000 && session.refresh_token) {
    try {
      const refreshed = await refreshSession(session.refresh_token);
      await storage.set({ [STORAGE_KEYS.session]: { ...refreshed, ts: Date.now() } });
      return refreshed.access_token;
    } catch (_) {
      // ignore; we'll try anyway
    }
  }
  return session.access_token;
}

// ---- Bookmark check flow ----
let lastUrl = location.href;

async function checkBookmarkForPage() {
  const uuid = extractUuidFromUrl(location.href);
  ensurePanel();
  if (!uuid) {
    setBookmarkText("No ID found");
    setHint("Open a job detail page with an ID/UUID in its URL.");
    return;
  }

  const user = await getUser();
  const token = await ensureAccessToken();

  if (!user?.id || !token) {
    setBookmarkText("Sign in required");
    setHint("Open the extension and sign in with your email.");
    return;
  }

  try {
    setBookmarkText("Checking…");
    const rows = await findPositionByUuid({ uuid, user_id: user.id }, token);
    setBookmarkText(rows.length ? "YES" : "NO");
    setHint(rows.length ? "This page already exists in your Supabase table." : "Press Alt + A to save this job.");
  } catch (e) {
    setBookmarkText("Error");
    setHint(e.message || "Failed to query Supabase.");
  }
}

// Observe SPA URL changes
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkBookmarkForPage();
  }
});
urlObserver.observe(document, { subtree: true, childList: true });

// Initial check after load
window.addEventListener("load", () => setTimeout(checkBookmarkForPage, 400));

// ---- Save job on Alt + A (and via background command) ----
async function saveCurrentJob() {
  const user = await getUser();
  const token = await ensureAccessToken();
  if (!user?.id || !token) {
    ensurePanel();
    setBookmarkText("Sign in required");
    setHint("Open the extension popup and sign in first.");
    return;
  }

  const data = guessJobData();
  try {
    await savePositionApplied({ ...data, user_id: user.id }, token);
    setBookmarkText("YES");
    setHint("Saved to Supabase.");
  } catch (e) {
    ensurePanel();
    setBookmarkText("Error");
    setHint(e.message || "Failed to save.");
  }
}

// Capture keyboard in page
window.addEventListener("keydown", (e) => {
  if (e.altKey && (e.key === "a" || e.key === "A")) {
    e.preventDefault();
    saveCurrentJob();
  }
}, true);

// Receive command from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SAVE_JOB") saveCurrentJob();
});

// Also re-check bookmark when user scrolls a bit (some job sites load title later)
let scrollTimer;
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    checkBookmarkForPage();
  }, 500);
});
