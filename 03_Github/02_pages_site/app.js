const state = {
  companies: [],
  jobResults: new Map(),
  priority: "all",
  query: "",
  view: "dashboard",
  generatedAt: null
};

const TRACK_META = {
  "01_GeoAI_SpatialAI": {
    label: "GeoAI / Spatial AI",
    short: "GeoAI",
    color: "#1e6b57",
    strategy: "공간 AI, 위성/지도/모빌리티 데이터를 직접 다루는 포지션을 최우선으로 봅니다.",
    pitch: "LiDAR-camera fusion, crop mapping, satellite AI, data-scarce ML 경험을 제품/연구 직무 언어로 전환합니다."
  },
  "02_Consulting_Strategy": {
    label: "Consulting / Strategy",
    short: "Consulting",
    color: "#324f9b",
    strategy: "기후, 식량, ESG, AI 전략을 데이터 기반 문제 해결 포트폴리오로 제시합니다.",
    pitch: "박사 연구를 전략 컨설팅의 hypothesis, market sizing, operating model 언어로 압축합니다."
  },
  "03_Insurance_Risk": {
    label: "Insurance / Risk",
    short: "Risk",
    color: "#9b4b31",
    strategy: "자연재해, 기후 리스크, 보험 데이터 분석을 연결해 특화형 risk analytics 후보로 포지셔닝합니다.",
    pitch: "위성 기반 변화 탐지와 농업/기후 모델링을 언더라이팅, 보상, 재보험 모델링으로 번역합니다."
  },
  "04_Food_Agro_Strategy": {
    label: "Food / Agro Strategy",
    short: "Agro",
    color: "#7a5a18",
    strategy: "식량 공급망, 원재료 수급, 농업 데이터 인텔리전스 기업을 집중 공략합니다.",
    pitch: "crop mapping, food security, agri-market data 경험을 사업개발/전략/데이터 직무로 연결합니다."
  }
};

const $ = (selector) => document.querySelector(selector);
const sectionNav = $("#sectionNav");
const companyList = $("#companyList");
const refreshButton = $("#refreshButton");
const searchInput = $("#searchInput");
const companyCount = $("#companyCount");
const jobCount = $("#jobCount");
const focusCount = $("#focusCount");
const updatedAt = $("#updatedAt");
const strategyBoard = $("#strategyBoard");
const linksBoard = $("#linksBoard");
const appViews = document.querySelectorAll(".app-view");

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
    year: "numeric",
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

function initials(name) {
  return name
    .split(/[\s/&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function logoUrl(company) {
  const domain = company.logoDomain || hostname(company.officialJobUrl);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
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
        label: TRACK_META[company.section]?.label || company.sectionLabel,
        count: 0,
        averageFit: 0,
        fitTotal: 0
      });
    }
    const item = map.get(company.section);
    item.count += 1;
    item.fitTotal += company.fitScore;
    item.averageFit = Math.round(item.fitTotal / item.count);
  });
  return [...map.values()];
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

