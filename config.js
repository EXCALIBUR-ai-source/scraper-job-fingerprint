// Note: supabase is now loaded from supabase.js content script

// Make these globally accessible by using window object
const storage = {
  async set(obj) { return chrome.storage.local.set(obj); },
  async get(keys) { return chrome.storage.local.get(keys); },
  async remove(keys) { return chrome.storage.local.remove(keys); }
};

const STORAGE_KEYS = {
  session: "jf.session",
  user: "jf.user"
};


async function sendEmailOtp(email) {
  const res = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `chrome-extension://${chrome.runtime.id}/auth-callback.html`
    }
  });
  return res?.data || null || undefined;
}

async function verifyEmailOtp(email, token) {
  const res = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email"
  });
  return res?.data || null || undefined;
}

async function refreshSession(refresh_token) {
  const res = await supabase.auth.refreshSession(refresh_token);
  return res?.data || null || undefined;
}

async function upsertUser({ id, email, username }, accessToken) {
  // Insert or update user profile in User table
  // Fields: id (UUID from auth.users), email, username, created_at (auto-set by Supabase)
  
  try {
    // Step 1: Check if user profile exists by ID (primary check)
    const { data: existingUserById } = await supabase
      .from('User')
      .select('id, email, username')
      .eq('id', id)
      .maybeSingle();
    
    if (existingUserById) {
      // Profile exists with this ID, update it
      const { data, error } = await supabase
        .from('User')
        .update({ email, username })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(error.message || 'Failed to update user profile');
      }
      
      console.log('User profile updated (by ID):', data);
      return data;
    }
    
    // Step 2: Check if a profile exists with this email but different ID
    const { data: existingUserByEmail } = await supabase
      .from('User')
      .select('id, email, username')
      .eq('email', email)
      .maybeSingle();
    
    if (existingUserByEmail) {
      // Profile existsNot signed in with this email but different ID
      // This can happen if auth user was recreated or data is inconsistent
      console.log('Found existing profile with email but different ID. Replacing with new auth user ID.');
      
      // Delete the old profile first
      const { error: deleteError } = await supabase
        .from('User')
        .delete()
        .eq('email', email);
      
      if (deleteError) {
        console.error('Error deleting old profile:', deleteError);
        throw new Error('Failed to migrate user profile');
      }
      
      // Insert new profile with correct auth user ID
      const { data, error } = await supabase
        .from('User')
        .insert([{ id, email, username }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating migrated profile:', error);
        throw new Error(error.message || 'Failed to create user profile');
      }
      
      console.log('User profile migrated (replaced):', data);
      return data;
    }
    
    // Step 3: No profile exists, create a new one
    const { data, error } = await supabase
      .from('User')
      .insert([{ id, email, username }])
      .select()
      .single();
    
    if (error) {
      // Check if it's a duplicate email error (shouldn't happen after checks above)
      if (error.code === '23505' && error.message.includes('email')) {
        throw new Error('This email is already registered. If you are signing in, please try again. If the issue persists, contact support.');
      }
      console.error('Error creating user profile:', error);
      throw new Error(error.message || 'Failed to create user profile');
    }
    
    console.log('User profile created:', data);
    return data;
  } catch (error) {
    console.error('Error in upsertUser:', error);
    throw error;
  }
}

async function getUserProfile(userId) {
  // Fetch user profile from User table
  const res = await supabase
    .from('User')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (res.error && res.error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching user profile:', res.error);
    throw new Error(res.error.message || 'Failed to fetch user profile');
  }
  
  return res.data || null;
}

async function savePositionApplied({ company, job_title, position_url, user_id, uuid }, accessToken) {
  // Insert job application into positionApplied table
  // Fields: id (auto), created_at (auto), company, job_title, position_url, user_id, UUID
  const res = await supabase
    .from('positionApplied')
    .insert([{
      company,
      job_title,
      position_url,
      user_id,
      UUID: uuid  // Job position identifier extracted from URL
    }])
    .select();
  
  if (res.error) {
    console.error('Error saving position:', res.error);
    throw new Error(res.error.message || 'Failed to save job application');
  }
  
  console.log('Job application saved:', res.data);
  return res.data;
}

async function findPositionByUuid({ uuid, user_id }, accessToken) {
    const res = await supabase.from('positionApplied').select('*').eq('user_id', user_id).eq('UUID', uuid);
    return res?.data || null || undefined;
}

async function deletePositionApplied({ uuid, user_id }, accessToken) {
    const res = await supabase
        .from('positionApplied')
        .delete()
        .eq('user_id', user_id)
        .eq('UUID', uuid);

    if (res.error) {
        console.error('Error deleting position:', res.error);
        throw new Error(res.error.message || 'Failed to delete job application');
    }

    console.log('Job application deleted:', { uuid, user_id });
    return true;
}

// Make functions globally accessible
window.sendEmailOtp = sendEmailOtp;
window.verifyEmailOtp = verifyEmailOtp;
window.refreshSession = refreshSession;
window.upsertUser = upsertUser;
window.getUserProfile = getUserProfile;
window.savePositionApplied = savePositionApplied;
window.findPositionByUuid = findPositionByUuid;
window.deletePositionApplied = deletePositionApplied;
