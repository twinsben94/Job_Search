const state = {
  companies: [],
  jobResults: new Map(),
  priority: "all",
  query: "",
  loading: true
};

const sectionNav = document.querySelector("#sectionNav");
const companyList = document.querySelector("#companyList");
const refreshButton = document.querySelector("#refreshButton");
const searchInput = document.querySelector("#searchInput");
const companyCount = document.querySelector("#companyCount");
const jobCount = document.querySelector("#jobCount");
const focusCount = document.querySelector("#focusCount");
const updatedAt = document.querySelector("#updatedAt");

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "-";
  }
}

function priorityClass(priority) {
  if (priority === "1차 집중") return "priority-focus";
  if (priority === "2차 집중") return "priority-second";
  return "priority-watch";
}

function sectionMeta(companies) {
  const map = new Map();
  companies.forEach((company) => {
    if (!map.has(company.section)) {
      map.set(company.section, {
        section: company.section,
        label: company.sectionLabel,
        count: 0
      });
    }
    map.get(company.section).count += 1;
  });
  return [...map.values()];
}

function renderNav() {
  sectionNav.innerHTML = sectionMeta(state.companies).map((section) => `
    <a class="section-link" href="#${escapeHtml(section.section)}">
      <strong>${escapeHtml(section.section)}</strong>
      <span>${escapeHtml(section.label)}</span>
      <em>${section.count}개 기업</em>
    </a>
  `).join("");
}

function getFilteredCompanies() {
  const q = state.query.trim().toLowerCase();
  return state.companies.filter((company) => {
    const priorityOk = state.priority === "all" || company.priority === state.priority;
    const haystack = [
      company.name,
      company.section,
      company.sectionLabel,
      company.fitSummary,
      company.locationHint,
      company.priority,
      ...company.targetRoles,
      ...company.keywords
    ].join(" ").toLowerCase();
    return priorityOk && (!q || haystack.includes(q));
  });
}

function renderMetrics(latestIso) {
  const jobs = [...state.jobResults.values()].flatMap((result) => result.jobs || []);
  companyCount.textContent = state.companies.length.toString();
  jobCount.textContent = jobs.length.toString();
  focusCount.textContent = state.companies.filter((company) => company.priority === "1차 집중").length.toString();
  updatedAt.textContent = latestIso ? formatDate(latestIso) : "조회 중";
}

function sourceLine(company, result) {
  const officialUrl = result?.officialJobUrl || company.officialJobUrl;
  const host = hostname(officialUrl);
  const code = result?.statusCode ? `HTTP ${result.statusCode}` : "공식 링크";
  return `
    <div class="source-line">
      <span>참고한 공식 링크</span>
      <a href="${escapeHtml(officialUrl)}" target="_blank" rel="noreferrer">${escapeHtml(host)}</a>
      <code>${escapeHtml(code)}</code>
    </div>
  `;
}

function jobPanel(company) {
  const result = state.jobResults.get(company.folder);
  if (!result) {
    return `
      <div class="job-panel">
        <div class="loading">공식 채용 페이지를 조회하는 중입니다.</div>
        ${sourceLine(company)}
      </div>
    `;
  }

  const jobs = result.jobs || [];
  const note = result.ok
    ? result.extractionNote
    : `${result.extractionNote} 공식 링크에서 직접 다시 확인하세요.`;
  const checkedAt = result.fetchedAt ? formatDate(result.fetchedAt) : "조회 전";

  return `
    <div class="job-panel">
      <div class="job-panel-head">
        <div>
          <strong>채용공고 업데이트</strong>
          <span class="job-note">${escapeHtml(note)}</span>
        </div>
        <div class="fetch-status ${result.ok ? "is-ok" : "is-fail"}">
          <span>${result.ok ? "조회 완료" : "확인 필요"}</span>
          <small>${escapeHtml(checkedAt)}</small>
        </div>
      </div>
      ${sourceLine(company, result)}
      ${jobs.length ? `
        <div class="jobs">
          ${jobs.map((job) => `
            <article class="job-item">
              <div>
                <a class="job-title" href="${escapeHtml(job.url)}" target="_blank" rel="noreferrer">${escapeHtml(job.title)}</a>
                <div class="job-meta">
                  <span>지역: ${escapeHtml(job.location || company.locationHint)}</span>
                  <span>기간: ${escapeHtml(job.period || "공식 공고 확인")}</span>
                  <span>상태: ${escapeHtml(job.status || "확인 필요")}</span>
                  <a href="${escapeHtml(job.url)}" target="_blank" rel="noreferrer">원문 보기</a>
                </div>
              </div>
              <span class="relevance">fit ${escapeHtml(job.relevance || "-")}</span>
            </article>
          `).join("")}
        </div>
      ` : `
        <div class="empty-state">
          자동으로 추출된 공고가 없습니다. 일부 공식 사이트는 JavaScript 렌더링, 로그인, 검색 UI를 사용합니다.
          위 공식 링크에서 최신 공고와 지원 기간을 직접 확인하세요.
        </div>
      `}
    </div>
  `;
}

