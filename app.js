const USER = "qyqy-1109";
const API = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;
const FEATURED = "old-acquaintance";
const HIDDEN = new Set(["ecc-file-sharing", USER, `${USER}.github.io`]);
const PROJECT_ORDER = new Map([
  ["old-acquaintance", 0],
  ["quote-lens", 1],
  ["deepseek-harness-desktop", 2],
]);
const RESEARCH = new Set(["deepseek-harness-desktop"]);
const OVERRIDES = {
  "deepseek-harness-desktop": {
    description: "Electron 研究：验证自包含 Windows 桌面壳如何自动启动本地 dsh web 服务，并试验 Codex 风格的主题机制。",
    topics: ["electron", "research", "desktop"],
  },
};

const FALLBACK = [
  {
    name: "old-acquaintance",
    html_url: `https://github.com/${USER}/old-acquaintance`,
    description: "本地陪伴型对话助手：四层记忆、写路径治理、人格卡片与可复现评测。",
    language: "Python",
    topics: ["ai", "memory", "sqlite", "fastapi", "llm"],
    stargazers_count: 1,
    forks_count: 0,
    pushed_at: "2026-10-29T00:00:00Z",
  },
  {
    name: "quote-lens",
    html_url: `https://github.com/${USER}/quote-lens`,
    description: "QuoteLens · 报价透镜：多平台 CNC 报价监测与 AI 决策层。",
    language: "Python",
    topics: ["cnc", "quotes", "automation", "ai"],
    stargazers_count: 1,
    forks_count: 0,
    pushed_at: "2026-10-01T00:00:00Z",
  },
  {
    name: "deepseek-harness-desktop",
    html_url: `https://github.com/${USER}/deepseek-harness-desktop`,
    description: "DeepSeek Harness Desktop: self-contained Windows desktop shell (Electron) that auto-starts dsh web.",
    language: "JavaScript",
    topics: ["electron", "desktop", "deepseek"],
    stargazers_count: 10,
    forks_count: 0,
    pushed_at: "2026-08-01T00:00:00Z",
  },
];

const LANGUAGE_COLORS = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "Jupyter Notebook": "#DA5B0B",
};

const grid = document.getElementById("repo-grid");
const statusNode = document.getElementById("repo-status");
const search = document.getElementById("repo-search");
const filters = document.getElementById("language-filters");

let repos = [];
let activeLanguage = "全部";
let query = "";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
  }).format(date);
}

function normalizeRepo(repo) {
  const name = String(repo.name || "");
  const override = OVERRIDES[name] || {};
  let description = String(override.description || repo.description || "");
  for (const prefix of [`${name} · `, `${name} - `, `${name}: `]) {
    if (description.startsWith(prefix)) {
      description = description.slice(prefix.length);
      break;
    }
  }
  return {
    name,
    html_url: String(repo.html_url || ""),
    description,
    language: repo.language ? String(repo.language) : "",
    topics: Array.isArray(override.topics)
      ? override.topics
      : Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [],
    stargazers_count: Number(repo.stargazers_count || 0),
    forks_count: Number(repo.forks_count || 0),
    pushed_at: repo.pushed_at || "",
  };
}

function repoMatches(repo) {
  if (activeLanguage !== "全部" && repo.language !== activeLanguage) return false;
  if (!query) return true;
  const haystack = [repo.name, repo.description, repo.language, ...repo.topics]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function renderFilters() {
  const counts = new Map();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  }
  const languages = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([language]) => language);

  filters.replaceChildren();
  for (const language of ["全部", ...languages]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip" + (language === activeLanguage ? " active" : "");
    button.textContent = language === "全部" ? "全部" : `${language} · ${counts.get(language)}`;
    button.setAttribute("aria-pressed", String(language === activeLanguage));
    button.addEventListener("click", () => {
      activeLanguage = language;
      renderFilters();
      renderRepos();
    });
    filters.append(button);
  }
}

function buildRepoCard(repo) {
  const card = document.createElement("article");
  card.className = "repo-card";

  const top = document.createElement("div");
  top.className = "repo-top";
  const language = document.createElement("span");
  language.className = "lang";
  const dot = document.createElement("span");
  dot.className = "lang-dot";
  dot.style.background = LANGUAGE_COLORS[repo.language] || "#98a098";
  language.append(dot, document.createTextNode(repo.language || "Repository"));
  if (RESEARCH.has(repo.name)) {
    const kind = document.createElement("span");
    kind.className = "repo-kind";
    kind.textContent = "Research";
    language.append(kind);
  }
  const updated = document.createElement("span");
  updated.textContent = formatDate(repo.pushed_at) ? `更新于 ${formatDate(repo.pushed_at)}` : "";
  top.append(language, updated);

  const title = document.createElement("h3");
  const link = document.createElement("a");
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = repo.name;
  title.append(link);

  const description = document.createElement("p");
  description.textContent = repo.description || "暂无描述。";

  card.append(top, title, description);

  if (repo.topics.length) {
    const topics = document.createElement("div");
    topics.className = "repo-topics";
    for (const topic of repo.topics) {
      const tag = document.createElement("span");
      tag.textContent = topic;
      topics.append(tag);
    }
    card.append(topics);
  }

  const meta = document.createElement("div");
  meta.className = "repo-meta";
  if (repo.language) meta.append(document.createTextNode(repo.language));
  if (repo.stargazers_count > 0) meta.append(document.createTextNode(`★ ${repo.stargazers_count}`));
  if (repo.forks_count > 0) meta.append(document.createTextNode(`Forks ${repo.forks_count}`));
  card.append(meta);

  return card;
}

function renderRepos() {
  const visible = repos.filter(repoMatches);
  grid.replaceChildren();

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "repo-empty";
    empty.textContent = "没有匹配的仓库。试试清空搜索，或者直接去 GitHub 看看。";
    grid.append(empty);
  } else {
    for (const repo of visible) grid.append(buildRepoCard(repo));
  }

  const suffix = visible.length === repos.length ? "" : ` / ${repos.length}`;
  statusNode.textContent = `共 ${visible.length}${suffix} 个公开仓库`;
}

async function loadRepos() {
  try {
    const response = await fetch(API, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Unexpected GitHub response");
    const loaded = data
      .filter((repo) => !repo.fork && !HIDDEN.has(repo.name))
      .map(normalizeRepo)
      .filter((repo) => repo.name && repo.html_url)
      .sort((a, b) => {
        const rankA = PROJECT_ORDER.has(a.name) ? PROJECT_ORDER.get(a.name) : 99;
        const rankB = PROJECT_ORDER.has(b.name) ? PROJECT_ORDER.get(b.name) : 99;
        return rankA - rankB
          || b.stargazers_count - a.stargazers_count
          || new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
      });
    repos = loaded.length ? loaded : FALLBACK;
    statusNode.textContent = loaded.length
      ? `已连接 GitHub · ${repos.length} 个公开仓库`
      : "GitHub 上还没有公开仓库，先展示精选项目。";
  } catch (error) {
    repos = FALLBACK;
    statusNode.textContent = "GitHub API 暂时不可用，当前显示精选项目；完整列表请直接访问 GitHub。";
  }
  renderFilters();
  renderRepos();
}

search.addEventListener("input", () => {
  query = search.value.trim().toLowerCase();
  renderRepos();
});

document.getElementById("year").textContent = String(new Date().getFullYear());
loadRepos();
