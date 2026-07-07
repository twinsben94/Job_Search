import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const COMPANIES_PATH = path.join(APP_DIR, "data", "companies.json");
const OUT_DIR = path.join(APP_DIR, "public", "data");
const OUT_PATH = path.join(OUT_DIR, "jobs_snapshot.json");

function normalizeWhitespace(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return base;
  }
}

function extractPeriod(text) {
  const compact = text.replace(/\s+/g, " ");
  const patterns = [
    /20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*(?:~|-|to)\s*20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}/i,
    /\d{4}\.\d{2}\.\d{2}\s*~\s*\d{4}\.\d{2}\.\d{2}/,
    /D-\d+/i,
    /상시(?:모집|채용)?/
  ];
  for (const pattern of patterns) {
    const found = compact.match(pattern);
    if (found) return found[0];
  }
  return "";
}

function extractLocation(text, fallback) {
  const terms = [
    "서울", "강남", "서초", "사당", "판교", "분당", "정자", "여의도", "송파",
    "종로", "광화문", "대전", "세종", "인천", "부산", "대구",
    "Seoul", "Pangyo", "Bundang", "Korea"
  ];
  const lowered = text.toLowerCase();
  const hits = terms.filter((term) => lowered.includes(term.toLowerCase()));
  return hits.slice(0, 3).join(", ") || fallback || "공고 확인";
}

function keywordScore(text, keywords) {
  const lowered = text.toLowerCase();
  return keywords.reduce((score, keyword) => lowered.includes(keyword.toLowerCase()) ? score + 1 : score, 0);
}

function inferStatus(text) {
  if (/마감|closed|expired/i.test(text)) return "마감 포함";
  if (/접수중|진행중|상시|open|apply|recruiting|D-\d+/i.test(text)) return "확인 필요";
  return "확인 필요";
}

function extractJobsFromHtml(company, html) {
  const jobs = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const attrs = match[1];
    const rawText = normalizeWhitespace(match[2]);
    if (!rawText || rawText.length < 3) continue;

    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch ? hrefMatch[1] : company.officialJobUrl;
    const score = keywordScore(rawText, company.keywords);
    const isRecruitingText = /채용|모집|공고|지원|career|job|role|scientist|engineer|consultant|data|ai|esg|risk|analytics/i.test(rawText);

    if (score === 0 && !isRecruitingText) continue;
    if (/로그인|회원가입|개인정보|FAQ|facebook|instagram|youtube|linkedin|블로그/i.test(rawText)) continue;

    const context = html.slice(Math.max(0, match.index - 250), Math.min(html.length, anchorPattern.lastIndex + 350));
    const contextText = normalizeWhitespace(context);

    jobs.push({
      title: rawText.slice(0, 160),
      url: absoluteUrl(company.officialJobUrl, href),
      period: extractPeriod(contextText),
      location: extractLocation(contextText, company.locationHint),
      status: inferStatus(contextText),
      relevance: Math.min(100, 45 + score * 12 + Math.round(company.fitScore / 10)),
      source: "official"
    });
  }

  const unique = [];
  const seen = new Set();
  for (const job of jobs) {
    const key = `${job.title}|${job.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }

  return unique
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);
}

async function fetchCompanyJobs(company) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(company.officialJobUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 CareerJobTracker/1.0 (+github-pages-refresh)",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    clearTimeout(timeout);

    const html = await response.text();
    const jobs = extractJobsFromHtml(company, html);
    return {
      id: company.folder,
      name: company.name,
      officialJobUrl: company.officialJobUrl,
      ok: response.ok,
      statusCode: response.status,
      fetchedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      extractionNote: jobs.length
        ? `${jobs.length}개 후보를 공식 페이지에서 감지했습니다.`
        : "자동 추출 가능한 공고가 없거나 JavaScript 렌더링 사이트입니다.",
      jobs
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      id: company.folder,
      name: company.name,
      officialJobUrl: company.officialJobUrl,
      ok: false,
      statusCode: 0,
      fetchedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      extractionNote: `자동 조회 실패: ${error.name === "AbortError" ? "시간 초과" : error.message}`,
      jobs: []
    };
  }
}

async function main() {
  const companies = JSON.parse(await readFile(COMPANIES_PATH, "utf8"));
  const results = [];
  const concurrency = 5;
  let next = 0;

  async function worker() {
    while (next < companies.length) {
      const company = companies[next++];
      results.push(await fetchCompanyJobs(company));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const payload = {
    generatedAt: new Date().toISOString(),
    mode: "github-pages-snapshot",
    results: results.sort((a, b) => {
      const ca = companies.find((company) => company.folder === a.id);
      const cb = companies.find((company) => company.folder === b.id);
      return (ca?.rank || 999) - (cb?.rank || 999);
    })
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT_PATH}`);
}

await main();
