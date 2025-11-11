// ---- UI helpers (overlay) ----
const PANEL_ID = "__jf_job_panel";
let currentPanelView = "job"; // "job", "signin", "signup"

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `
    position: fixed; top: 12px; right: 12px; z-index: 2147483647;
    width: 340px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.15); font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  `;
  
  renderPanelContent(panel, "job");
  document.documentElement.appendChild(panel);
  return panel;
}

function renderPanelContent(panel, view) {
  currentPanelView = view;
  
  if (view === "signin") {
    panel.innerHTML = getSignInHTML();
    attachSignInListeners(panel);
  } else if (view === "signup") {
    panel.innerHTML = getSignUpHTML();
    attachSignUpListeners(panel);
  } else {
    panel.innerHTML = getJobDetailsHTML();
    panel.querySelector("#__jf_close").addEventListener("click", () => panel.remove());
    panel.querySelector("#__jf_sign_in_link")?.addEventListener("click", (e) => {
      e.preventDefault();
      renderPanelContent(panel, "signin");
    });
  }
}

function getJobDetailsHTML() {
  return `
    <div style="padding:12px 16px; border-bottom:1px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; color: white;">
      <div style="font-weight:600; font-size: 15px;">🔖 Job Fingerprint</div>
      <div style="cursor:pointer; font-size:20px; line-height:1; opacity: 0.9;" id="__jf_close">×</div>
    </div>
    <div style="padding:16px; font-size:14px; color:#111827">
      <div style="margin-bottom:16px; font-size: 13px; font-weight: 600; color: #6b7280;">JOB STATUS</div>
      <div style="margin-bottom:16px; padding: 12px; background: #f9fafb; border-radius: 8px;">
        <strong style="color: #374151;">Bookmarked:</strong> 
        <span id="__jf_bookmark" style="color: #667eea; font-weight: 600;">Checking…</span>
      </div>
      <div id="__jf_hint" style="color:#6b7280; font-size:12px; line-height: 1.5;"></div>
      <div id="__jf_auth_prompt" style="margin-top: 12px; padding: 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; font-size: 12px; color: #92400e; display: none;">
        Please <a href="#" id="__jf_sign_in_link" style="color: #667eea; text-decoration: underline; font-weight: 600;">sign in</a> to use Job Fingerprint
      </div>
    </div>
  `;
}

// Determine whether we should inject the floating panel on this site.
function shouldAllowPanel() {
  const blocked = [
    'simplify', // may refer to simplyhired/simply or similar lightweight job pages
    'indeed',
    'glassdoor',
    'dice',
    'ziprecruiter',
    'builtin',
    'welcometojungle',
    'jobot',
    'jobworkable'
  ];
  const host = (location.hostname || '').toLowerCase();
  return !blocked.some(b => host.includes(b));
}

function getSignInHTML() {
  return `
    <div style="padding:12px 16px; border-bottom:1px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; color: white;">
      <div style="font-weight:600; font-size: 15px;">🔖 Sign In</div>
      <div style="cursor:pointer; font-size:20px; line-height:1; opacity: 0.9;" id="__jf_close">×</div>
    </div>
    <div id="__jf_signin_step1" style="padding:16px;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Email Address</label>
        <input id="__jf_signin_email" type="email" placeholder="you@example.com" 
          style="width: 100%; padding: 9px 11px; border: 1.5px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none; transition: border 0.2s;"
          onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'" />
      </div>
      <button id="__jf_send_code_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; font-size: 13px; cursor: pointer; transition: transform 0.2s;"
        onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
        Send Verification Code
      </button>
      <div id="__jf_signin_msg" style="margin-top: 10px; font-size: 12px; color: #6b7280; display: none; padding: 8px; border-radius: 6px;"></div>
      <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #6b7280;">
        Don't have an account? <a href="#" id="__jf_signup_link" style="color: #667eea; text-decoration: none; font-weight: 600;">Sign up</a>
      </div>
    </div>
    <div id="__jf_signin_step2" style="padding:16px; display: none;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Verification Code</label>
        <input id="__jf_signin_otp" type="text" maxlength="6" placeholder="123456" 
          style="width: 100%; padding: 9px 11px; border: 1.5px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none; text-align: center; letter-spacing: 4px; font-weight: 600;"
          onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'" />
        <div style="font-size: 11px; color: #9ca3af; margin-top: 6px;">Check your email for the 6-digit code</div>
      </div>
      <button id="__jf_verify_signin_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; font-size: 13px; cursor: pointer; margin-bottom: 8px;">
        Verify & Sign In
      </button>
      <button id="__jf_back_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: #f3f4f6; color: #374151; font-weight: 600; font-size: 13px; cursor: pointer;">
        Back
      </button>
      <div id="__jf_signin_msg2" style="margin-top: 10px; font-size: 12px; color: #6b7280; display: none; padding: 8px; border-radius: 6px;"></div>
    </div>
  `;
}

