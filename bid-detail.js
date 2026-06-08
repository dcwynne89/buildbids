/* ============================================================
   BuildBids — bid-detail.js
   Powers the single bid detail page (bid.html)
   Reads ?id=bid-001 from URL
   ============================================================ */

(function () {
  "use strict";

  // ── Wait for BuildBids API ──────────────────────────────────

  function waitForBuildBids(cb) {
    if (window.BuildBids) { cb(); return; }
    let attempts = 0;
    const interval = setInterval(function () {
      attempts++;
      if (window.BuildBids || attempts > 100) {
        clearInterval(interval);
        if (window.BuildBids) cb();
      }
    }, 50);
  }

  // ── Main ────────────────────────────────────────────────────

  function init() {
    const params = new URLSearchParams(window.location.search);
    const bidId = params.get("id");

    const container = document.getElementById("bidDetail");
    if (!container) return;

    if (!bidId) {
      container.innerHTML = renderNotFound("No bid ID specified.");
      return;
    }

    const bid = window.BuildBids.getBidById(bidId);
    if (!bid) {
      container.innerHTML = renderNotFound('Bid "' + bidId + '" not found.');
      return;
    }

    // Set page title
    document.title = bid.title + " — BuildBids";

    // Render the full detail
    container.innerHTML = renderBidDetail(bid);

    // Attach interactivity
    attachActions(bid);

    // Render related bids
    renderRelatedBids(bid);
  }

  // ── Not Found ───────────────────────────────────────────────

  function renderNotFound(msg) {
    return (
      '<div class="empty-state" style="margin-top:60px">' +
        '<div class="empty-icon">🔍</div>' +
        "<h3>" + msg + "</h3>" +
        '<p><a href="index.html" style="color:#6C63FF">← Back to Bid Feed</a></p>' +
      "</div>"
    );
  }

  // ── Deadline Helpers ────────────────────────────────────────

  function deadlineCountdown(dateStr) {
    const days = window.BuildBids.daysUntilDeadline(dateStr);
    if (days < 0) return '<span class="countdown countdown-expired">Deadline passed (' + Math.abs(days) + " days ago)</span>";
    if (days === 0) return '<span class="countdown countdown-urgent">Due TODAY</span>';
    if (days === 1) return '<span class="countdown countdown-urgent">Due TOMORROW</span>';
    if (days <= 3) return '<span class="countdown countdown-urgent">' + days + " days left</span>";
    if (days <= 7) return '<span class="countdown countdown-warning">' + days + " days left</span>";
    return '<span class="countdown countdown-ok">' + days + " days left</span>";
  }

  // ── Render Bid Detail ───────────────────────────────────────

  function renderBidDetail(bid) {
    const BB = window.BuildBids;
    const score = bid.summary.fitScore;
    const scoreColor = BB.fitScoreColor(score);
    const scoreWidth = (score / 10) * 100;
    const saved = BB.isBidSaved(bid.id);
    const applied = BB.isApplied(bid.id);
    const bidStatus = BB.getBidStatus(bid.id);
    const days = BB.daysUntilDeadline(bid.deadlineDate);

    let statusBadge = "";
    if (days < 0) {
      statusBadge = '<span class="detail-status detail-status-closed">Closed</span>';
    } else if (days <= 7) {
      statusBadge = '<span class="detail-status detail-status-urgent">Closing Soon</span>';
    } else {
      statusBadge = '<span class="detail-status detail-status-open">Open</span>';
    }

    // Trades
    let tradesHTML = "";
    bid.trades.forEach(function (t) {
      tradesHTML += '<span class="bid-tag">' + t.replace(/-/g, " ") + "</span>";
    });

    // Key dates timeline
    let datesHTML = "";
    bid.summary.keyDates.forEach(function (d, i) {
      datesHTML +=
        '<div class="timeline-item">' +
          '<div class="timeline-dot"></div>' +
          '<div class="timeline-content">' + d + "</div>" +
        "</div>";
    });

    // Requirements checklist
    let reqsHTML = "";
    bid.summary.requirements.forEach(function (r) {
      reqsHTML +=
        '<label class="req-item">' +
          '<input type="checkbox" class="req-check">' +
          "<span>" + r + "</span>" +
        "</label>";
    });

    return (
      // ── Header ──────────────────────────────────────────
      '<div class="detail-header">' +
        '<div class="detail-header-top">' +
          '<span class="bid-agency">' + bid.agency + "</span>" +
          statusBadge +
        "</div>" +
        '<h1 class="detail-title">' + bid.title + "</h1>" +
        '<div class="detail-meta">' +
          '<span>💰 ' + bid.estimatedValue + "</span>" +
          '<span>📍 ' + bid.location.city + ", " + bid.location.county + " County, " + bid.state + "</span>" +
          "<span>📅 Due: " + BB.formatDeadline(bid.deadlineDate) + "</span>" +
        "</div>" +
        '<div class="detail-deadline">' +
          deadlineCountdown(bid.deadlineDate) +
        "</div>" +
        '<div class="detail-tags">' + tradesHTML + "</div>" +
        (bid.bondRequired ?
          '<div class="detail-bond">🔒 Bond Required: $' + bid.bondAmount.toLocaleString() + "</div>" : "") +
      "</div>" +

      // ── Action Buttons ──────────────────────────────────
      '<div class="detail-actions">' +
        '<button class="action-btn action-save ' + (saved ? "action-active" : "") + '" id="actionSave">' +
          (saved ? "★ Saved" : "☆ Save Bid") +
        "</button>" +
        '<button class="action-btn action-applied ' + (applied ? "action-active" : "") + '" id="actionApplied">' +
          (applied ? "✓ Applied" : "📤 Mark as Applied") +
        "</button>" +
        '<button class="action-btn action-share" id="actionShare">🔗 Share</button>' +
        (bidStatus === "won" ? '<span class="bid-outcome bid-outcome-won">🏆 Won</span>' : "") +
        (bidStatus === "lost" ? '<span class="bid-outcome bid-outcome-lost">✗ Lost</span>' : "") +
      "</div>" +

      // ── AI Summary Card ─────────────────────────────────
      '<div class="summary-card">' +
        '<div class="summary-header">' +
          '<span class="summary-badge">✨ AI Summary</span>' +
        "</div>" +

        // Plain English
        '<div class="summary-section">' +
          '<h3 class="summary-section-title">📝 Plain English Summary</h3>' +
          '<p class="summary-text">' + bid.summary.plainEnglish + "</p>" +
        "</div>" +

        // Key Dates
        '<div class="summary-section">' +
          '<h3 class="summary-section-title">📅 Key Dates</h3>' +
          '<div class="timeline">' + datesHTML + "</div>" +
        "</div>" +

        // Requirements
        '<div class="summary-section">' +
          '<h3 class="summary-section-title">✅ Requirements</h3>' +
          '<div class="requirements-list">' + reqsHTML + "</div>" +
        "</div>" +

        // Scope
        '<div class="summary-section">' +
          '<h3 class="summary-section-title">📐 Scope of Work</h3>' +
          '<p class="summary-text">' + bid.summary.scope + "</p>" +
        "</div>" +

        // Fit Score
        '<div class="summary-section">' +
          '<h3 class="summary-section-title">🎯 Fit Score</h3>' +
          '<div class="detail-fitscore">' +
            '<div class="fitscore-number" style="color:' + scoreColor + '">' + score + '<span class="fitscore-of">/10</span></div>' +
            '<span class="fitscore-label" style="color:' + scoreColor + '">' + BB.fitScoreLabel(score) + "</span>" +
            '<div class="fitscore-bar fitscore-bar-lg"><div class="fitscore-fill" style="width:' + scoreWidth + "%;background:" + scoreColor + '"></div></div>' +
          "</div>" +
        "</div>" +
      "</div>" +

      // ── Source Link ─────────────────────────────────────
      '<div class="source-link-card">' +
        '<a href="' + bid.sourceUrl + '" target="_blank" rel="noopener" class="source-link">' +
          "View Original Posting →" +
        "</a>" +
        '<span class="source-url">' + bid.sourceUrl + "</span>" +
      "</div>" +

      // ── Outcome Buttons ─────────────────────────────────
      '<div class="outcome-section">' +
        '<h3 class="summary-section-title">📊 Bid Outcome</h3>' +
        '<div class="outcome-btns">' +
          '<button class="outcome-btn outcome-won ' + (bidStatus === "won" ? "active" : "") + '" id="outcomeWon">🏆 Won</button>' +
          '<button class="outcome-btn outcome-lost ' + (bidStatus === "lost" ? "active" : "") + '" id="outcomeLost">✗ Lost</button>' +
        "</div>" +
      "</div>" +

      // ── Related Bids ────────────────────────────────────
      '<div class="related-section" id="relatedBids"></div>'
    );
  }

  // ── Attach Actions ──────────────────────────────────────────

  function attachActions(bid) {
    const BB = window.BuildBids;

    // Save
    const saveBtn = document.getElementById("actionSave");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        if (BB.isBidSaved(bid.id)) {
          BB.unsaveBid(bid.id);
          saveBtn.classList.remove("action-active");
          saveBtn.textContent = "☆ Save Bid";
          BB.showToast("Bid removed from saved", "info");
        } else {
          BB.saveBid(bid.id);
          saveBtn.classList.add("action-active");
          saveBtn.textContent = "★ Saved";
          BB.showToast("Bid saved! ★", "success");
        }
      });
    }

    // Applied
    const appliedBtn = document.getElementById("actionApplied");
    if (appliedBtn) {
      appliedBtn.addEventListener("click", function () {
        BB.markApplied(bid.id);
        appliedBtn.classList.add("action-active");
        appliedBtn.textContent = "✓ Applied";
        BB.showToast("Marked as applied ✓", "success");
      });
    }

    // Share
    const shareBtn = document.getElementById("actionShare");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        const url = window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            BB.showToast("Link copied to clipboard!", "success");
          });
        } else {
          // Fallback
          const input = document.createElement("input");
          input.value = url;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
          BB.showToast("Link copied to clipboard!", "success");
        }
      });
    }

    // Outcome
    const wonBtn = document.getElementById("outcomeWon");
    const lostBtn = document.getElementById("outcomeLost");

    if (wonBtn) {
      wonBtn.addEventListener("click", function () {
        BB.setBidStatus(bid.id, "won");
        wonBtn.classList.add("active");
        if (lostBtn) lostBtn.classList.remove("active");
        BB.showToast("🏆 Congrats! Bid marked as Won", "success");
      });
    }
    if (lostBtn) {
      lostBtn.addEventListener("click", function () {
        BB.setBidStatus(bid.id, "lost");
        lostBtn.classList.add("active");
        if (wonBtn) wonBtn.classList.remove("active");
        BB.showToast("Bid marked as Lost", "info");
      });
    }

    // Requirements checkboxes — persist to localStorage
    const checkboxes = document.querySelectorAll(".req-check");
    const reqKey = "buildbids_reqs_" + bid.id;
    let savedReqs = {};
    try { savedReqs = JSON.parse(localStorage.getItem(reqKey)) || {}; } catch (e) { /* ignore */ }

    checkboxes.forEach(function (cb, i) {
      if (savedReqs[i]) cb.checked = true;
      cb.addEventListener("change", function () {
        savedReqs[i] = cb.checked;
        localStorage.setItem(reqKey, JSON.stringify(savedReqs));
      });
    });
  }

  // ── Related Bids ────────────────────────────────────────────

  function renderRelatedBids(bid) {
    const container = document.getElementById("relatedBids");
    if (!container) return;

    const BB = window.BuildBids;
    const allBids = BB.bids;

    // Find bids in same trade or state, excluding current
    const related = allBids.filter(function (b) {
      if (b.id === bid.id) return false;
      const sameTrade = b.trades.some(function (t) { return bid.trades.includes(t); });
      const sameState = b.stateCode === bid.stateCode;
      return sameTrade || sameState;
    }).slice(0, 3);

    if (related.length === 0) return;

    let cardsHTML = "";
    related.forEach(function (b) {
      const days = BB.daysUntilDeadline(b.deadlineDate);
      let deadlineClass = "";
      if (days <= 3) deadlineClass = "deadline-urgent";
      else if (days <= 7) deadlineClass = "deadline-warning";

      cardsHTML +=
        '<a href="bid.html?id=' + b.id + '" class="related-card">' +
          '<span class="bid-agency">' + b.agency + "</span>" +
          '<span class="related-title">' + b.title + "</span>" +
          '<span class="related-meta">' +
            "💰 " + b.estimatedValue +
            ' <span class="' + deadlineClass + '">📅 ' + BB.formatDeadline(b.deadlineDate) + "</span>" +
          "</span>" +
        "</a>";
    });

    container.innerHTML =
      '<h3 class="summary-section-title">🔗 Related Bids</h3>' +
      '<div class="related-grid">' + cardsHTML + "</div>";
  }

  // ── Boot ────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { waitForBuildBids(init); });
  } else {
    waitForBuildBids(init);
  }
})();
