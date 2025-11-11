# Job Data Extraction Guide

## Overview

The extension now uses two dedicated JavaScript files for extracting job information from job posting pages:

1. **`GetJobData.js`** - Extracts job title and company name
2. **`GetJobUuid.js`** - Extracts job position ID/UUID from URLs

These files support multiple job platforms with site-specific extractors and generic fallbacks.

## Supported Platforms

### Fully Supported Sites

| Platform | Job Title | Company Name | UUID/ID |
|----------|-----------|--------------|---------|
| LinkedIn | ✅ | ✅ | ✅ |
| Indeed | ✅ | ✅ | ✅ |
| Glassdoor | ✅ | ✅ | ✅ |
| Monster | ✅ | ✅ | ✅ |
| Greenhouse | ✅ | ✅ | ✅ |
| Lever | ✅ | ✅ | ✅ |
| Workday | ✅ | ✅ | ✅ |
| SmartRecruiters | ✅ | ✅ | ✅ |
| Ashby | ✅ | ✅ | ✅ |
| Breezy | ✅ | ✅ | ✅ |

### Fallback Support

For any other job site, the extension uses **generic extractors** that:
- Search for common HTML patterns
- Check meta tags
- Parse document titles
- Extract IDs from URLs using common patterns

## GetJobData.js

### Purpose
Extracts job title and company name from the current page.

### Usage

```javascript
// Basic usage
const jobData = getJobData();
console.log(jobData);
// Output: { 
//   job_title: "Senior Software Engineer",
//   company: "Google",
//   position_url: "https://careers.google.com/jobs/results/123456/"
// }
```

### How It Works

#### 1. Site Detection
```javascript
const hostname = location.hostname;

if (hostname.includes('linkedin.com')) {
  jobData = extractLinkedInJobData();
} else if (hostname.includes('indeed.com')) {
  jobData = extractIndeedJobData();
}
// ... etc
```

#### 2. Site-Specific Extraction

**LinkedIn Example:**
```javascript
function extractLinkedInJobData() {
  const job_title = getTextContent([
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title'
  ]);
  
  const company = getTextContent([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name'
  ]);
  
  return { job_title, company, position_url: location.href };
}
```

**Indeed Example:**
```javascript
function extractIndeedJobData() {
  const job_title = getTextContent([
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title'
  ]);
  
  const company = getTextContent([
    '[data-testid="inlineHeader-companyName"]',
    '[data-company-name="true"]'
  ]);
  
  return { job_title, company, position_url: location.href };
}
```

#### 3. Generic Fallback

If no site-specific extractor matches, uses generic selectors:

**Job Title Extraction:**
```javascript
const titleSelectors = [
  'h1[data-testid*="job"]',
  'h1[class*="title"]',
  'meta[property="og:title"]',
  'h1'
];
```

**Company Extraction:**
```javascript
const companySelectors = [
  '[data-testid*="company"]',
  '[class*="company-name"]',
  'meta[property="og:site_name"]'
];
```

### Helper Functions

#### `getTextContent(selectors, includeMeta)`
Tries multiple selectors and returns the first match.

```javascript
const text = getTextContent([
  '.primary-selector',
  '.fallback-selector',
  'h1'
], true);
```

#### `cleanText(text)`
Removes extra whitespace and newlines.

```javascript
const clean = cleanText("  Job  Title\n\n  ");
// Returns: "Job Title"
```

## GetJobUuid.js

### Purpose
Extracts job position ID/UUID from job posting URLs.

### Usage

```javascript
// Basic usage
const uuid = getJobUuid(location.href);
console.log(uuid);
// Output: "123456789" or "550e8400-e29b-41d4-a716-446655440000"

// With validation
const validUuid = getValidatedJobUuid(location.href);
if (validUuid) {
  console.log("Valid UUID:", validUuid);
}
```

### How It Works

#### 1. Site-Specific Patterns

**LinkedIn:**
```javascript
// Pattern: /jobs/view/1234567890
const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
if (viewMatch) return viewMatch[1];

// Pattern: ?currentJobId=1234567890
const currentJobMatch = url.match(/currentJobId=(\d+)/);
if (currentJobMatch) return currentJobMatch[1];
```

**Indeed:**
```javascript
// Pattern: ?jk=abcd1234efgh5678
const jkMatch = url.match(/[?&]jk=([a-zA-Z0-9]+)/);
if (jkMatch) return jkMatch[1];
```

**Greenhouse:**
```javascript
// Pattern: ?gh_jid=1234567890 or /jobs/1234567890
const ghJidMatch = url.match(/[?&]gh_jid=(\d+)/);
if (ghJidMatch) return ghJidMatch[1];
```

**Lever:**
```javascript
// Pattern: UUID in path
const uuidMatch = url.match(/\/jobs\/([0-9a-f-]{36})/i);
if (uuidMatch) return uuidMatch[1];
```

#### 2. Generic Extraction Strategies

**Strategy 1: Standard UUID Pattern**
```javascript
const uuidMatch = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
// Matches: 550e8400-e29b-41d4-a716-446655440000
```

**Strategy 2: Common Query Parameters**
```javascript
const commonParams = [
  'jobId', 'job_id', 'id',
  'jk', 'gh_jid', 'job',
  'position', 'requisition'
];
```

**Strategy 3: Path-based IDs**
```javascript
// Matches: /jobs/123456 or /positions/abc123
const jobPathMatch = url.match(/\/(jobs?|positions?)\/([a-zA-Z0-9_-]{6,})/i);
```

**Strategy 4: ID Patterns**
```javascript
// Matches: /JR12345, /REQ-12345, /POS-12345
const idPatternMatch = url.match(/\/(JR|REQ|POS|JOB)[-_]?([A-Z0-9]{5,})/i);
```

