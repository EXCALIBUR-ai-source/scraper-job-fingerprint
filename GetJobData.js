/**
 * GetJobData.js
 * Extracts job information (company name and job title) from job posting pages
 * Supports: LinkedIn, Indeed, Glassdoor, Monster, Greenhouse, Lever, and more
 */

function getJobData() {
  const url = location.href;
  const hostname = location.hostname;
  
  console.log('[GetJobData] Extracting from:', url);
  
  // Try site-specific extractors first
  let jobData = null;
  
  if (hostname.includes('linkedin.com')) {
    jobData = extractLinkedInJobData();
  } else if (hostname.includes('indeed.com')) {
    jobData = extractIndeedJobData();
  } else if (hostname.includes('glassdoor.com')) {
    jobData = extractGlassdoorJobData();
  } else if (hostname.includes('monster.com')) {
    jobData = extractMonsterJobData();
  } else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
    jobData = extractGreenhouseJobData();
  } else if (hostname.includes('ashbyhq.com')) {
    jobData = extractAshbyJobData();
  } else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
    jobData = extractLeverJobData();
  } else if (hostname.includes('workday.com')) {
    jobData = extractWorkdayJobData();
  } else if (hostname.includes('smartrecruiters.com')) {
    jobData = extractSmartRecruitersJobData();
  } else if (hostname.includes('myworkdayjobs.com')) {
    jobData = extractMyWorkdayJobData();
  }
  
  // If site-specific extraction worked, return it
  if (jobData && jobData.job_title && jobData.company) {
    console.log('[GetJobData] Site-specific extraction successful:', jobData);
    return jobData;
  }
  
  // Fallback to generic extraction
  jobData = extractGenericJobData();
  console.log('[GetJobData] Generic extraction result:', jobData);
  
  return jobData;
}

// ============================================================
// SITE-SPECIFIC EXTRACTORS
// ============================================================