function getSignUpHTML() {
  return `
    <div style="padding:12px 16px; border-bottom:1px solid #f3f4f6; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; color: white;">
      <div style="font-weight:600; font-size: 15px;">🔖 Sign Up</div>
      <div style="cursor:pointer; font-size:20px; line-height:1; opacity: 0.9;" id="__jf_close">×</div>
    </div>
    <div id="__jf_signup_step1" style="padding:16px;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Username</label>
        <input id="__jf_signup_username" type="text" placeholder="e.g. sunny-dev" 
          style="width: 100%; padding: 9px 11px; border: 1.5px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none;"
          onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Email Address</label>
        <input id="__jf_signup_email" type="email" placeholder="you@example.com" 
          style="width: 100%; padding: 9px 11px; border: 1.5px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none;"
          onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'" />
      </div>
      <button id="__jf_signup_send_code_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; font-size: 13px; cursor: pointer;">
        Create Account
      </button>
      <div id="__jf_signup_msg" style="margin-top: 10px; font-size: 12px; color: #6b7280; display: none; padding: 8px; border-radius: 6px;"></div>
      <div style="text-align: center; margin-top: 12px; font-size: 12px; color: #6b7280;">
        Already have an account? <a href="#" id="__jf_signin_link" style="color: #667eea; text-decoration: none; font-weight: 600;">Sign in</a>
      </div>
    </div>
    <div id="__jf_signup_step2" style="padding:16px; display: none;">
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Verification Code</label>
        <input id="__jf_signup_otp" type="text" maxlength="6" placeholder="123456" 
          style="width: 100%; padding: 9px 11px; border: 1.5px solid #e5e7eb; border-radius: 6px; font-size: 13px; outline: none; text-align: center; letter-spacing: 4px; font-weight: 600;"
          onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'" />
        <div style="font-size: 11px; color: #9ca3af; margin-top: 6px;">Check your email for the 6-digit code</div>
      </div>
      <button id="__jf_verify_signup_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; font-size: 13px; cursor: pointer; margin-bottom: 8px;">
        Verify & Complete Sign Up
      </button>
      <button id="__jf_signup_back_btn" 
        style="width: 100%; padding: 10px; border: none; border-radius: 6px; background: #f3f4f6; color: #374151; font-weight: 600; font-size: 13px; cursor: pointer;">
        Back
      </button>
      <div id="__jf_signup_msg2" style="margin-top: 10px; font-size: 12px; color: #6b7280; display: none; padding: 8px; border-radius: 6px;"></div>
    </div>
  `;
}

function showPanelMessage(msgId, text, type = "info") {
  const msgEl = document.getElementById(msgId);
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.display = "block";
  if (type === "success") {
    msgEl.style.background = "#d1fae5";
    msgEl.style.color = "#065f46";
    msgEl.style.border = "1px solid #6ee7b7";
  } else if (type === "error") {
    msgEl.style.background = "#fee2e2";
    msgEl.style.color = "#991b1b";
    msgEl.style.border = "1px solid #fca5a5";
  } else {
    msgEl.style.background = "#dbeafe";
    msgEl.style.color = "#1e40af";
    msgEl.style.border = "1px solid #93c5fd";
  }
}

