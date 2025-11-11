# 🔐 User Profile System - Complete Guide

## 📊 Supabase User Table

Your Supabase database has a **`User`** table with the following structure:

```
┌──────────────────────────────────────┐
│           User Table                 │
├──────────────────────────────────────┤
│ id         UUID (Primary Key)        │ ← Links to auth.users(id)
│ email      TEXT                      │ ← User's email address
│ username   TEXT                      │ ← Display name
│ created_at TIMESTAMP                 │ ← Auto-generated
└──────────────────────────────────────┘
```

## 🔄 How User Profiles Are Created

### Method 1: Sign Up (signup.html)
```
User Flow:
1. Opens signup.html
2. Enters username + email
3. Receives OTP code
4. Verifies code
5. ✅ Extension creates profile in User table
6. Redirects to dashboard

Database Action:
INSERT INTO "User" (id, email, username)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- from auth.users
  'john@example.com',
  'john-dev'
);
```

### Method 2: Sign In (signin.html)
```
User Flow:
1. Opens signin.html
2. Enters email
3. Receives OTP code
4. Verifies code
5. ✅ Extension checks if profile exists
6. ✅ Creates profile if missing, updates if exists
7. Redirects to dashboard

Database Actions:
-- Check if profile exists
SELECT * FROM "User" WHERE id = '550e8400...';

-- If not exists, insert:
INSERT INTO "User" (id, email, username)
VALUES ('550e8400...', 'john@example.com', 'john');

-- If exists, update:
UPDATE "User" 
SET email = 'john@example.com', username = 'john'
WHERE id = '550e8400...';
```

### Method 3: Content Panel (content.js)
```
User Flow:
1. User presses Alt+A on job page (not signed in)
2. Panel opens with sign-in/sign-up form
3. User signs up or signs in via panel
4. ✅ Extension creates/updates profile in User table
5. Panel shows job bookmark status

Same database actions as Methods 1 & 2
```

## 💻 Code Implementation

### Creating User Profile (`config.js`)

```javascript
async function upsertUser({ id, email, username }, accessToken) {
  // Insert or update user profile in User table
  const res = await supabase
    .from('User')
    .upsert(
      { id, email, username }, 
      { 
        onConflict: 'id',
        ignoreDuplicates: false  // Always update
      }
    );
  
  if (res.error) {
    throw new Error('Failed to save user profile');
  }
  
  return res.data;
}
```

### Usage in Sign Up (`signup.js`)

```javascript
// After OTP verification
const session = await verifyEmailOtp(email, otp);
const userId = session.user?.id;

// 📝 CREATE USER PROFILE IN USER TABLE
await upsertUser({ 
  id: userId,              // UUID from auth.users
  email: userEmail,        // User's email
  username: username       // User's chosen username
}, session.access_token);
```

### Usage in Sign In (`signin.js`)

```javascript
// After OTP verification
const session = await verifyEmailOtp(email, otp);
const userId = session.user?.id;

// 🔍 CHECK IF PROFILE EXISTS
let userProfile = await getUserProfile(userId);

// Use existing username or create from email
const username = userProfile?.username || email.split("@")[0];

// 📝 UPSERT USER PROFILE (create or update)
await upsertUser({ 
  id: userId,
  email: userEmail,
  username: username
}, session.access_token);
```

## ✅ What Happens During Authentication

### Sign Up Journey
```
┌──────────────┐
│ User Signs Up│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. Supabase creates auth user       │
│    Table: auth.users                │
│    ID: 550e8400-e29b-41d4-a716...   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 2. User verifies OTP                │
│    Status: Authenticated ✅          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. Extension calls upsertUser()     │
│    Table: User                      │
│    INSERT:                          │
│    - id: 550e8400... (same as auth) │
│    - email: user@example.com        │
│    - username: user                 │
│    - created_at: 2025-11-09 (auto) │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. Profile saved! ✅                 │
│    User can now save jobs           │
└─────────────────────────────────────┘
```

### Sign In Journey (Existing User)
```
┌──────────────┐
│ User Signs In│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. User verifies OTP                │
│    Status: Authenticated ✅          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 2. Extension calls getUserProfile() │
│    SELECT * FROM User               │
│    WHERE id = 550e8400...           │
│    Result: Found existing profile   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. Extension calls upsertUser()     │
│    Updates profile with latest info │
│    (in case email changed)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. Profile synced! ✅                │
│    User can continue saving jobs    │
└─────────────────────────────────────┘
```

### Sign In Journey (New User - No Profile Yet)
```
┌──────────────┐
│ User Signs In│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. User verifies OTP                │
│    (User exists in auth.users       │
│     but not in User table)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 2. Extension calls getUserProfile() │
│    Result: null (no profile found)  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. Extension calls upsertUser()     │
│    Creates new profile in User table│
│    - username from email prefix     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. Profile created! ✅               │
│    User can now save jobs           │
└─────────────────────────────────────┘
```

## 🧪 How to Test

### Test 1: New User Sign Up
```bash
1. Open extension → click popup → go to signup.html
2. Enter email: test@example.com
3. Enter username: testuser
4. Receive OTP code
5. Enter OTP code
6. ✅ Check Supabase User table:
   SELECT * FROM "User" WHERE email = 'test@example.com';
   # Should see: id, email=test@example.com, username=testuser, created_at
```

### Test 2: Existing User Sign In
```bash
1. Open extension → click popup → go to signin.html
2. Enter email: test@example.com (from Test 1)
3. Receive OTP code
4. Enter OTP code
5. ✅ Check Supabase User table:
   SELECT * FROM "User" WHERE email = 'test@example.com';
   # Should see: same profile, possibly updated timestamp
```

### Test 3: Panel Sign Up
```bash
1. Go to any job page (e.g., LinkedIn job)
2. Press Alt + X
3. Panel opens (user not signed in)
4. Click "sign up" link in panel
5. Enter username + email
6. Verify OTP
7. ✅ Check Supabase User table - profile should exist
```

## 🎯 Key Points

1. ✅ **All authentication methods create User table profiles**
   - signup.html ✅
   - signin.html ✅
   - content.js panel ✅

2. ✅ **User table ID matches auth.users ID**
   - This ensures proper relationship between auth and profile data

3. ✅ **Upsert ensures no duplicates**
   - Sign in multiple times = profile gets updated, not duplicated

4. ✅ **Works even if profile is missing**
   - Sign in will create profile if it doesn't exist

5. ✅ **Proper error handling**
   - All operations throw descriptive errors if something fails

## 🔒 Security Notes

Make sure you have Row Level Security (RLS) policies in Supabase:

```sql
-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only read their own profile
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);
```

## 📝 Summary

Your extension now properly manages user profiles in Supabase:
- ✅ Creates profiles during sign up
- ✅ Syncs profiles during sign in
- ✅ Handles missing profiles gracefully
- ✅ Works across all authentication methods
- ✅ Maintains data consistency

Every user who signs up or signs in will have a corresponding row in your `User` table with their `id`, `email`, `username`, and `created_at` timestamp! 🎉

