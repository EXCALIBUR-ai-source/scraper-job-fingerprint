# Alt+X Keyboard Shortcut Implementation

## Summary

Successfully implemented **Alt+X** keyboard shortcut to save job applications to Supabase with full UUID support.

## What Changed

### 1. Updated `config.js` - `savePositionApplied()` Function

**Before:**
```javascript
async function savePositionApplied({ company, job_title, position_url, user_id }, accessToken) {
  const res = await supabase.from('positionApplied').upsert({ company, job_title, position_url, user_id }, { onConflict: 'id' });
  return res?.data || null || undefined;
}
```

**After:**
```javascript
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
```

**Changes:**
- ✅ Added `uuid` parameter
- ✅ Changed from `upsert()` to `insert()` for cleaner inserts
- ✅ Now saves the `UUID` field (job position ID)
- ✅ Better error handling with try-catch
- ✅ Console logging for debugging

### 2. Updated `content.js` - `saveCurrentJob()` Function

**Changes:**
- ✅ Changed keyboard shortcut from **Alt+A** to **Alt+X**
- ✅ Extracts UUID from page URL using `extractUuidFromUrl()`
- ✅ Validates that UUID exists before saving
- ✅ Shows helpful error if UUID cannot be extracted
- ✅ Passes `uuid` to `savePositionApplied()`

**Code:**
```javascript
async function saveCurrentJob() {
  const user = await getUser();
  const token = await ensureAccessToken();
  
  if (!user?.id || !token) {
    // Show sign-in panel if not authenticated
    const panel = ensurePanel();
    renderPanelContent(panel, "signin");
    return;
  }

  const data = guessJobData();  // Extract company & job_title
  const uuid = extractUuidFromUrl(location.href);  // Extract job ID
  
  if (!uuid) {
    // Show error if no UUID found
    ensurePanel();
    setBookmarkText("Error");
    setHint("Could not extract job ID from URL...");
    return;
  }
  
  try {
    await savePositionApplied({ 
      ...data, 
      user_id: user.id,
      uuid: uuid  // Include the job position UUID
    }, token);
    setBookmarkText("YES");
    setHint("Saved to Supabase.");
  } catch (e) {
    ensurePanel();
    setBookmarkText("Error");
    setHint(e.message || "Failed to save.");
  }
}
```

### 3. Updated `manifest.json`

**Before:**
```json
"suggested_key": { "default": "Alt+A" }
```

**After:**
```json
"suggested_key": { "default": "Alt+X" }
```

### 4. Updated UI Messages

**Files Updated:**
- `content.js` - Panel hint text
- `dashboard.html` - Empty state hint
- `dashboard.js` - Empty state hint
- `USER_PROFILE_GUIDE.md` - Documentation

**Before:** "Press Alt + A to save this job"  
**After:** "Press Alt + X to save this job"

## Database Schema

### positionApplied Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (Primary Key) | Auto-generated row ID |
| `created_at` | TIMESTAMP | Auto-generated timestamp |
| `company` | TEXT | Company name (extracted from page) |
| `job_title` | TEXT | Job position title (extracted from page) |
| `position_url` | TEXT | Full URL of the job posting |
| `user_id` | UUID (Foreign Key) | References User table |
| `UUID` | TEXT | **Job position identifier from URL** |

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-11-09T10:30:00Z",
  "company": "Google",
  "job_title": "Senior Software Engineer",
  "position_url": "https://careers.google.com/jobs/results/123456789/",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "UUID": "123456789"
}
```

## How It Works

### 1. User Presses Alt+X on Job Page

```
┌─────────────────────┐
│ User on Job Page    │
│ Presses Alt+X       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Check Authentication            │
│ - User signed in? ✅            │
│ - Has user_id? ✅               │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Extract Job Data from Page      │
│ - company: "Google"             │
│ - job_title: "Software Eng..."  │
│ - position_url: current URL     │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Extract UUID from URL           │
│ - Looks for UUID pattern        │
│ - Or jobId query param          │
│ - Or last path segment          │
│ Result: "123456789"             │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Save to Supabase                │
│ INSERT INTO positionApplied     │
│ - All fields populated          │
│ - UUID included ✅              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Show Success Message            │
│ "Saved to Supabase."            │
└─────────────────────────────────┘
```

### 2. UUID Extraction Logic

The `extractUuidFromUrl()` function tries multiple methods:

**Method 1: UUID Pattern**
```javascript
// Matches standard UUID format
"https://example.com/jobs/550e8400-e29b-41d4-a716-446655440000"
// Extracts: "550e8400-e29b-41d4-a716-446655440000"
```

**Method 2: Query Parameters**
```javascript
// Checks for common job ID parameters
"https://example.com/jobs?jobId=123456"
"https://indeed.com/viewjob?jk=789abc"
"https://greenhouse.io/jobs?gh_jid=456def"
// Extracts: "123456", "789abc", or "456def"
```

**Method 3: Last Path Segment**
```javascript
// Uses last part of URL path
"https://example.com/careers/senior-engineer/123456789"
// Extracts: "123456789" (if length >= 8)
```

## Usage

### Basic Usage

1. Navigate to any job posting page
2. Press **Alt+X** on your keyboard
3. If not signed in, sign-in panel appears
4. If signed in, job is saved immediately
5. Success message: "Saved to Supabase."

### Requirements

- ✅ User must be signed in (has `user_id`)
- ✅ Page must be a job detail page (has identifiable UUID)
- ✅ Job data must be extractable (company name, title visible on page)

### Error Handling

**No UUID Found:**
```
Error message: "Could not extract job ID from URL. 
Make sure you're on a job detail page."
```

**Not Signed In:**
```
Action: Sign-in panel appears automatically
```

**Database Error:**
```
Error message: Shows specific error from Supabase
```

## Testing

### Test 1: Save Job with Alt+X
```bash
1. Go to a job posting page (e.g., LinkedIn job)
2. Make sure you're signed in
3. Press Alt+X
4. ✅ Check Supabase positionApplied table for new row
5. Verify all fields are populated including UUID
```

### Test 2: Check UUID Extraction
```bash
1. Open browser console (F12)
2. On job page, run:
   extractUuidFromUrl(location.href)
3. ✅ Should return job ID (not null)
```

### Test 3: Verify Data in Supabase
```sql
-- Check recent saved jobs
SELECT * FROM "positionApplied" 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if UUID field is populated
SELECT id, company, job_title, "UUID" 
FROM "positionApplied" 
WHERE "UUID" IS NOT NULL;
```

## Benefits

1. ✅ **Complete Data**: All 7 fields now saved correctly
2. ✅ **UUID Support**: Job position IDs properly captured
3. ✅ **Better UX**: Alt+X is easier to press than Alt+A
4. ✅ **Error Handling**: Clear messages when something goes wrong
5. ✅ **Debugging**: Console logs help troubleshoot issues
6. ✅ **Validation**: Checks UUID exists before saving

## Notes

- The keyboard shortcut works on ALL web pages
- UUID field is **case-sensitive** in Supabase (column name: `UUID`)
- If UUID can't be extracted, the job won't be saved (intentional)
- You can still use the browser command interface (Alt+X there too)

## Summary

The extension now properly saves job applications with:
- ✅ Company name
- ✅ Job title  
- ✅ Position URL
- ✅ User ID (links to User table)
- ✅ **UUID (job position identifier)**
- ✅ Auto-generated ID and timestamp

Press **Alt+X** on any job page to save it! 🚀