function renderNav() {
  sectionNav.innerHTML = sectionMeta(state.companies).map((section) => {
    const meta = TRACK_META[section.section] || {};
    return `
      <button class="section-link" type="button" data-section="${escapeHtml(section.section)}">
        <span class="section-dot" style="background:${escapeHtml(meta.color || "#1e6b57")}"></span>
        <strong>${escapeHtml(meta.short || section.section)}</strong>
        <em>${section.count} companies · fit ${section.averageFit}</em>
      </button>
    `;
  }).join("");

  sectionNav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      setView("dashboard");
      document.getElementById(button.dataset.section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderMetrics() {
  companyCount.textContent = state.companies.length.toString();
  jobCount.textContent = state.companies.length.toString();
  focusCount.textContent = state.companies.filter((company) => company.priority === "1차 집중").length.toString();
  updatedAt.textContent = state.generatedAt ? formatDate(state.generatedAt) : "스냅샷 대기";
}

function renderUpdatePanel() {
  const panel = $("#updatePanel");
  const okCount = [...state.jobResults.values()].filter((result) => result.ok).length;
  const failCount = state.jobResults.size ? state.jobResults.size - okCount : 0;
  panel.innerHTML = `
    <div>
      <span class="panel-label">Manual check mode</span>
      <strong>${state.generatedAt ? formatDate(state.generatedAt) : "공식 링크 준비 중"}</strong>
      <p>공식 채용 사이트는 로그인, 검색 UI, JavaScript 렌더링 때문에 정적 GitHub Pages에서 안정적으로 자동 크롤링하기 어렵습니다. 이 앱은 공식 링크를 빠르게 열고 직접 확인하는 수동 확인 허브로 동작합니다.</p>
    </div>
    <div class="sync-grid">
      <span><b>${state.companies.length}</b> official links</span>
      <span><b>${okCount}</b> checked by snapshot</span>
      <a href="https://github.com/twinsben94/Job_Search/actions/workflows/pages.yml" target="_blank" rel="noreferrer">스냅샷 기록</a>
    </div>
  `;
}

function sourceLine(company, result) {
  const officialUrl = result?.officialJobUrl || company.officialJobUrl;
  const code = result?.statusCode ? `HTTP ${result.statusCode}` : "official";
  return `
    <div class="source-line">
      <span>공식 출처</span>
      <a href="${escapeHtml(officialUrl)}" target="_blank" rel="noreferrer">${escapeHtml(hostname(officialUrl))}</a>
      <code>${escapeHtml(code)}</code>
    </div>
  `;
}

function jobPanel(company) {
  const result = state.jobResults.get(company.folder);
  const checkedAt = result?.fetchedAt ? formatDate(result.fetchedAt) : "조회 전";
  const note = result?.ok
    ? "스냅샷 생성 시 공식 링크 응답이 확인되었습니다."
    : "공식 사이트에서 직접 채용공고를 확인하세요.";

  return `
    <div class="job-panel">
      <div class="job-panel-head">
        <div>
          <strong>공식 채용 확인</strong>
          <span class="job-note">${escapeHtml(note)}</span>
        </div>
        <div class="fetch-status ${result?.ok ? "is-ok" : "is-fail"}">
          <span>${result?.ok ? "링크 확인" : "수동 확인"}</span>
          <small>${escapeHtml(checkedAt)}</small>
        </div>
      </div>
      ${sourceLine(company, result)}
      <div class="manual-actions">
        <a class="open-button" href="${escapeHtml(company.officialJobUrl)}" target="_blank" rel="noreferrer">채용공고 열기</a>
        <a class="secondary-button" href="https://www.google.com/search?q=${encodeURIComponent(`${company.name} 채용`)}" target="_blank" rel="noreferrer">웹 검색</a>
      </div>
      <div class="checklist">
        <span>확인할 것</span>
        <ul>
          <li>현재 진행 중인 공고명</li>
          <li>근무지역과 지원 마감일</li>
          <li>AI/Data/Strategy 관련 직무 여부</li>
        </ul>
      </div>
    </div>
  `;
}

function companyRow(company) {
  const meta = TRACK_META[company.section] || {};
  return `
    <article class="company-row">
      <div class="company-profile">
        <div class="company-head">
          <div class="company-identity">
            <span class="logo-box">
              <img src="${escapeHtml(logoUrl(company))}" alt="" loading="lazy">
              <em>${escapeHtml(initials(company.name))}</em>
            </span>
            <div>
              <h3 class="company-name">${escapeHtml(company.name)}</h3>
              <span class="folder-path">${escapeHtml(meta.short || company.section)} · ${escapeHtml(company.locationHint)}</span>
            </div>
          </div>
          <span class="rank-badge">#${escapeHtml(company.rank)}</span>
        </div>

        <div class="badge-row">
          <span class="priority-badge ${priorityClass(company.priority)}">${escapeHtml(company.priority)}</span>
          <span class="location-badge">${escapeHtml(company.fitLevel)}</span>
        </div>

        <div class="fit-meter">
          <div class="fit-line">
            <span>직무 적합도</span>
            <strong>${escapeHtml(company.fitScore)}</strong>
          </div>
          <div class="bar"><span style="width:${escapeHtml(company.fitScore)}%; background:${escapeHtml(meta.color || "#1e6b57")}"></span></div>
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
    const meta = TRACK_META[company.section] || {};
    const heading = company.section !== lastSection
      ? `
        <div id="${escapeHtml(company.section)}" class="section-heading">
          <div>
            <span class="section-dot" style="background:${escapeHtml(meta.color || "#1e6b57")}"></span>
            <h3>${escapeHtml(meta.label || company.sectionLabel)}</h3>
          </div>
          <p>${escapeHtml(meta.strategy || company.sectionLabel)}</p>
        </div>
      `
      : "";
    lastSection = company.section;
    return heading + companyRow(company);
  }).join("");
}

function renderStrategy() {
  const sections = sectionMeta(state.companies);
  strategyBoard.innerHTML = `
    <div class="strategy-hero">
      <div>
        <span class="panel-label">Application strategy</span>
        <h2>텍스트 문서가 아니라 실행용 로드맵으로 보기</h2>
        <p>각 트랙은 CV/포트폴리오의 강점을 어떤 직무 언어로 번역할지에 따라 나뉩니다.</p>
      </div>
      <div class="strategy-score">
        <strong>${sections.length}</strong>
        <span>career tracks</span>
      </div>
    </div>
    <div class="strategy-grid">
      ${sections.map((section) => {
        const meta = TRACK_META[section.section] || {};
        const topCompanies = state.companies
          .filter((company) => company.section === section.section)
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 3);
        return `
          <article class="strategy-card" style="--track:${escapeHtml(meta.color || "#1e6b57")}">
            <div class="strategy-card-head">
              <span>${escapeHtml(meta.short || section.section)}</span>
              <strong>fit ${section.averageFit}</strong>
            </div>
            <h3>${escapeHtml(meta.label || section.label)}</h3>
            <p>${escapeHtml(meta.strategy || "")}</p>
            <div class="strategy-pitch">${escapeHtml(meta.pitch || "")}</div>
            <div class="mini-company-list">
              ${topCompanies.map((company) => `
                <a href="${escapeHtml(company.officialJobUrl)}" target="_blank" rel="noreferrer">
                  <img src="${escapeHtml(logoUrl(company))}" alt="">
                  <span>${escapeHtml(company.name)}</span>
                </a>
              `).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderLinks() {
  linksBoard.innerHTML = `
    <div class="links-table">
      ${state.companies.map((company) => {
        const meta = TRACK_META[company.section] || {};
        const result = state.jobResults.get(company.folder);
        return `
          <article class="link-row">
            <div class="company-identity">
              <span class="logo-box small">
                <img src="${escapeHtml(logoUrl(company))}" alt="" loading="lazy">
                <em>${escapeHtml(initials(company.name))}</em>
              </span>
              <div>
                <strong>${escapeHtml(company.name)}</strong>
                <span>${escapeHtml(meta.short || company.section)} · ${escapeHtml(company.priority)}</span>
              </div>
            </div>
            <div class="link-status ${result?.ok ? "is-ok" : "is-fail"}">${result?.ok ? "reachable" : "manual check"}</div>
            <a href="${escapeHtml(company.officialJobUrl)}" target="_blank" rel="noreferrer">${escapeHtml(hostname(company.officialJobUrl))}</a>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function setView(view, updateHash = true) {
  state.view = view;
  appViews.forEach((viewEl) => viewEl.classList.toggle("active", viewEl.dataset.view === view));
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  if (updateHash) {
    history.replaceState(null, "", `#${view}`);
  }
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
  renderStrategy();
  renderLinks();
}

async function loadJobs(force = false) {
  refreshButton.disabled = true;
  refreshButton.textContent = "업데이트 확인 중";
  renderCompanies();

  try {
    let payload;
    try {
      payload = await fetchJson(`/api/jobs${force ? "?refresh=1" : ""}`);
    } catch {
      payload = await fetchJson(`./data/jobs_snapshot.json?ts=${Date.now()}`);
    }
    state.generatedAt = payload.generatedAt;
    state.jobResults = new Map(payload.results.map((result) => [result.id, result]));
    renderMetrics();
    renderUpdatePanel();
    renderCompanies();
    renderLinks();
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "스냅샷 새로고침";
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

document.querySelectorAll(".view-tab").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCompanies();
});

await loadCompanies();
await loadJobs(true);
if (["dashboard", "strategy", "links"].includes(location.hash.replace("#", ""))) {
  setView(location.hash.replace("#", ""), false);
}