function extractLinkedInJobData() {
  const job_title = getTextContent([
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title',
    '.topcard__title',
    'h2.topcard__title'
  ]);
  
  const company = getTextContent([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.topcard__org-name-link',
    '.topcard__flavor--black-link',
    'a.topcard__org-name-link'
  ]);
  
  return {
    job_title: job_title || '(LinkedIn Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractIndeedJobData() {
  const job_title = getTextContent([
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title',
    'h1[class*="jobTitle"]',
    '.icl-u-xs-mb--xs'
  ]);
  
  const company = getTextContent([
    '[data-testid="inlineHeader-companyName"]',
    '[data-company-name="true"]',
    '.jobsearch-InlineCompanyRating-companyHeader',
    '.icl-u-lg-mr--sm.icl-u-xs-mr--xs',
    'div[data-company-name]'
  ]);
  
  return {
    job_title: job_title || '(Indeed Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractGlassdoorJobData() {
  const job_title = getTextContent([
    '[data-test="job-title"]',
    '.e1tk4kwz4',
    'h1[data-test="jobTitle"]',
    '.css-1j389vi.e1tk4kwz5'
  ]);
  
  const company = getTextContent([
    '[data-test="employerName"]',
    '.e1tk4kwz1',
    'div[data-test="employerName"]'
  ]);
  
  return {
    job_title: job_title || '(Glassdoor Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractMonsterJobData() {
  const job_title = getTextContent([
    '[data-testid="svx-job-header-title"]',
    'h1.job-header-title',
    '.job-title'
  ]);
  
  const company = getTextContent([
    '[data-testid="svx-job-header-company-name"]',
    '.company-name',
    'span.company'
  ]);
  
  return {
    job_title: job_title || '(Monster Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractGreenhouseJobData() {
  // Greenhouse pages vary by host (boards.greenhouse.io, <company>.jobs.greenhouse.io)
  // Try a wide range of selectors and meta fallbacks.
  const job_title = getTextContent([
    '.app-title',
    'h1.app-title',
    '[data-qa="job-title"]',
    '.job-title',
    '.posting-title',
    '.posting-headline h1',
    '.opening h1',
    'h1.posting-title',
    'h1[data-qa="PostingTitle"]',
    'meta[property="og:title"]',
    'meta[name="title"]'
  ], true) || null;

  // Company name: prefer explicit elements, then meta tag, then hostname-derived fallback
  let company = getTextContent([
    '#header .company-name',
    '.company-name',
    '#company_name',
    '.posting-company',
    '.company',
    '.org-name',
    'meta[property="og:site_name"]',
    'meta[name="application-name"]'
  ], true) || null;

  // If still missing, try to parse from document.title (e.g. "Job Title at Company - ...")
  if (!company && document.title) {
    const titleParts = document.title.split(' - ');
    if (titleParts.length > 1) {
      // Usually "Job Title at Company" or "Job Title - Company"
      const possible = titleParts[titleParts.length - 1].trim();
      if (possible && possible.length > 1) company = cleanText(possible);
    }

    if (!company) {
      const atMatch = document.title.match(/\bat\s+(.+?)(\s*[\-|\|]|$)/i);
      if (atMatch) company = cleanText(atMatch[1]);
    }
  }

  // Hostname-derived fallback: company.jobs.greenhouse.io -> company
  if (!company && location.hostname && location.hostname.includes('greenhouse.io')) {
    const host = location.hostname.toLowerCase();
    // Examples: company.jobs.greenhouse.io  or company.greenhouse.io
    const m = host.match(/^([a-z0-9-]+)\.jobs\.greenhouse\.io$/i) || host.match(/^([a-z0-9-]+)\.greenhouse\.io$/i);
    if (m && m[1]) {
      company = m[1].replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return {
    job_title: job_title || '(Greenhouse Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractLeverJobData() {
  const job_title = getTextContent([
    '.posting-headline h2',
    'h2.posting-headline',
    '[data-qa="posting-name"]',
    '.posting-title'
  ]);
  
  // Try common selectors and meta tags first
  let company = getTextContent([
    '.posting-cmp-name',
    '.posting-company',
    '.company-name',
    '.main-header-text-logo',
    '.main-header-logo',
    'a.company',
    'meta[property="og:site_name"]',
    'meta[name="application-name"]'
  ], true) || null;

  // If company accidentally equals the job title (some pages use similar elements), ignore it
  if (company && job_title && cleanText(company).toLowerCase() === cleanText(job_title).toLowerCase()) {
    company = null;
  }

  // Try JSON-LD structured data for hiringOrganization
  if (!company) {
    try {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const s of scripts) {
        try {
          const data = JSON.parse(s.textContent || s.innerText || '{}');
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (!item) continue;
              let org = null;
              if (item.hiringOrganization) {
                if (typeof item.hiringOrganization === 'string') org = item.hiringOrganization;
                else if (item.hiringOrganization.name) org = item.hiringOrganization.name;
                else if (item.hiringOrganization['@value']) org = item.hiringOrganization['@value'];
                else if (item.hiringOrganization.name && typeof item.hiringOrganization.name === 'object' && item.hiringOrganization.name['@value']) org = item.hiringOrganization.name['@value'];
              }
              if (!org && item.publisher) {
                if (typeof item.publisher === 'string') org = item.publisher;
                else if (item.publisher.name) org = item.publisher.name;
              }
              if (!org && item.organization) {
                if (typeof item.organization === 'string') org = item.organization;
                else if (item.organization.name) org = item.organization.name;
              }
            if (org) {
              const name = (typeof org === 'string') ? org : (org.name || org['@id'] || org['@value'] || null);
              if (name) { company = cleanText(String(name)); break; }
            }
            // Some JobPosting objects use jobLocation or hiringOrganization.name
            if (item.hiringOrganization && item.hiringOrganization.name) {
              company = cleanText(String(item.hiringOrganization.name));
              break;
            }
          }
        } catch (err) {
          // ignore JSON parse errors
        }
        if (company) break;
      }
    } catch (e) { /* ignore */ }
  }

  // Try document.title heuristics like "Title at Company" or trailing site name
  if (!company && document.title) {
    const titleParts = document.title.split(' - ').map(s => s.trim());
    // If last part looks like a company/site name, use it
    if (titleParts.length > 1) {
      const possible = titleParts[titleParts.length - 1];
      if (possible && !/jobposting|job/i.test(possible)) company = cleanText(possible);
    }
    if (!company) {
      const atMatch = document.title.match(/\bat\s+(.+?)(\s*[\-|\||–]|$)/i);
      if (atMatch) company = cleanText(atMatch[1]);
    }
  }

  // Fallback: derive company from the path for URLs like /{company}/{job-id}
  if (!company && location.pathname) {
    const segs = location.pathname.split('/').filter(Boolean);
    if (segs.length > 0) {
      const first = segs[0];
      // ignore generic segments
      if (first && !/jobs?|job|career|careers|position|openings?/i.test(first)) {
        // Try to split common suffixes (e.g., mcaconnect -> MCA Connect)
        const slug = first.toLowerCase();
        const commonSuffixes = ['connect','solutions','systems','technologies','technology','inc','corp','llc','labs','group','partners'];
        let matched = false;
        for (const sfx of commonSuffixes) {
          if (slug.endsWith(sfx) && slug.length > sfx.length + 1) {
            const prefix = slug.slice(0, slug.length - sfx.length);
            const a = (prefix.length <= 4 ? prefix.toUpperCase() : prefix.replace(/(^|\s)\S/g, l => l.toUpperCase()));
            const b = sfx.replace(/(^|\s)\S/g, l => l.toUpperCase());
            company = `${a} ${b}`;
            matched = true;
            break;
          }
        }
        if (!matched) {
          company = first.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    }
  }
  
  return {
    job_title: job_title || '(Lever Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractWorkdayJobData() {
  const job_title = getTextContent([
    '[data-automation-id="jobPostingHeader"]',
    'h1[data-automation-id="jobPostingTitle"]',
    '.jobPostingHeader',
    'h1.title'
  ]);
  
  const company = getTextContent([
    '[data-automation-id="companyName"]',
    'span.company-name'
  ]);
  
  return {
    job_title: job_title || '(Workday Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractSmartRecruitersJobData() {
  // Prefer JSON-LD or meta tags for accuracy, then targeted DOM selectors, then URL/document heuristics
  let job_title = null;
  let company = null;

  // 1) JSON-LD structured data (JobPosting / Organization)
  try {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent || s.innerText || '{}');
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item) continue;
          // Job title
          const jt = item.jobTitle || item.title || item.name || null;
          if (jt && !job_title) job_title = cleanText(String(jt));

          // hiringOrganization / publisher / organization
          if (!company) {
            const org = item.hiringOrganization || item.publisher || item.organization || null;
            if (org) {
              if (typeof org === 'string') company = cleanText(org);
              else if (org.name) company = cleanText(String(org.name));
            }
          }
        }
      } catch (err) {
        // ignore parse errors
      }
      if (job_title && company) break;
    }
  } catch (e) {}

  // 2) Meta tags (og:title and site_name)
  if (!job_title) job_title = getTextContent(['meta[property="og:title"]','meta[name="title"]'], true) || null;
  if (!company) company = getTextContent(['meta[property="og:site_name"]','meta[name="application-name"]'], true) || null;

  // 3) Targeted DOM selectors (prefer headings/structured containers)
  if (!job_title) {
    // Prefer actual heading elements and avoid picking up UI buttons like "Easy apply"
    const jtSelectors = [
      'h1.job-title',
      'h1[class*="job"]',
      '.job-board__job-title',
      '.sr-page-title',
      '.sr-JobTitle',
      'h1[itemprop="title"]',
      '[data-test="job-title"]',
      // SmartRecruiters topbar variant
      '[data-test="topbar-job-title"]',
      '.topbar-job-details [data-test="topbar-job-title"]',
    ];
    const nodes = Array.from(document.querySelectorAll(jtSelectors.join(',')));
    // First prefer true heading elements or elements that are contained in headings
    for (const el of nodes) {
      const text = (el.textContent || '').trim();
      if (!text) continue;
      if (/apply now|easy apply|apply/i.test(text) && text.length < 20) continue;
      const isHeading = /^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading' || el.closest('h1,h2,h3');
      if (isHeading) { job_title = cleanText(text); break; }
    }
    // Otherwise accept the first non-button-like match
    if (!job_title) {
      for (const el of nodes) {
        const text = (el.textContent || '').trim();
        if (!text) continue;
        if (/apply now|easy apply|apply/i.test(text) && text.length < 20) continue;
        job_title = cleanText(text);
        break;
      }
    }
  }

  if (!company) {
    company = getTextContent([
      '.company-name',
      '[data-test="company-name"]',
      '.posting-company',
      '.posting-cmp-name',
      '.companyHeader__companyName',
      'a.company',
    ]) || null;
  }

  // Special case: SmartRecruiters topbar uses an <img class="brand-logo" alt="Company Logo">.
  // Use the alt text (minus trailing "Logo") as a reliable company name when present.
  if (!company) {
    try {
      const logoEl = document.querySelector('img.brand-logo, img[data-test="topbar-logo"]');
      if (logoEl && logoEl.alt) {
        let alt = String(logoEl.alt).trim();
        // Remove trailing 'Logo' or 'logo' (and optional surrounding whitespace)
        alt = alt.replace(/\s+logo\s*$/i, '').trim();
        if (alt.length > 0) company = cleanText(alt);
      }
    } catch (e) { /* ignore */ }
  }

  // 4) If selectors picked up UI buttons like 'Easy apply', avoid obvious false positives
  if (job_title && /easy apply|apply now|easy-apply/i.test(job_title)) job_title = null;

  // 5) Fallback: derive company from URL path (/company/WesternDigital/...)
  if (!company) {
    const m = location.href.match(/\/company\/([^\/\?]+)/i);
    if (m && m[1]) {
      let slug = decodeURIComponent(m[1]);
      slug = slug.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      company = slug.replace(/\b\w/g, c => c.toUpperCase()).trim();
    }
  }

  // 6) Last resort: document.title heuristics
  if (!job_title) {
    let dt = (document.title || '').trim();
    // Remove site suffix
    dt = dt.replace(/\s*[\|\-–]\s*SmartRecruiters/i, '').trim();
    job_title = dt.split('|')[0].split(' - ')[0].split(' at ')[0].trim() || null;
  }

  if (!company && document.title) {
    const parts = document.title.split('|').map(s => s.trim());
    if (parts.length > 1) company = cleanText(parts[1]);
    const atMatch = document.title.match(/\bat\s+(.+?)(\s*[\-|\||–]|$)/i);
    if (!company && atMatch) company = cleanText(atMatch[1]);
  }

  return {
    job_title: job_title || '(SmartRecruiters Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractAshbyJobData() {
  // Ashby-hosted job postings vary; prefer explicit elements, then meta tags, then document.title
  const job_title = getTextContent([
    'h1.job-title',
    'h1[data-qa="job-title"]',
    '.job-title',
    '.posting-title',
    '.position-title',
    '.opening h1',
    'meta[property="og:title"]',
    'meta[name="title"]'
  ], true) || null;

  let company = getTextContent([
    '.company-name',
    '.company',
    '.employer',
    '.org-name',
    '[data-qa="company-name"]',
    'meta[property="og:site_name"]',
    'meta[name="application-name"]'
  ], true) || null;

  // Fallback to document.title patterns like "Title at Company" or "Title - Company"
  if (!company && document.title) {
    const titleParts = document.title.split(' - ');
    if (titleParts.length > 1) {
      const possible = titleParts[titleParts.length - 1].trim();
      if (possible && possible.length > 1) company = cleanText(possible);
    }

    if (!company) {
      const atMatch = document.title.match(/\bat\s+(.+?)(\s*[\-|\|]|$)/i);
      if (atMatch) company = cleanText(atMatch[1]);
    }
  }

  // As a last resort, try to infer from hostname if it's a company-specific Ashby subdomain
  if (!company && location.hostname && location.hostname.includes('ashbyhq.com')) {
    const host = location.hostname.toLowerCase();
    // e.g., company.ashbyhq.com or company.jobs.ashbyhq.com
    const m = host.match(/^([a-z0-9-]+)\./i) || host.match(/^([a-z0-9-]+)\.jobs\./i);
    if (m && m[1]) {
      company = m[1].replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return {
    job_title: job_title || '(Ashby Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

function extractMyWorkdayJobData() {
  const job_title = getTextContent([
    '[data-automation-id="jobPostingHeader"]',
    'h2[title]',
    '.css-12tfbe1'
  ]);
  
  // Company name is usually in the domain
  const company = location.hostname.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    job_title: job_title || '(Workday Job)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

// ============================================================
// GENERIC EXTRACTOR (Fallback)
// ============================================================

function extractGenericJobData() {
  // Generic job title selectors
  const titleSelectors = [
    'h1[data-testid*="job"]',
    'h1[data-testid*="title"]',
    'h1[class*="job"]',
    'h1[class*="title"]',
    'h1[id*="job"]',
    'h1[id*="title"]',
    '[data-automation="job-detail-title"]',
    '[data-qa="job-title"]',
    'meta[property="og:title"]',
    'meta[name="title"]',
    'h1',
    'h2.title',
    '.job-title',
    '.position-title'
  ];
  
  let job_title = getTextContent(titleSelectors, true);
  
  // Fallback to document title
  if (!job_title) {
    job_title = (document.title || '')
      .split(' - ')[0]
      .split('|')[0]
      .split(' at ')[0]
      .trim();
  }
  
  // Generic company selectors
  const companySelectors = [
    '[data-testid*="company"]',
    '[data-automation*="company"]',
    '[data-qa="company-name"]',
    '[class*="company-name"]',
    '[class*="companyName"]',
    'a[href*="company"]',
    'span[class*="company"]',
    'div[class*="company"]',
    '.employer-name',
    '.company',
    'meta[property="og:site_name"]'
  ];
  
  let company = getTextContent(companySelectors, true);
  
  // Fallback to document title
  if (!company) {
    const titleParts = document.title.split(' - ');
    if (titleParts.length > 1) {
      company = titleParts[titleParts.length - 1].trim();
    }
    
    // Or try to get from " at CompanyName" pattern
    const atMatch = document.title.match(/\s+at\s+(.+?)(\s*[-|]|$)/i);
    if (atMatch) {
      company = atMatch[1].trim();
    }
  }
  
  // Clean up job title (remove overly long text)
  if (job_title && job_title.length > 200) {
    job_title = job_title.slice(0, 200) + '...';
  }
  
  // Clean up company name
  if (company && company.length > 100) {
    company = company.slice(0, 100) + '...';
  }
  
  return {
    job_title: job_title || '(Unknown Title)',
    company: company || '(Unknown Company)',
    position_url: location.href
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get text content from the first matching selector
 * @param {Array<string>} selectors - Array of CSS selectors to try
 * @param {boolean} includeMeta - Whether to check meta tags
 * @returns {string|null} - Extracted text or null
 */
function getTextContent(selectors, includeMeta = false) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let text = '';
      
      // Handle meta tags
      if (element.tagName === 'META') {
        text = element.getAttribute('content') || '';
      } else {
        // Get text content, excluding script/style elements
        text = element.textContent || element.innerText || '';
      }
      
      text = text.trim();
      
      // Skip if empty or too short
      if (text && text.length > 1) {
        return cleanText(text);
      }
    }
  }
  
  return null;
}

/**
 * Clean extracted text
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, ' ')  // Replace newlines with space
    .replace(/\t+/g, ' ')  // Replace tabs with space
    .trim();
}

/**
 * Wait for element to appear (useful for SPAs)
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element|null>}
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// ============================================================
// EXPORT
// ============================================================

// For use in content scripts
if (typeof window !== 'undefined') {
  window.getJobData = getJobData;
}

// For use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getJobData };
}

