// Router: Check auth state and redirect to appropriate page
(async function router() {
  try {
    const { [STORAGE_KEYS.session]: session, [STORAGE_KEYS.user]: user } =
      await storage.get([STORAGE_KEYS.session, STORAGE_KEYS.user]);

    // Check if user has a valid session
    if (session?.access_token && user?.id) {
      // Check if session is still valid (not expired)
      const sessionAge = Date.now() - (session.ts || 0);
      const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days

      if (sessionAge < maxAge) {
        // Valid session, go to dashboard
        window.location.href = 'dashboard.html';
        return;
      }
    }

    // No valid session, go to signin
    window.location.href = 'signin.html';
  } catch (e) {
    console.error("Router error:", e);
    // Default to signin on error
    window.location.href = 'signin.html';
  }
})();
