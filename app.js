/* ============================================================
   BuildBids — app.js
   Main feed + search logic for index.html & dashboard.html
   Now fetches LIVE bids from SAM.gov via Netlify Function proxy
   ============================================================ */

(function () {
  "use strict";

  // ── Live Government Bid Data (SAM.gov API) ──────────────────

  let BIDS = [];
  let isLoading = true;
  let loadError = null;

  // Fallback bid shown while API loads or if it fails
  const FALLBACK_BIDS = [
    {
      id: "demo-001",
      title: "Loading live bids from SAM.gov...",
      agency: "Federal Government",
      state: "United States",
      stateCode: "US",
      location: { city: "", county: "", state: "United States" },
      categories: ["general-construction"],
      trades: ["general-construction"],
      estimatedValue: "—",
      valueBracket: "50k-100k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      publishDate: new Date().toISOString().substring(0, 10),
      sourceUrl: "https://sam.gov",
      status: "open",
      summary: {
        plainEnglish: "Live government bids are loading from SAM.gov. If this message persists, the API key may not be configured yet.",
        keyDates: [],
        requirements: ["SAM.gov registration"],
        scope: "Connecting to SAM.gov...",
        fitScore: 5,
      },
    },
  ];

  // ── SAM.gov API Fetch ──────────────────────────────────────────

  async function fetchLiveBids(options) {
    const params = new URLSearchParams();
    if (options && options.keyword)  params.set("keyword", options.keyword);
    if (options && options.naics)    params.set("naics", options.naics);
    if (options && options.state)    params.set("state", options.state);
    params.set("limit", (options && options.limit) ? options.limit.toString() : "50");

    const url = "/api/sam-proxy?" + params.toString();

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("API returned " + resp.status);
      const data = await resp.json();
      return data.bids || [];
    } catch (err) {
      console.error("[BuildBids] SAM.gov API error:", err);
      return null; // null = use fallback
    }
  }

  // Fetch live bids from SAM.gov
  async function loadAllBids() {
    isLoading = true;
    showLoadingState();

    try {
      // Broad search — the API returns mixed trades
      const bids = await fetchLiveBids({ limit: 100 });

      if (bids && bids.length > 0) {
        BIDS = bids;
        loadError = null;
        console.log("[BuildBids] Loaded " + bids.length + " live bids from SAM.gov");
      } else if (bids && bids.length === 0) {
        // API worked but returned no results — try broader search
        const broadBids = await fetchLiveBids({ keyword: "construction maintenance janitorial", limit: 50 });
        if (broadBids && broadBids.length > 0) {
          BIDS = broadBids;
          loadError = null;
        } else {
          BIDS = FALLBACK_BIDS;
          loadError = "no-results";
        }
      } else {
        // API failed — use fallback
        BIDS = FALLBACK_BIDS;
        loadError = "api-error";
      }
    } catch (err) {
      console.error("[BuildBids] Load error:", err);
      BIDS = FALLBACK_BIDS;
      loadError = "exception";
    }

    isLoading = false;
    applyFilters();
    // Update the exposed API
    if (window.BuildBids) window.BuildBids.bids = BIDS;
  }

  function showLoadingState() {
    var feedEl = document.getElementById("bidFeed");
    if (feedEl) {
      feedEl.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
          '<div style="width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>' +
          '<p style="color:var(--text-secondary);font-size:14px;">Loading live government bids from SAM.gov...</p>' +
        '</div>' +
        '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    }
  }

  // ── Utility: Days until deadline ────────────────────────────

  function daysUntilDeadline(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr + "T00:00:00");
    const diff = deadline - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatDeadline(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // ── Saved Bids (localStorage MVP) ───────────────────────────

  const SAVED_KEY = "buildbids_saved";
  const APPLIED_KEY = "buildbids_applied";
  const STATUS_KEY = "buildbids_status"; // { bidId: 'won'|'lost' }

  function getSavedBids() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
  }
  function saveBid(bidId) {
    const saved = getSavedBids();
    if (!saved.includes(bidId)) { saved.push(bidId); localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); }
  }
  function unsaveBid(bidId) {
    const saved = getSavedBids().filter(function (id) { return id !== bidId; });
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }
  function isBidSaved(bidId) {
    return getSavedBids().includes(bidId);
  }

  function getAppliedBids() {
    try { return JSON.parse(localStorage.getItem(APPLIED_KEY)) || []; } catch { return []; }
  }
  function markApplied(bidId) {
    const applied = getAppliedBids();
    if (!applied.includes(bidId)) { applied.push(bidId); localStorage.setItem(APPLIED_KEY, JSON.stringify(applied)); }
  }
  function isApplied(bidId) {
    return getAppliedBids().includes(bidId);
  }

  function getBidStatuses() {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY)) || {}; } catch { return {}; }
  }
  function setBidStatus(bidId, status) {
    const statuses = getBidStatuses();
    statuses[bidId] = status;
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  }
  function getBidStatus(bidId) {
    return getBidStatuses()[bidId] || null;
  }

  // ── Toast ───────────────────────────────────────────────────

  function showToast(msg, type) {
    type = type || "info";
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = "toast toast-" + type + " toast-show";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () { toast.classList.remove("toast-show"); }, 3000);
  }

  // ── Fit Score Color ─────────────────────────────────────────

  function fitScoreColor(score) {
    if (score >= 7) return "#10b981";
    if (score >= 4) return "#f59e0b";
    return "#ef4444";
  }

  function fitScoreLabel(score) {
    if (score >= 7) return "Great Fit";
    if (score >= 4) return "Possible Fit";
    return "Low Fit";
  }

  // ── Render Bid Card ─────────────────────────────────────────

  function renderBidCard(bid) {
    const days = daysUntilDeadline(bid.deadlineDate);
    const saved = isBidSaved(bid.id);

    let deadlineClass = "meta-deadline";
    let statusBadge = "";
    if (days < 0) {
      deadlineClass += " deadline-expired";
      statusBadge = '<span class="bid-status bid-status-closed">Closed</span>';
    } else if (days <= 3) {
      deadlineClass += " deadline-urgent";
      statusBadge = '<span class="bid-status bid-status-urgent">Closing Soon</span>';
    } else if (days <= 7) {
      deadlineClass += " deadline-warning";
      statusBadge = '<span class="bid-status bid-status-warning">Closing Soon</span>';
    } else {
      statusBadge = '<span class="bid-status bid-status-open">Open</span>';
    }

    const score = bid.summary.fitScore;
    const scoreColor = fitScoreColor(score);
    const scoreWidth = (score / 10) * 100;

    let tagsHTML = "";
    bid.trades.forEach(function (t) {
      tagsHTML += '<span class="bid-tag">' + t.replace(/-/g, " ") + "</span>";
    });

    // Link to SAM.gov directly if sourceUrl exists, otherwise to local detail page
    const titleLink = bid.sourceUrl && bid.sourceUrl.indexOf("sam.gov") !== -1
      ? bid.sourceUrl
      : "bid.html?id=" + bid.id;
    const titleTarget = bid.sourceUrl && bid.sourceUrl.indexOf("sam.gov") !== -1
      ? ' target="_blank" rel="noopener"'
      : "";

    return (
      '<div class="bid-card" data-id="' + bid.id + '">' +
        '<div class="bid-card-header">' +
          '<div class="bid-card-header-left">' +
            '<span class="bid-agency">' + bid.agency + "</span>" +
            statusBadge +
          "</div>" +
          '<button class="bid-save-btn ' + (saved ? "saved" : "") + '" data-bid-id="' + bid.id + '" title="' + (saved ? "Unsave" : "Save") + ' bid">' +
            (saved ? "★" : "☆") +
          "</button>" +
        "</div>" +
        '<a href="' + titleLink + '" class="bid-card-title"' + titleTarget + '>' + bid.title + "</a>" +
        '<div class="bid-tags">' + tagsHTML + "</div>" +
        '<div class="bid-meta">' +
          '<span class="meta-value" title="Estimated Value">💰 ' + bid.estimatedValue + "</span>" +
          '<span class="meta-location" title="Location">📍 ' + (bid.location.city ? bid.location.city + ", " : "") + bid.stateCode + "</span>" +
          '<span class="' + deadlineClass + '" title="Deadline">📅 ' + formatDeadline(bid.deadlineDate) +
            (days >= 0 ? " (" + days + "d)" : " (expired)") +
          "</span>" +
        "</div>" +
        '<div class="bid-fitscore">' +
          '<span class="fitscore-label" style="color:' + scoreColor + '">' + fitScoreLabel(score) + " " + score + "/10</span>" +
          '<div class="fitscore-bar"><div class="fitscore-fill" style="width:' + scoreWidth + "%;background:" + scoreColor + '"></div></div>' +
        "</div>" +
        // Direct link to SAM.gov listing
        (bid.sourceUrl ? '<a href="' + bid.sourceUrl + '" class="bid-source-link" target="_blank" rel="noopener">View on SAM.gov →</a>' : '') +
      "</div>"
    );
  }

  // ── Feed Rendering ──────────────────────────────────────────

  function renderFeed(filteredBids) {
    const container = document.getElementById("bidFeed");
    if (!container) return;

    if (filteredBids.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">🔍</div>' +
          "<h3>No bids match your filters</h3>" +
          "<p>Try adjusting your search or filter criteria.</p>" +
        "</div>";
      return;
    }

    const countEl = document.getElementById("bidCount");
    if (countEl) countEl.textContent = filteredBids.length + " bid" + (filteredBids.length !== 1 ? "s" : "");

    container.innerHTML = filteredBids.map(renderBidCard).join("");

    // Attach save button listeners
    container.querySelectorAll(".bid-save-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const bidId = btn.getAttribute("data-bid-id");
        if (isBidSaved(bidId)) {
          unsaveBid(bidId);
          btn.classList.remove("saved");
          btn.textContent = "☆";
          btn.title = "Save bid";
          showToast("Bid removed from saved", "info");
        } else {
          saveBid(bidId);
          btn.classList.add("saved");
          btn.textContent = "★";
          btn.title = "Unsave bid";
          showToast("Bid saved! ★", "success");
        }
      });
    });
  }

  // ── Filtering ───────────────────────────────────────────────

  function getActiveFilters() {
    const filters = {
      trades: [],
      states: [],
      sizes: [],
      statuses: [],
      search: "",
    };

    document.querySelectorAll('input[name="trade"]:checked').forEach(function (cb) { filters.trades.push(cb.value); });
    document.querySelectorAll('input[name="state"]:checked').forEach(function (cb) { filters.states.push(cb.value); });
    document.querySelectorAll('input[name="size"]:checked').forEach(function (cb) { filters.sizes.push(cb.value); });
    document.querySelectorAll('input[name="status"]:checked').forEach(function (cb) { filters.statuses.push(cb.value); });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) filters.search = searchInput.value.trim().toLowerCase();

    return filters;
  }

  function applyFilters() {
    const filters = getActiveFilters();

    const filtered = BIDS.filter(function (bid) {
      // Trade filter
      if (filters.trades.length > 0) {
        const match = bid.trades.some(function (t) { return filters.trades.includes(t); });
        if (!match) return false;
      }

      // State filter
      if (filters.states.length > 0) {
        if (!filters.states.includes(bid.stateCode)) return false;
      }

      // Size filter
      if (filters.sizes.length > 0) {
        if (!filters.sizes.includes(bid.valueBracket)) return false;
      }

      // Status filter
      if (filters.statuses.length > 0) {
        const days = daysUntilDeadline(bid.deadlineDate);
        let bidStatus = "open";
        if (days < 0) bidStatus = "closed";
        else if (days <= 7) bidStatus = "closing-soon";
        if (!filters.statuses.includes(bidStatus)) return false;
      }

      // Search
      if (filters.search) {
        const haystack = (bid.title + " " + bid.agency + " " + bid.summary.plainEnglish + " " + bid.location.city + " " + bid.location.county + " " + bid.state).toLowerCase();
        if (haystack.indexOf(filters.search) === -1) return false;
      }

      return true;
    });

    renderFeed(filtered);
    updateURLParams(filters);
  }

  // ── URL Params ──────────────────────────────────────────────

  function updateURLParams(filters) {
    const params = new URLSearchParams();
    if (filters.trades.length) params.set("trades", filters.trades.join(","));
    if (filters.states.length) params.set("states", filters.states.join(","));
    if (filters.sizes.length) params.set("sizes", filters.sizes.join(","));
    if (filters.statuses.length) params.set("statuses", filters.statuses.join(","));
    if (filters.search) params.set("q", filters.search);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? "?" + qs : "");
    window.history.replaceState(null, "", url);
  }

  function loadURLParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("trades")) {
      params.get("trades").split(",").forEach(function (v) {
        const cb = document.querySelector('input[name="trade"][value="' + v + '"]');
        if (cb) cb.checked = true;
      });
    }
    if (params.has("states")) {
      params.get("states").split(",").forEach(function (v) {
        const cb = document.querySelector('input[name="state"][value="' + v + '"]');
        if (cb) cb.checked = true;
      });
    }
    if (params.has("sizes")) {
      params.get("sizes").split(",").forEach(function (v) {
        const cb = document.querySelector('input[name="size"][value="' + v + '"]');
        if (cb) cb.checked = true;
      });
    }
    if (params.has("statuses")) {
      params.get("statuses").split(",").forEach(function (v) {
        const cb = document.querySelector('input[name="status"][value="' + v + '"]');
        if (cb) cb.checked = true;
      });
    }
    if (params.has("q")) {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = params.get("q");
    }
  }

  // ── Filter Panel Toggle (Mobile) ────────────────────────────

  function setupFilterToggle() {
    const toggle = document.getElementById("filterToggle");
    const panel = document.getElementById("filterPanel");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        panel.classList.toggle("filter-panel-open");
        toggle.textContent = panel.classList.contains("filter-panel-open") ? "Hide Filters ▲" : "Filters ▼";
      });
    }
  }

  // ── Clear Filters ───────────────────────────────────────────

  function setupClearFilters() {
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        applyFilters();
      });
    }
  }

  // ── Auth Integration ────────────────────────────────────────

  function setupAuth() {
    if (window.BuildAuth) {
      window.BuildAuth.onAuthChange(function (user) {
        const authPrompt = document.getElementById("authPrompt");
        const dashContent = document.getElementById("dashboardContent");
        if (authPrompt && dashContent) {
          if (user) {
            authPrompt.style.display = "none";
            dashContent.style.display = "block";
          } else {
            authPrompt.style.display = "flex";
            dashContent.style.display = "none";
          }
        }
      });
    }
  }

  // ── Dashboard ───────────────────────────────────────────────

  function setupDashboard() {
    const dashContent = document.getElementById("dashboardContent");
    if (!dashContent) return;

    const tabs = document.querySelectorAll(".dash-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        renderDashboardTab(tab.getAttribute("data-tab"));
      });
    });

    // Render the default tab
    renderDashboardTab("saved");
  }

  function renderDashboardTab(tabName) {
    const container = document.getElementById("dashBidList");
    if (!container) return;

    let bidIds = [];
    let emptyMsg = "";
    let emptyIcon = "";

    if (tabName === "saved") {
      bidIds = getSavedBids();
      emptyMsg = "No saved bids yet. Browse the feed and save bids you're interested in.";
      emptyIcon = "⭐";
    } else if (tabName === "applied") {
      bidIds = getAppliedBids();
      emptyMsg = "No applied bids yet. Mark bids as applied when you submit your proposal.";
      emptyIcon = "📤";
    } else if (tabName === "won") {
      const statuses = getBidStatuses();
      bidIds = Object.keys(statuses).filter(function (id) { return statuses[id] === "won"; });
      emptyMsg = "No won bids yet. Mark bids as won when you receive the award.";
      emptyIcon = "🏆";
    } else if (tabName === "lost") {
      const statuses = getBidStatuses();
      bidIds = Object.keys(statuses).filter(function (id) { return statuses[id] === "lost"; });
      emptyMsg = "No lost bids recorded. Mark bid outcomes to track your win rate.";
      emptyIcon = "📊";
    }

    if (bidIds.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">' + emptyIcon + "</div>" +
          "<h3>" + emptyMsg + "</h3>" +
        "</div>";
      return;
    }

    const matchingBids = bidIds.map(function (id) {
      return BIDS.find(function (b) { return b.id === id; });
    }).filter(Boolean);

    container.innerHTML = matchingBids.map(renderBidCard).join("");

    // Re-attach save listeners
    container.querySelectorAll(".bid-save-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const bidId = btn.getAttribute("data-bid-id");
        if (isBidSaved(bidId)) {
          unsaveBid(bidId);
          showToast("Bid removed", "info");
        } else {
          saveBid(bidId);
          showToast("Bid saved!", "success");
        }
        renderDashboardTab(document.querySelector(".dash-tab.active")?.getAttribute("data-tab") || "saved");
      });
    });
  }

  // ── Initialize ──────────────────────────────────────────────

  function init() {
    // Feed page — load live bids from SAM.gov
    const feedEl = document.getElementById("bidFeed");
    if (feedEl) {
      loadURLParams();

      // Start live API fetch (async — shows spinner then renders)
      loadAllBids();

      // Listen for filter changes
      document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(function (cb) {
        cb.addEventListener("change", applyFilters);
      });

      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", function () {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(applyFilters, 250);
        });
      }

      setupFilterToggle();
      setupClearFilters();
    }

    // Dashboard page
    setupDashboard();

    // Auth
    setupAuth();
  }

  // ── Expose API ──────────────────────────────────────────────

  window.BuildBids = {
    bids: BIDS,
    getBidById: function (id) { return BIDS.find(function (b) { return b.id === id; }); },
    saveBid: saveBid,
    unsaveBid: unsaveBid,
    isBidSaved: isBidSaved,
    markApplied: markApplied,
    isApplied: isApplied,
    setBidStatus: setBidStatus,
    getBidStatus: getBidStatus,
    getSavedBids: getSavedBids,
    getAppliedBids: getAppliedBids,
    showToast: showToast,
    daysUntilDeadline: daysUntilDeadline,
    formatDeadline: formatDeadline,
    fitScoreColor: fitScoreColor,
    fitScoreLabel: fitScoreLabel,
  };

  // Run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