### Validation

#### `isValidJobUuid(uuid)`
Validates if extracted UUID is reasonable:

```javascript
function isValidJobUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  if (uuid.length < 5 || uuid.length > 100) return false;
  
  // Check not a common path segment
  const invalid = ['index', 'home', 'search', 'results'];
  if (invalid.includes(uuid.toLowerCase())) return false;
  
  return true;
}
```

## Integration with Extension

### In content.js

The extension uses wrapper functions for backwards compatibility:

```javascript
// Wrapper for GetJobData.js
function guessJobData() {
  return getJobData();
}

// Wrapper for GetJobUuid.js
function extractUuidFromUrl(url) {
  return getJobUuid(url);
}
```

### When Saving a Job (Alt+X)

```javascript
async function saveCurrentJob() {
  const user = await getUser();
  const token = await ensureAccessToken();
  
  // Extract job data using GetJobData.js
  const data = guessJobData();
  console.log("Job Data:", data);
  // { job_title: "...", company: "...", position_url: "..." }
  
  // Extract UUID using GetJobUuid.js
  const uuid = extractUuidFromUrl(location.href);
  console.log("Job UUID:", uuid);
  // "123456789" or UUID
  
  if (!uuid) {
    setHint("Could not extract job ID from URL...");
    return;
  }
  
  // Save to Supabase
  await savePositionApplied({ 
    ...data, 
    user_id: user.id,
    uuid: uuid
  }, token);
}
```

## Debugging

### Enable Console Logging

Both files include detailed console logging:

```javascript
console.log('[GetJobData] Extracting from:', url);
console.log('[GetJobData] Site-specific extraction successful:', jobData);

console.log('[GetJobUuid] Extracting UUID from:', url);
console.log('[GetJobUuid] Site-specific extraction successful:', uuid);
```

### Test Extraction

Open browser console (F12) and run:

```javascript
// Test job data extraction
const jobData = getJobData();
console.log("Title:", jobData.job_title);
console.log("Company:", jobData.company);

// Test UUID extraction
const uuid = getJobUuid(location.href);
console.log("UUID:", uuid);

// Test with validation
const validUuid = getValidatedJobUuid(location.href);
console.log("Valid UUID:", validUuid);
```

## Adding Support for New Sites

### 1. Add Site-Specific Extractor

**In GetJobData.js:**

```javascript
function extractNewSiteJobData() {
  const job_title = getTextContent([
    '.new-site-title-selector',
    'h1.title'
  ]);
  
  const company = getTextContent([
    '.new-site-company-selector',
    '.company'
  ]);
  
  return {
    job_title: job_title || '(NewSite Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}
```

**Then add to main function:**

```javascript
if (hostname.includes('newsite.com')) {
  jobData = extractNewSiteJobData();
}
```

### 2. Add UUID Pattern

**In GetJobUuid.js:**

```javascript
function extractNewSiteJobId(url) {
  // Add site-specific pattern
  const match = url.match(/pattern-here/);
  if (match) return match[1];
  return null;
}
```

**Then add to main function:**

```javascript
if (hostname.includes('newsite.com')) {
  uuid = extractNewSiteJobId(targetUrl);
}
```

## Example Output

### LinkedIn Job

**URL:** `https://www.linkedin.com/jobs/view/1234567890`

```javascript
getJobData()
// {
//   job_title: "Senior Software Engineer - Full Stack",
//   company: "Google",
//   position_url: "https://www.linkedin.com/jobs/view/1234567890"
// }

getJobUuid(location.href)
// "1234567890"
```

### Indeed Job

**URL:** `https://www.indeed.com/viewjob?jk=abc123def456`

```javascript
getJobData()
// {
//   job_title: "Backend Developer",
//   company: "Microsoft",
//   position_url: "https://www.indeed.com/viewjob?jk=abc123def456"
// }

getJobUuid(location.href)
// "abc123def456"
```

### Greenhouse Job

**URL:** `https://boards.greenhouse.io/company/jobs/123456?gh_jid=123456`

```javascript
getJobData()
// {
//   job_title: "Product Manager",
//   company: "Airbnb",
//   position_url: "https://boards.greenhouse.io/company/jobs/123456?gh_jid=123456"
// }

getJobUuid(location.href)
// "123456"
```

## Benefits

1. ✅ **Modular Code** - Separated extraction logic from content script
2. ✅ **Site-Specific Support** - Optimized for popular job boards
3. ✅ **Robust Fallbacks** - Generic extractors for unknown sites
4. ✅ **Easy Maintenance** - Add new sites without touching content.js
5. ✅ **Better Debugging** - Console logs help troubleshoot extraction
6. ✅ **Validation** - UUID validation prevents bad data
7. ✅ **Extensible** - Easy to add new platforms

## Troubleshooting

### Job Title/Company Not Extracted

1. Open browser console (F12)
2. Check console logs for extraction attempts
3. Inspect the page HTML to find correct selectors
4. Add site-specific extractor or update generic selectors

### UUID Not Extracted

1. Check the URL pattern in browser console
2. Look for job ID in query parameters or path
3. Add site-specific UUID pattern
4. Verify URL contains identifiable job ID

### Data Extraction Fails

1. Check if page is loaded (wait for elements)
2. Verify selectors match current HTML structure
3. Check if site changed their HTML structure
4. Update selectors accordingly

## Summary

The new extraction system provides:
- 🎯 **Accurate** data extraction from 10+ job platforms
- 🔧 **Maintainable** code with separated concerns
- 🚀 **Extensible** architecture for adding new sites
- 🐛 **Debuggable** with detailed console logging
- ✅ **Reliable** with multiple fallback strategies

Your extension now extracts job data more reliably across many different job platforms! 🎉