function attachSignInListeners(panel) {
  panel.querySelector("#__jf_close").addEventListener("click", () => panel.remove());
  
  const step1 = panel.querySelector("#__jf_signin_step1");
  const step2 = panel.querySelector("#__jf_signin_step2");
  const emailInput = panel.querySelector("#__jf_signin_email");
  const otpInput = panel.querySelector("#__jf_signin_otp");
  
  // Send code button
  panel.querySelector("#__jf_send_code_btn").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showPanelMessage("__jf_signin_msg", "Please enter a valid email address", "error");
      return;
    }
    
    try {
      showPanelMessage("__jf_signin_msg", "Sending code...", "info");
      await sendEmailOtp(email);
      showPanelMessage("__jf_signin_msg", "Code sent! Check your inbox.", "success");
      setTimeout(() => {
        step1.style.display = "none";
        step2.style.display = "block";
        otpInput.focus();
      }, 1000);
    } catch (e) {
      showPanelMessage("__jf_signin_msg", `Error: ${e.message}`, "error");
    }
  });
  
  // Verify button
  panel.querySelector("#__jf_verify_signin_btn").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
      showPanelMessage("__jf_signin_msg2", "Please enter the 6-digit code", "error");
      return;
    }
    
    try {
      showPanelMessage("__jf_signin_msg2", "Verifying...", "info");
      const session = await verifyEmailOtp(email, otp);
      console.log("session", session);
      const userId = session.user?.id;
      const userEmail = session.user?.email || email;
      
      // Try to get existing user profile from User table
      let userProfile = null;
      try {
        userProfile = await getUserProfile(userId);
      } catch (e) {
        console.log('No existing profile found, will create new one');
      }
      console.log("userProfile", userProfile);
      const updatedsession = session.session;
      console.log("updatedsession", updatedsession);
      // Use existing username or create from email
      const username = userProfile?.username || userEmail.split("@")[0];
      
      // Upsert user profile to User table (create if doesn't exist, update if exists)
      await upsertUser({ id: userId, email: userEmail, username }, updatedsession.access_token);
      updatedsession.ts = Date.now();
      await storage.set({
        [STORAGE_KEYS.session]: updatedsession,
        [STORAGE_KEYS.user]: { id: userId, email: userEmail, username }
      });
      
      showPanelMessage("__jf_signin_msg2", "Success! Signed in.", "success");
      setTimeout(() => {
        renderPanelContent(panel, "job");
        checkBookmarkForPage();
      }, 800);
    } catch (e) {
      showPanelMessage("__jf_signin_msg2", `Verification failed: ${e.message}`, "error");
    }
  });
  
  // Back button
  panel.querySelector("#__jf_back_btn").addEventListener("click", () => {
    step2.style.display = "none";
    step1.style.display = "block";
    otpInput.value = "";
  });
  
  // Switch to signup
  panel.querySelector("#__jf_signup_link").addEventListener("click", (e) => {
    e.preventDefault();
    renderPanelContent(panel, "signup");
  });
  
  // Enter key handlers
  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") panel.querySelector("#__jf_send_code_btn").click();
  });
  otpInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") panel.querySelector("#__jf_verify_signin_btn").click();
  });
}

function attachSignUpListeners(panel) {
  panel.querySelector("#__jf_close").addEventListener("click", () => panel.remove());
  
  const step1 = panel.querySelector("#__jf_signup_step1");
  const step2 = panel.querySelector("#__jf_signup_step2");
  const usernameInput = panel.querySelector("#__jf_signup_username");
  const emailInput = panel.querySelector("#__jf_signup_email");
  const otpInput = panel.querySelector("#__jf_signup_otp");
  
  // Send code button
  panel.querySelector("#__jf_signup_send_code_btn").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    let username = usernameInput.value.trim();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showPanelMessage("__jf_signup_msg", "Please enter a valid email address", "error");
      return;
    }
    if (!username) {
      username = email.split("@")[0];
      usernameInput.value = username;
    }
    
    try {
      showPanelMessage("__jf_signup_msg", "Creating account...", "info");
      const res = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (res.error) throw res.error;
      
      showPanelMessage("__jf_signup_msg", "Code sent! Check your inbox.", "success");
      setTimeout(() => {
        step1.style.display = "none";
        step2.style.display = "block";
        otpInput.focus();
      }, 1000);
    } catch (e) {
      showPanelMessage("__jf_signup_msg", `Error: ${e.message}`, "error");
    }
  });
  
  // Verify button
  panel.querySelector("#__jf_verify_signup_btn").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    let username = usernameInput.value.trim();
    
    if (!otp || otp.length !== 6) {
      showPanelMessage("__jf_signup_msg2", "Please enter the 6-digit code", "error");
      return;
    }
    if (!username) username = email.split("@")[0];
    
    try {
      showPanelMessage("__jf_signup_msg2", "Verifying...", "info");
      const session = await verifyEmailOtp(email, otp);
      const userId = session.user?.id;
      const userEmail = session.user?.email || email;
      const updatedsession = session.session;

      await upsertUser({ id: userId, email: userEmail, username }, updatedsession.access_token);
      updatedsession.ts = Date.now();
      await storage.set({
        [STORAGE_KEYS.session]: updatedsession,
        [STORAGE_KEYS.user]: { id: userId, email: userEmail, username }
      });
      
      showPanelMessage("__jf_signup_msg2", "Account created! Welcome.", "success");
      setTimeout(() => {  
        renderPanelContent(panel, "job");
        checkBookmarkForPage();
      }, 800);
    } catch (e) {
      showPanelMessage("__jf_signup_msg2", `Verification failed: ${e.message}`, "error");
    }
  });
  
  // Back button
  panel.querySelector("#__jf_signup_back_btn").addEventListener("click", () => {
    step2.style.display = "none";
    step1.style.display = "block";
    otpInput.value = "";
  });
  
  // Switch to signin
  panel.querySelector("#__jf_signin_link").addEventListener("click", (e) => {
    e.preventDefault();
    renderPanelContent(panel, "signin");
  });
  
  // Enter key handlers
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") emailInput.focus();
  });
  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") panel.querySelector("#__jf_signup_send_code_btn").click();
  });
  otpInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") panel.querySelector("#__jf_verify_signup_btn").click();
  });
}

