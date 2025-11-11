// --- Supabase config (client-side) ---
const SUPABASE_URL = "https://nctyyffspvscotsscfex.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHl5ZmZzcHZzY290c3NjZmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDI2MjIsImV4cCI6MjA3NzY3ODYyMn0.TDlVi7wp4H0Drmnx9DnKZ5CxVotNnrbuR-C6EJsH6qE"; // <- your anon/public key ONLY

// Create Supabase client
// For content scripts: supabase-js.umd.js exposes the library at window.supabase
// For popup: the CDN version exposes it at window.supabase
let supabase = null;

// Wait for supabase library to be available
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  
  // Listen to auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    // session?.access_token is now available if signed in
  });
}