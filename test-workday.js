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
}

// Test URLs
const url1 = 'https://humana.wd5.myworkdayjobs.com/en-US/humana_external_career_site/job/Senior-Quality-Improvement-Professional_R-394417';
const url2 = 'https://humana.wd5.myworkdayjobs.com/en-US/humana_external_career_site/job/Remote-Kentucky/Senior-Quality-Improvement-Professional_R-394417/apply';

console.log('URL 1:', extractWorkdayJobId(url1));
console.log('URL 2:', extractWorkdayJobId(url2));