function setBookmarkText(text) {
  let el = document.getElementById("__jf_bookmark");
  if (!el && shouldAllowPanel()) {
    const panel = ensurePanel();
    el = panel && panel.querySelector("#__jf_bookmark");
  }
  if (el) el.textContent = text;
}

function setHint(text) {
  let el = document.getElementById("__jf_hint");
  if (!el && shouldAllowPanel()) {
    const panel = ensurePanel();
    el = panel && panel.querySelector("#__jf_hint");
  }
  if (el) el.textContent = text || "";
}

// Escape text to safely insert into HTML
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  // Basic attribute escaping; also ensure it starts with http/https to reduce XSS risk
  const s = escapeHtml(str);
  if (/^https?:\/\//i.test(s)) return s;
  return '#';
}

// Format a date-like value as YYYY-MM-DD. If missing, returns current date.
function formatIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  try {
    // If it's a numeric timestamp
    if (typeof value === 'number' || /^[0-9]+$/.test(String(value))) {
      const d = new Date(Number(value));
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
    }

    const parsed = Date.parse(value);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  } catch (e) {
    // fallthrough
  }
  return new Date().toISOString().slice(0, 10);
}

// Shorten displayed strings (e.g., URLs) to max length and append ellipsis
function shortenDisplay(str, maxLen = 40) {
  if (!str && str !== 0) return '';
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + '...';
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
  console.log("session", session);
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
  const uuid = getJobUuid(location.href);
  console.log("Checking bookmark for UUID:", uuid);
  if (!uuid) {
    // Don't create the panel on non-job pages. Only update UI if panel already exists.
    const bookmarkEl = document.getElementById("__jf_bookmark");
    const hintEl = document.getElementById("__jf_hint");
    if (bookmarkEl) bookmarkEl.textContent = "No ID found";
    if (hintEl) hintEl.textContent = "Open a job detail page with an ID/UUID in its URL.";
    // If an auth prompt element exists, hide it (don't create panel just to show it)
    const authPrompt = document.getElementById("__jf_auth_prompt");
    if (authPrompt) authPrompt.style.setProperty("display", "none");
    return;
  }

  const user = await getUser();
  const token = await ensureAccessToken();

  console.log(user, token);

  if (!user?.id || !token) {
    // Update bookmark/hint only if panel exists. If not, open sign-in panel so user can sign in.
    const bookmarkEl = document.getElementById("__jf_bookmark");
    const hintEl = document.getElementById("__jf_hint");
    if (bookmarkEl) bookmarkEl.textContent = "Not signed in";
    if (hintEl) hintEl.textContent = "";

    // If panel is already present show the auth prompt; otherwise open sign-in panel so user can sign in
    const authPrompt = document.getElementById("__jf_auth_prompt");
    if (authPrompt) {
      authPrompt.style.display = "block";
      const signInLink = document.getElementById("__jf_sign_in_link");
      if (signInLink) {
        signInLink.addEventListener("click", (e) => {
          e.preventDefault();
          const panel = document.getElementById(PANEL_ID);
          if (panel) renderPanelContent(panel, "signin");
        });
      }
    } else {
      // Create the panel to prompt sign-in if no UI exists yet
      const panel = ensurePanel();
      renderPanelContent(panel, "signin");
    }
    return;
  }

  document.getElementById("__jf_auth_prompt")?.style.setProperty("display", "none");

  try {
    setBookmarkText("Checking…");
    const rows = await findPositionByUuid({ uuid, user_id: user.id }, token);
    setBookmarkText(rows.length ? "YES" : "NO");

    // If the position already exists, show its key fields (title, company, uuid, position_url)
    if (rows && rows.length > 0) {
      const r = rows[0];
      const title = r.job_title || r.title || '(No title)';
      const company = r.company || '(No company)';
      const uuidRow = r.uuid || r.id || r.job_id || '(No UUID)';
      const posUrl = r.position_url || r.positionUrl || r.url || '(No URL)';

      // Render hint using same visual style as the bookmark text and make URL clickable
      let hintEl = document.getElementById("__jf_hint");
      if (!hintEl && shouldAllowPanel()) {
        const panel = ensurePanel();
        hintEl = panel && panel.querySelector("#__jf_hint");
      }
      if (hintEl) {
        const dateRaw = r.created_at || r.saved_at || r.inserted_at || r.ts || r.updated_at || null;
        const dateDisplay = formatIsoDate(dateRaw);

        const displayUrl = shortenDisplay(posUrl, 40);
        hintEl.innerHTML = `
          <div style="font-size:12px; line-height:0.8; white-space: pre-wrap; background: #f9fafb; padding: 8px; border-radius: 8px; margin-top: 6px;">
            <div><strong style="color: #374151;">Title:</strong> <span style="color: #667eea; font-weight:600;">${escapeHtml(title)}</span></div>
            <div><strong style="color: #374151;">Company:</strong> <span style="color: #667eea; font-weight:600;">${escapeHtml(company)}</span></div>
            <div><strong style="color: #374151;">UUID:</strong> <span style="color: #667eea; font-weight:600;">${escapeHtml(uuidRow)}</span></div>
            <div><strong style="color: #374151;">Date:</strong> <span style="color: #667eea; font-weight:600;">${escapeHtml(dateDisplay)}</span></div>
            <div><strong style="color: #374151;">URL:</strong> <span style="color: #667eea; font-weight:600;"><a href="${escapeAttr(posUrl)}" target="_blank" rel="noopener noreferrer" style="color:inherit; text-decoration:underline;">${escapeHtml(displayUrl)}</a></span></div>
            <div>Press Alt + X to delete this job.</div>
          </div>
        `;
      } else {
        const dateRaw = r.created_at || r.saved_at || r.inserted_at || r.ts || r.updated_at || null;
        const dateDisplay = formatIsoDate(dateRaw);
        const displayUrl = shortenDisplay(posUrl, 40);
        const details = `Title: ${title}\nCompany: ${company}\nUUID: ${uuidRow}\nDate: ${dateDisplay}\nURL: ${displayUrl}\n Press Alt + X to delete this job.`;
        setHint(details);
      }
    } else {
      setHint("Press Alt + X to save this job.");
    }
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

// ---- Save job on Alt + X (and via background command) ----
async function saveCurrentJob() {
  const user = await getUser();
  const token = await ensureAccessToken();
  if (!user?.id || !token) {
    if (shouldAllowPanel()) {
      const panel = ensurePanel();
      renderPanelContent(panel, "signin");
    } else {
      setBookmarkText("Not signed in");
      setHint("Open the extension to sign in.");
    }
    return;
  }

  const uuid = getJobUuid(location.href);
  if (!uuid) {
    if (shouldAllowPanel()) ensurePanel();
    setBookmarkText("Error");
    setHint("Could not extract job ID from URL. Make sure you're on a job detail page.");
    return;
  }

  // First check if this position is already bookmarked
  try {
    const rows = await findPositionByUuid({ uuid, user_id: user.id }, token);
    if (rows && rows.length > 0) {
      // Position exists - delete it (un-bookmark)
      await deletePositionApplied({ uuid, user_id: user.id }, token);
      checkBookmarkForPage(); // Refresh UI to show "NO"
      return;
    }
  } catch (e) {
    console.error("Error checking bookmark status:", e);
    // Continue with save attempt even if check failed
  }

  const data = getJobData();
  console.log("data", data);
  console.log("uuid", uuid);
  
  try {
    await savePositionApplied({ 
      ...data, 
      user_id: user.id,
      uuid: uuid  // Include the job position UUID
    }, token);
    checkBookmarkForPage();
    // setBookmarkText("YES");
    // setHint("Saved to Supabase.");
  } catch (e) {
    if (shouldAllowPanel()) ensurePanel();
    setBookmarkText("Error");
    setHint(e.message || "Failed to save.");
  }
}

// Capture keyboard in page - Alt+X to save job
window.addEventListener("keydown", (e) => {
  if (e.altKey && (e.key === "x" || e.key === "X")) {
    e.preventDefault();
    saveCurrentJob();
  }
}, true);

// Receive command from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SAVE_JOB") saveCurrentJob();
});