function companyRow(company) {
  return `
    <article class="company-row" data-company="${escapeHtml(company.name)}">
      <div class="company-profile">
        <div class="company-head">
          <div>
            <h3 class="company-name">${escapeHtml(company.name)}</h3>
            <span class="folder-path">${escapeHtml(company.folder)}</span>
          </div>
          <span class="rank-badge">#${escapeHtml(company.rank)}</span>
        </div>

        <div class="badge-row">
          <span class="priority-badge ${priorityClass(company.priority)}">${escapeHtml(company.priority)}</span>
          <span class="location-badge">${escapeHtml(company.locationHint)}</span>
        </div>

        <div class="fit-meter">
          <div class="fit-line">
            <span>직무 적합도 · ${escapeHtml(company.fitLevel)}</span>
            <strong>${escapeHtml(company.fitScore)}</strong>
          </div>
          <div class="bar"><span style="width:${escapeHtml(company.fitScore)}%"></span></div>
        </div>

        <p class="summary">${escapeHtml(company.fitSummary)}</p>
        <div class="role-list">
          ${company.targetRoles.map((role) => `<span class="role">${escapeHtml(role)}</span>`).join("")}
        </div>
        <div class="profile-actions">
          <a class="link-button" href="${escapeHtml(company.officialJobUrl)}" target="_blank" rel="noreferrer">공식 채용 사이트</a>
          <span class="source-host">${escapeHtml(hostname(company.officialJobUrl))}</span>
        </div>
      </div>
      ${jobPanel(company)}
    </article>
  `;
}

function renderCompanies() {
  const filtered = getFilteredCompanies();
  if (!filtered.length) {
    companyList.innerHTML = `<div class="empty-state">조건에 맞는 기업이 없습니다.</div>`;
    return;
  }

  let lastSection = "";
  companyList.innerHTML = filtered.map((company) => {
    const heading = company.section !== lastSection
      ? `<div id="${escapeHtml(company.section)}" class="section-heading"><h3>${escapeHtml(company.section)}</h3><p>${escapeHtml(company.sectionLabel)}</p></div>`
      : "";
    lastSection = company.section;
    return heading + companyRow(company);
  }).join("");
}

async function loadCompanies() {
  let payload;
  try {
    payload = await fetchJson("/api/companies");
  } catch {
    payload = { companies: await fetchJson("./data/companies.json") };
  }
  state.companies = payload.companies.sort((a, b) => {
    if (a.section === b.section) return a.rank - b.rank;
    return a.section.localeCompare(b.section);
  });
  renderNav();
  renderMetrics();
  renderCompanies();
}

async function loadJobs(force = false) {
  state.loading = true;
  refreshButton.disabled = true;
  refreshButton.textContent = "조회 중";
  renderCompanies();

  try {
    let payload;
    try {
      payload = await fetchJson(`/api/jobs${force ? "?refresh=1" : ""}`);
    } catch {
      payload = await fetchJson("./data/jobs_snapshot.json");
    }
    state.jobResults = new Map(payload.results.map((result) => [result.id, result]));
    renderMetrics(payload.generatedAt);
  } finally {
    state.loading = false;
    refreshButton.disabled = false;
    refreshButton.textContent = "새로고침";
    renderCompanies();
  }
}

refreshButton.addEventListener("click", () => loadJobs(true));

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");
    state.priority = button.dataset.priority;
    renderCompanies();
  });
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCompanies();
});

await loadCompanies();
await loadJobs(true);
