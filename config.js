// --- Supabase config (client-side) ---
const SUPABASE_URL = "https://nctyyffspvscotsscfex.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHl5ZmZzcHZzY290c3NjZmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDI2MjIsImV4cCI6MjA3NzY3ODYyMn0.TDlVi7wp4H0Drmnx9DnKZ5CxVotNnrbuR-C6EJsH6qE"; // <- your anon/public key ONLY

// Storage keys used across popup + content
const STORAGE_KEYS = {
  session: "jf.session",           // { access_token, refresh_token, user: { id, email }, ts }
  user: "jf.user"                  // { id, email, username }
};

// Helpers for storage
const storage = {
  async set(obj) { return chrome.storage.local.set(obj); },
  async get(keys) { return chrome.storage.local.get(keys); },
  async remove(keys) { return chrome.storage.local.remove(keys); }
};

// --- Minimal Supabase REST helpers (no supabase-js so Extension stays CSP-compliant) ---
async function supaFetch(path, { method = "GET", body, accessToken } = {}) {
  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  console.log("supaFetch",res)

  // Return both ok + JSON (or empty)
  let data = null;
  try { data = await res.json(); } catch (_e) {}
  if (!res.ok) {
    const msg = (data && (data.error_description || data.message)) || res.statusText;
    throw new Error(msg);
  }
  console.log("data",data)
  return data;
}

// Send 6-digit OTP to email (creates user if not exists)
function sendEmailOtp(email) {
  return supaFetch(`/auth/v1/otp`, {
    method: "POST",
    body: { email, type: "email", create_user: true }
  });
}

// Verify OTP (returns session with tokens + user)
function verifyEmailOtp(email, token) {
  return supaFetch(`/auth/v1/verify`, {
    method: "POST",
    body: { type: "email", email, token }
  });
}

// Refresh token if needed
async function refreshSession(refresh_token) {
  return supaFetch(`/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    body: { refresh_token }
  });
}

// PostgREST: upsert user (id = auth user id)
async function upsertUser({ id, email, username }, accessToken) {
  // Check if exists by id
  const existing = await supaFetch(`/rest/v1/User?id=eq.${encodeURIComponent(id)}&select=id`, {
    accessToken
  });
  if (Array.isArray(existing) && existing.length) {
    // Update username/email if you want; otherwise no-op
    return existing[0];
  }
  // Insert
  const rows = await supaFetch(`/rest/v1/User`, {
    method: "POST",
    accessToken,
    body: [{ id, email, username }],
  });
  return rows[0] || { id, email, username };
}

// Save positionApplied
async function savePositionApplied({ company, job_title, position_url, user_id }, accessToken) {
  const rows = await supaFetch(`/rest/v1/positionApplied`, {
    method: "POST",
    accessToken,
    body: [{ company, job_title, position_url, user_id }]
  });
  return rows[0] || null;
}

// Query bookmark by UUID + user
async function findPositionByUuid({ uuid, user_id }, accessToken) {
  const filter =
    `user_id=eq.${encodeURIComponent(user_id)}&position_url=ilike.*${encodeURIComponent(uuid)}*`;
  const rows = await supaFetch(`/rest/v1/positionApplied?${filter}&select=id,company,job_title,position_url,created_at`, {
    accessToken
  });
  return rows;
}
