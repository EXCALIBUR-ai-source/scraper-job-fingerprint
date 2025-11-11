const el = (id) => document.getElementById(id);

function showMessage(elementId, text, type = "info") {
  const msgEl = el(elementId);
  msgEl.textContent = text;
  msgEl.className = `message show ${type}`;
}

function hideMessage(elementId) {
  el(elementId).className = "message";
}

function showStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  el(`step${stepNum}`).classList.add('active');
}

// Check if already signed in
(async function checkAuth() {
  const { [STORAGE_KEYS.session]: session, [STORAGE_KEYS.user]: user } =
    await storage.get([STORAGE_KEYS.session, STORAGE_KEYS.user]);

  if (session?.access_token && user?.id) {
    // Already signed in, redirect to dashboard
    window.location.href = 'dashboard.html';
  }
})();

// Send verification code for signup
el("sendCodeBtn").addEventListener("click", async () => {
  const email = el("email").value.trim();
  let username = el("username").value.trim();
  
  if (!email) {
    showMessage("message", "Please enter your email address.", "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("message", "Please enter a valid email address.", "error");
    return;
  }
  if (!username) {
    username = email.split("@")[0];
    el("username").value = username;
  }

  el("sendCodeBtn").disabled = true;
  el("sendCodeBtn").textContent = "Creating account...";
  hideMessage("message");

  try {
    // For signup, we use the same OTP flow but with shouldCreateUser: true
    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    });
    
    if (res.error) throw res.error;
    
    showMessage("message", "Verification code sent! Check your inbox.", "success");
    setTimeout(() => {
      showStep(2);
      el("otp").focus();
    }, 1500);
  } catch (e) {
    showMessage("message", `Error: ${e.message}`, "error");
  } finally {
    el("sendCodeBtn").disabled = false;
    el("sendCodeBtn").textContent = "Create Account";
  }
});

// Handle Enter key on inputs
el("username").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    el("email").focus();
  }
});

el("email").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    el("sendCodeBtn").click();
  }
});

// Verify code and complete signup
el("verifyBtn").addEventListener("click", async () => {
  const email = el("email").value.trim();
  const otp = el("otp").value.trim();
  let username = el("username").value.trim();

  if (!otp || otp.length !== 6) {
    showMessage("message2", "Please enter the 6-digit verification code.", "error");
    return;
  }

  if (!username) {
    username = email.split("@")[0];
  }

  el("verifyBtn").disabled = true;
  el("verifyBtn").textContent = "Verifying...";
  hideMessage("message2");

  try {
    const session = await verifyEmailOtp(email, otp);
    const userId = session.user?.id;
    const userEmail = session.user?.email || email;

    // Insert user profile into User table in Supabase
    // Table fields: id (UUID), email, username, created_at (auto)
    await upsertUser({ id: userId, email: userEmail, username }, session.access_token);

    // Save session and user data to local extension storage
    await storage.set({
      [STORAGE_KEYS.session]: { ...session, ts: Date.now() },
      [STORAGE_KEYS.user]: { id: userId, email: userEmail, username }
    });

    showMessage("message2", "Account created! Redirecting to dashboard...", "success");
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (e) {
    showMessage("message2", `Verification failed: ${e.message}`, "error");
    el("verifyBtn").disabled = false;
    el("verifyBtn").textContent = "Verify & Complete Sign Up";
  }
});

// Handle Enter key on OTP input
el("otp").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    el("verifyBtn").click();
  }
});

// Back button
el("backBtn").addEventListener("click", () => {
  showStep(1);
  el("otp").value = "";
  hideMessage("message2");
});

