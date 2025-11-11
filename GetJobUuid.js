/**
 * GetJobUuid.js
 * Extracts job position ID/UUID from job posting URLs
 * Supports: LinkedIn, Indeed, Glassdoor, Monster, Greenhouse, Lever, Workday, and more
 */

function getJobUuid(url) {
  const targetUrl = url || location.href;
  const hostname = location.hostname;
  
  console.log('[GetJobUuid] Extracting UUID from:', targetUrl);
  
  let uuid = null;
  
  // Try site-specific extractors first
  if (hostname.includes('linkedin.com')) {
    uuid = extractLinkedInJobId(targetUrl);
  } else if (hostname.includes('indeed.com')) {
    uuid = extractIndeedJobId(targetUrl);
  } else if (hostname.includes('glassdoor.com')) {
    uuid = extractGlassdoorJobId(targetUrl);
  } else if (hostname.includes('monster.com')) {
    uuid = extractMonsterJobId(targetUrl);
  } else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
    uuid = extractGreenhouseJobId(targetUrl);
  } else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
    uuid = extractLeverJobId(targetUrl);
  } else if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) {
    uuid = extractWorkdayJobId(targetUrl);
  } else if (hostname.includes('smartrecruiters.com')) {
    uuid = extractSmartRecruitersJobId(targetUrl);
  } else if (hostname.includes('ashbyhq.com')) {
    uuid = extractAshbyJobId(targetUrl);
  } else if (hostname.includes('breezy.hr')) {
    uuid = extractBreezyJobId(targetUrl);
  }
  
  // If site-specific extraction worked, return it
  if (uuid) {
    console.log('[GetJobUuid] Site-specific extraction successful:', uuid);
    return uuid;
  }
  
  // Fallback to generic extraction
  uuid = extractGenericJobId(targetUrl);
  console.log('[GetJobUuid] Generic extraction result:', uuid);
  
  return uuid;
}

// ============================================================
// SITE-SPECIFIC EXTRACTORS
// ============================================================

function extractLinkedInJobId(url) {
  // LinkedIn: /jobs/view/1234567890 or /jobs/collections/recommended/?currentJobId=1234567890
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];
  
  const currentJobMatch = url.match(/currentJobId=(\d+)/);
  if (currentJobMatch) return currentJobMatch[1];
  
  return null;
}

function extractIndeedJobId(url) {
  // Indeed: ?jk=abcd1234efgh5678 or /viewjob?jk=abcd1234
  const jkMatch = url.match(/[?&]jk=([a-zA-Z0-9]+)/);
  if (jkMatch) return jkMatch[1];
  
  const viewJobMatch = url.match(/\/viewjob\?.*jk=([a-zA-Z0-9]+)/);
  if (viewJobMatch) return viewJobMatch[1];
  
  return null;
}

function extractGlassdoorJobId(url) {
  // Glassdoor: /job-listing/jobListingId=1234567 or /partner/jobListing.htm?pos=123
  const listingMatch = url.match(/jobListingId=(\d+)/);
  if (listingMatch) return listingMatch[1];
  
  const posMatch = url.match(/[?&]pos=(\d+)/);
  if (posMatch) return posMatch[1];
  
  return null;
}

function extractMonsterJobId(url) {
  // Monster: /job-openings/jobId--12345678 or ?id=abcd1234
  const jobIdMatch = url.match(/jobId--([a-zA-Z0-9-]+)/);
  if (jobIdMatch) return jobIdMatch[1];
  
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9-]+)/);
  if (idMatch) return idMatch[1];
  
  return null;
}

function extractGreenhouseJobId(url) {
  // Greenhouse: /jobs/1234567890 or /jobs/1234567890?gh_jid=1234567890
  const ghJidMatch = url.match(/[?&]gh_jid=(\d+)/);
  if (ghJidMatch) return ghJidMatch[1];
  
  const jobsMatch = url.match(/\/jobs\/(\d+)/);
  if (jobsMatch) return jobsMatch[1];
  
  return null;
}

