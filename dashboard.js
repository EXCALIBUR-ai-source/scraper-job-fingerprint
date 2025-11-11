const el = (id) => document.getElementById(id);

let currentUser = null;
let currentSession = null;

// Initialize dashboard
(async function init() {
  try {
    const { [STORAGE_KEYS.session]: session, [STORAGE_KEYS.user]: user } =
      await storage.get([STORAGE_KEYS.session, STORAGE_KEYS.user]);

    if (!session?.access_token || !user?.id) {
      // Not signed in, redirect to signin
      window.location.href = 'signin.html';
      return;
    }

    currentUser = user;
    currentSession = session;

    // Display user info
    el("userName").textContent = user.username || "User";
    el("userEmail").textContent = user.email;
    
    // Set avatar initial
    const initial = (user.username || user.email || "?")[0].toUpperCase();
    el("avatar").textContent = initial;

    // Load jobs
    await loadJobs();

    // Hide loading, show dashboard
    el("loading").style.display = "none";
    el("dashboard").style.display = "block";
  } catch (e) {
    console.error("Dashboard init error:", e);
    window.location.href = 'signin.html';
  }
})();

// Load saved jobs
async function loadJobs() {
  try {
    const { data, error } = await supabase
      .from('positionApplied')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const jobs = data || [];
    
    // Update stats
    el("totalJobs").textContent = jobs.length;
    
    // Calculate jobs this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentJobs = jobs.filter(job => new Date(job.created_at) > oneWeekAgo);
    el("recentJobs").textContent = recentJobs.length;

    // Display jobs list
    const jobList = el("jobList");
    if (jobs.length === 0) {
      jobList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">No jobs saved yet</div>
          <div class="empty-state-hint">
            Press <span class="kbd">Alt + X</span> on any job page to save it
          </div>
        </div>
      `;
    } else {
      jobList.innerHTML = jobs.map(job => `
        <div class="job-item">
          <div class="job-title">${escapeHtml(job.job_title || "Untitled Position")}</div>
          <div class="job-company">${escapeHtml(job.company || "Unknown Company")}</div>
          <a href="${escapeHtml(job.position_url)}" target="_blank" class="job-url" title="${escapeHtml(job.position_url)}">
            ${escapeHtml(job.position_url)}
          </a>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error("Error loading jobs:", e);
    el("jobList").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text" style="color: #dc2626;">Error loading jobs</div>
        <div class="empty-state-hint">${escapeHtml(e.message)}</div>
      </div>
    `;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Refresh jobs
el("refreshBtn").addEventListener("click", async () => {
  const btn = el("refreshBtn");
  const originalText = btn.textContent;
  btn.textContent = "🔄 Refreshing...";
  btn.disabled = true;
  
  await loadJobs();
  
  btn.textContent = originalText;
  btn.disabled = false;
});

// Sign out
el("signOutBtn").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to sign out?")) {
    return;
  }

  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage
    await storage.remove([STORAGE_KEYS.session, STORAGE_KEYS.user]);
    
    // Redirect to signin
    window.location.href = 'signin.html';
  } catch (e) {
    alert("Error signing out: " + e.message);
  }
});

