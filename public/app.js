const queryGrid = document.getElementById("queryGrid");
const resultTitle = document.getElementById("resultTitle");
const resultInsight = document.getElementById("resultInsight");
const resultsTable = document.getElementById("resultsTable");
const jsonOutput = document.getElementById("jsonOutput");
const statusBadge = document.getElementById("statusBadge");
const refreshButton = document.getElementById("refreshQueries");
const queryCardTemplate = document.getElementById("queryCardTemplate");
const resultsSection = document.querySelector(".results-section");

let activeButton = null;

function setStatus(mode, label) {
  statusBadge.className = `status-badge ${mode}`;
  statusBadge.textContent = label;
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderTable(rows) {
  if (!rows.length) {
    resultsTable.innerHTML =
      '<tbody><tr><td class="empty-state">No records found for this query.</td></tr></tbody>';
    return;
  }

  const columns = Object.keys(rows[0]);
  const thead = `
    <thead>
      <tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>
    </thead>
  `;

  const tbody = `
    <tbody>
      ${rows
        .map(
          (row) =>
            `<tr>${columns
              .map((column) => `<td>${formatValue(row[column])}</td>`)
              .join("")}</tr>`
        )
        .join("")}
    </tbody>
  `;

  resultsTable.innerHTML = `${thead}${tbody}`;
}

async function runQuery(key) {
  if (activeButton) {
    activeButton.disabled = true;
    activeButton.textContent = "Running...";
  }

  setStatus("loading", "Running");
  resultTitle.textContent = "Running analysis...";
  resultInsight.textContent = "Please wait while MongoDB returns the aggregated result set.";
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch(`/api/analytics/${key}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Query execution failed.");
    }

    resultTitle.textContent = payload.title;
    resultInsight.textContent = payload.insight;
    renderTable(payload.results);
    jsonOutput.textContent = JSON.stringify(payload.results, null, 2);
    setStatus("success", `${payload.results.length} rows`);
  } catch (error) {
    resultsTable.innerHTML = `<tbody><tr><td class="empty-state">${error.message}</td></tr></tbody>`;
    jsonOutput.textContent = error.message;
    resultTitle.textContent = "Query failed";
    resultInsight.textContent = "Check your MongoDB connection and collection schema, then retry.";
    setStatus("error", "Error");
  } finally {
    if (activeButton) {
      activeButton.disabled = false;
      activeButton.textContent = "Run Query";
      activeButton = null;
    }
  }
}

function renderQueryCards(queries) {
  queryGrid.innerHTML = "";

  queries.forEach((query, index) => {
    const fragment = queryCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".query-card");
    const indexEl = fragment.querySelector(".card-index");
    const titleEl = fragment.querySelector("h3");
    const insightEl = fragment.querySelector(".card-insight");
    const button = fragment.querySelector(".run-button");

    indexEl.textContent = `Module ${String(index + 1).padStart(2, "0")}`;
    titleEl.textContent = query.title;
    insightEl.textContent = query.insight;
    button.addEventListener("click", () => {
      activeButton = button;
      runQuery(query.key);
    });

    card.style.animationDelay = `${index * 60}ms`;
    queryGrid.appendChild(fragment);
  });
}

async function loadQueries() {
  setStatus("loading", "Loading");

  try {
    const response = await fetch("/api/analytics/queries");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Could not load query metadata.");
    }

    renderQueryCards(payload.queries);
    setStatus("idle", "Ready");
  } catch (error) {
    queryGrid.innerHTML = `<div class="query-card"><p class="card-insight">${error.message}</p></div>`;
    setStatus("error", "Offline");
  }
}

refreshButton.addEventListener("click", loadQueries);
loadQueries();