function extractLeverJobId(url) {
  // Lever: /jobs/550e8400-e29b-41d4-a716-446655440000 or similar UUID
  const uuidMatch = url.match(/\/jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  
  // Or slug-based: /jobs/senior-engineer-frontend
  const slugMatch = url.match(/\/jobs\/([a-zA-Z0-9-]+)/);
  if (slugMatch) return slugMatch[1];
  
  return null;
}

function extractWorkdayJobId(url) {
  // First try to match the full pattern with job title:
  // e.g., "Senior-Quality-Improvement-Professional_R-394417"
  const fullTitleMatch = url.match(/[/]([A-Za-z0-9-]+_R-\d+(?:-\d+)*)/);
  if (fullTitleMatch) return fullTitleMatch[1];

  // Classic Workday: /job/Location-Job-Title/JR12345 or similar
  const jrMatch = url.match(/\/(JR\d+)/);
  if (jrMatch) return jrMatch[1];
  
  // Or: ?jobId=JR12345
  const jobIdMatch = url.match(/[?&]jobId=([a-zA-Z0-9-]+)/);
  if (jobIdMatch) return jobIdMatch[1];
  
  // Fallback: Look for just the R-number if we can't get the full title
  const workdayRMatch = url.match(/(?:[_\b])(R-\d+(?:-\d+)*)(?:[\/\?]|$)/i);
  if (workdayRMatch) return workdayRMatch[1];

  // Last resort: extract last path segment (allow letters, numbers, hyphen, underscore)
  const pathMatch = url.match(/\/job\/[^/]+\/([A-Za-z0-9_\-]+)/);
  if (pathMatch) return pathMatch[1];
  
  return null;
}

function extractSmartRecruitersJobId(url) {
  // SmartRecruiters: /jobs/1234567890 or similar
  const jobIdMatch = url.match(/\/jobs\/(\d+)/);
  if (jobIdMatch) return jobIdMatch[1];
  
  return null;
}

function extractAshbyJobId(url) {
  // Ashby: /jobs/550e8400-e29b-41d4-a716-446655440000
  const uuidMatch = url.match(/\/jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  
  return null;
}

function extractBreezyJobId(url) {
  // Breezy: /p/abcd1234efgh5678 or similar
  const pMatch = url.match(/\/p\/([a-zA-Z0-9]+)/);
  if (pMatch) return pMatch[1];
  
  return null;
}

// ============================================================
// GENERIC EXTRACTOR (Fallback)
// ============================================================

function extractGenericJobId(url) {
  const urlObj = new URL(url);
  
  // Strategy 1: Look for standard UUID pattern in URL
  const standardUuidMatch = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (standardUuidMatch) {
    return standardUuidMatch[0];
  }
  
  // Strategy 2: Common query parameters
  const commonParams = [
    'jobId', 'job_id', 'id',
    'jk', 'gh_jid', 'job',
    'position', 'positionId', 'position_id',
    'req', 'requisition', 'requisitionId',
    'posting', 'postingId', 'posting_id'
  ];
  
  for (const param of commonParams) {
    const value = urlObj.searchParams.get(param);
    if (value && value.length >= 6) {
      return value;
    }
  }
  
  // Strategy 3: Extract job ID patterns from path
  // Pattern: /jobs/123456 or /job/123456 or /positions/123456
  const jobPathMatch = url.match(/\/(jobs?|positions?|openings?|careers?)\/([a-zA-Z0-9_-]{6,})/i);
  if (jobPathMatch) {
    return jobPathMatch[2];
  }
  
  // Strategy 4: Look for ID-like patterns in path
  // e.g., /JR12345, /REQ-12345, /POS-12345
  const idPatternMatch = url.match(/\/(JR|REQ|POS|JOB)[-_]?([A-Z0-9]{5,})/i);
  if (idPatternMatch) {
    return idPatternMatch[0].substring(1); // Remove leading slash
  }
  
  // Strategy 5: Try to get last meaningful path segment
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Only use if it looks like an ID (has numbers or is long enough)
    if (lastSegment.length >= 8 && (/\d/.test(lastSegment) || lastSegment.length >= 20)) {
      return lastSegment;
    }
  }
  
  // Strategy 6: Look for any numeric sequence of 6+ digits
  const numericMatch = url.match(/\b(\d{6,})\b/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  // Strategy 7: Look for alphanumeric codes (e.g., abc123def456)
  const alphanumericMatch = url.match(/\b([a-zA-Z0-9]{10,})\b/);
  if (alphanumericMatch) {
    // Make sure it has both letters and numbers
    const code = alphanumericMatch[1];
    if (/[a-zA-Z]/.test(code) && /\d/.test(code)) {
      return code;
    }
  }
  
  console.warn('[GetJobUuid] Could not extract job UUID from URL');
  return null;
}

// ============================================================
// VALIDATION & UTILITY FUNCTIONS
// ============================================================

/**
 * Validate if the extracted UUID looks reasonable
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
function isValidJobUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // Too short
  if (uuid.length < 5) return false;
  
  // Too long (probably not a job ID)
  if (uuid.length > 100) return false;
  
  // Check if it's not just a common path segment
  const commonInvalidSegments = [
    'index', 'home', 'search', 'results', 'list',
    'view', 'detail', 'details', 'page'
  ];
  
  if (commonInvalidSegments.includes(uuid.toLowerCase())) {
    return false;
  }
  
  return true;
}

/**
 * Get job UUID with validation
 * @param {string} url - URL to extract from
 * @returns {string|null} - Valid UUID or null
 */
function getValidatedJobUuid(url) {
  const uuid = getJobUuid(url);
  
  if (uuid && isValidJobUuid(uuid)) {
    return uuid;
  }
  
  return null;
}

// ============================================================
// EXPORT
// ============================================================

// For use in content scripts
if (typeof window !== 'undefined') {
  window.getJobUuid = getJobUuid;
  window.getValidatedJobUuid = getValidatedJobUuid;
  window.isValidJobUuid = isValidJobUuid;
}

// For use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    getJobUuid,
    getValidatedJobUuid,
    isValidJobUuid
  };
}

