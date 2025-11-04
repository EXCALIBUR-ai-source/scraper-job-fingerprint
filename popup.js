const el = (id) => document.getElementById(id);
const msg = (text, cls="muted") => { const m = el("msg"); m.className = cls; m.textContent = text; };

(async function init() {
  const { [STORAGE_KEYS.session]: session, [STORAGE_KEYS.user]: user } =
    await storage.get([STORAGE_KEYS.session, STORAGE_KEYS.user]);

  if (session?.access_token && user?.id) {
    showSignedIn(user);
  } else {
    showSignedOut();
  }
})();

function showSignedOut() {
  el("signedOut").classList.remove("hidden");
  el("signedIn").classList.add("hidden");
}

function showSignedIn(user) {
  el("signedIn").classList.remove("hidden");
  el("signedOut").classList.add("hidden");
  el("who").textContent = `${user.username || user.email} (${user.email})`;
}

el("sendCodeBtn").addEventListener("click", async () => {
  const email = el("email").value.trim();
  if (!email) return msg("Please enter your email.", "error");
  msg("Sending code…");
  try {
    await sendEmailOtp(email);
    msg("Code sent! Check your inbox.", "success");
  } catch (e) {
    msg(`Error: ${e.message}`, "error");
  }
});

el("verifyBtn").addEventListener("click", async () => {
  const email = el("email").value.trim();
  const otp = el("otp").value.trim();
  let username = el("username").value.trim();
  if (!email || !otp) return msg("Enter your email and the 6-digit code.", "error");

  if (!username) {
    username = email.split("@")[0];
  }

  msg("Verifying…");
  try {
    const session = await verifyEmailOtp(email, otp); // { access_token, refresh_token, user }
    const userId = session.user?.id;

    // Upsert User table: id, username, email
    await upsertUser({ id: userId, email, username }, session.access_token);

    await storage.set({
      [STORAGE_KEYS.session]: { ...session, ts: Date.now() },
      [STORAGE_KEYS.user]: { id: userId, email, username }
    });

    msg("Signed in!", "success");
    showSignedIn({ id: userId, email, username });
  } catch (e) {
    msg(`Verify failed: ${e.message}`, "error");
  }
});

el("signOutBtn").addEventListener("click", async () => {
  await storage.remove([STORAGE_KEYS.session, STORAGE_KEYS.user]);
  showSignedOut();
});
