/* ============================================================
   SAM.gov Proxy — Netlify Serverless Function
   Fetches live government bid opportunities from SAM.gov API
   and transforms them into BuildBids format.

   Environment variable required:
     SAM_API_KEY — Free API key from https://sam.gov/content/entity-registration
   ============================================================ */

const TRADE_NAICS_MAP = {
  "cleaning":              "561720",
  "electrical":            "238210",
  "plumbing":              "238220",
  "hvac":                  "238220",
  "painting":              "238320",
  "general-construction":  "236220",
  "landscaping":           "561730",
  "roofing":               "238160",
};

// Reverse map: NAICS → trade tag(s)
const NAICS_TRADE_MAP = {
  "561720": ["cleaning"],
  "238210": ["electrical"],
  "238220": ["plumbing", "hvac"],
  "238320": ["painting"],
  "236220": ["general-construction"],
  "561730": ["landscaping"],
  "238160": ["roofing"],
  "236210": ["general-construction"],
  "236118": ["general-construction"],
  "238910": ["general-construction"],
  "238290": ["general-construction"],
  "238110": ["general-construction"],
  "561210": ["cleaning"],
  "562111": ["cleaning"],
  "562910": ["cleaning"],
};

function guessValueBracket(title, description) {
  const text = ((title || "") + " " + (description || "")).toLowerCase();
  if (text.includes("idiq") || text.includes("indefinite") || text.includes("multiple award"))
    return { display: "$500K–$1M+", bracket: "500k-1m" };
  if (text.includes("minor") || text.includes("small") || text.includes("repair"))
    return { display: "$25K–$50K", bracket: "25k-50k" };
  if (text.includes("renovation") || text.includes("remodel") || text.includes("replace"))
    return { display: "$100K–$250K", bracket: "100k-250k" };
  if (text.includes("construction") || text.includes("build"))
    return { display: "$250K–$500K", bracket: "250k-500k" };
  return { display: "$50K–$100K", bracket: "50k-100k" };
}

function guessTradesFromText(title, naics, description) {
  const text = ((title || "") + " " + (description || "")).toLowerCase();
  // Check NAICS first
  if (naics && NAICS_TRADE_MAP[naics]) return NAICS_TRADE_MAP[naics];
  // Keyword fallback
  if (text.includes("janitor") || text.includes("custod") || text.includes("clean")) return ["cleaning"];
  if (text.includes("electric") || text.includes("wiring") || text.includes("generator")) return ["electrical"];
  if (text.includes("plumb") || text.includes("water line") || text.includes("pipe")) return ["plumbing"];
  if (text.includes("hvac") || text.includes("heating") || text.includes("air condition") || text.includes("boiler")) return ["hvac"];
  if (text.includes("paint") || text.includes("coating")) return ["painting"];
  if (text.includes("landscap") || text.includes("grounds") || text.includes("mowing")) return ["landscaping"];
  if (text.includes("roof")) return ["roofing"];
  return ["general-construction"];
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str || "";
  return str.substring(0, maxLen - 3) + "...";
}

function stateCodeToName(code) {
  const map = {
    AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
    CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
    HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
    KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
    MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
    MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
    NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
    OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
    SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
    VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
    DC:"District of Columbia",
  };
  return map[code] || code || "United States";
}

function transformOpportunity(opp, index) {
  const pop = opp.placeOfPerformance || {};
  const stateCode = (pop.state && pop.state.code) || "";
  const city = (pop.city && pop.city.name) || "";
  const county = (pop.county && pop.county.name) || "";

  const desc = stripHtml(opp.description || "");
  const trades = guessTradesFromText(opp.title, opp.naicsCode, desc);
  const val = guessValueBracket(opp.title, desc);

  const deadlineRaw = opp.responseDeadLine || opp.archiveDate || "";
  const deadlineDate = deadlineRaw ? deadlineRaw.substring(0, 10) : "";
  const publishRaw = opp.postedDate || "";
  const publishDate = publishRaw ? publishRaw.substring(0, 10) : "";

  const plainEnglish = truncate(desc, 400) ||
    "Federal contracting opportunity posted on SAM.gov. Review the full solicitation documents for detailed scope, requirements, and submission instructions.";

  const agency = opp.department
    ? (opp.subTier ? opp.subTier + " (" + opp.department + ")" : opp.department)
    : (opp.office || "Federal Government");

  // Build key dates
  const keyDates = [];
  if (deadlineDate) keyDates.push("Response Due: " + deadlineDate);
  if (opp.archiveDate) keyDates.push("Archive Date: " + opp.archiveDate.substring(0, 10));
  if (publishDate) keyDates.push("Posted: " + publishDate);

  // Build requirements from set-aside and type info
  const requirements = ["Active SAM.gov registration required"];
  if (opp.setAsideDescription) requirements.push("Set-Aside: " + opp.setAsideDescription);
  if (opp.naicsCode) requirements.push("NAICS Code: " + opp.naicsCode);
  requirements.push("Review full solicitation for bonding/insurance requirements");
  if (stateCode) requirements.push("Work location: " + (city ? city + ", " : "") + stateCode);

  // Fit score based on how much info is available
  let fitScore = 6;
  if (desc.length > 200) fitScore++;
  if (opp.setAsideDescription && opp.setAsideDescription.toLowerCase().includes("small")) fitScore++;
  if (stateCode === "OR" || stateCode === "WA" || stateCode === "CA") fitScore++;
  if (fitScore > 10) fitScore = 10;

  return {
    id: "sam-" + (opp.noticeId || index),
    title: opp.title || "Untitled Opportunity",
    agency: agency,
    state: stateCodeToName(stateCode),
    stateCode: stateCode || "US",
    location: {
      city: city,
      county: county,
      state: stateCodeToName(stateCode),
    },
    categories: trades,
    trades: trades,
    estimatedValue: val.display,
    valueBracket: val.bracket,
    bondRequired: desc.toLowerCase().includes("bond") || desc.toLowerCase().includes("surety"),
    bondAmount: 0,
    deadlineDate: deadlineDate,
    publishDate: publishDate,
    sourceUrl: opp.uiLink || ("https://sam.gov/opp/" + (opp.noticeId || "") + "/view"),
    status: "open",
    noticeId: opp.noticeId || "",
    setAside: opp.setAsideDescription || "",
    naicsCode: opp.naicsCode || "",
    solicitationNumber: opp.solicitationNumber || "",
    summary: {
      plainEnglish: plainEnglish,
      keyDates: keyDates,
      requirements: requirements,
      scope: truncate(desc, 250) || "See full solicitation on SAM.gov for detailed scope of work.",
      fitScore: fitScore,
    },
  };
}

exports.handler = async function (event) {
  const API_KEY = process.env.SAM_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "SAM_API_KEY not configured", bids: [] }),
    };
  }

  const params = event.queryStringParameters || {};
  const keyword    = params.keyword || "";
  const naics      = params.naics || "";
  const state      = params.state || "";
  const limit      = Math.min(parseInt(params.limit) || 25, 100);
  const offset     = parseInt(params.offset) || 0;
  const ptype      = params.ptype || "o,p,k";  // solicitations, presolicitations, combined

  // Build SAM.gov API URL
  const baseUrl = "https://api.sam.gov/opportunities/v2/search";
  const searchParams = new URLSearchParams();
  searchParams.set("api_key", API_KEY);
  searchParams.set("limit", limit.toString());
  searchParams.set("offset", offset.toString());
  searchParams.set("ptype", ptype);
  searchParams.set("status", "active");

  if (keyword) searchParams.set("keyword", keyword);
  if (naics) searchParams.set("naicsCode", naics);
  if (state) searchParams.set("state", state);

  // Default: posted in last 90 days
  const postedFrom = new Date();
  postedFrom.setDate(postedFrom.getDate() - 90);
  const fromStr = (postedFrom.getMonth() + 1).toString().padStart(2, "0") + "/" +
                  postedFrom.getDate().toString().padStart(2, "0") + "/" +
                  postedFrom.getFullYear();
  searchParams.set("postedFrom", fromStr);

  const url = baseUrl + "?" + searchParams.toString();

  try {
    const resp = await fetch(url);

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        statusCode: resp.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "SAM.gov API error: " + resp.status,
          detail: errText.substring(0, 500),
          bids: [],
        }),
      };
    }

    const data = await resp.json();
    const opportunities = data.opportunitiesData || [];
    const bids = opportunities.map(transformOpportunity);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // cache 1 hour
      },
      body: JSON.stringify({
        bids: bids,
        total: data.totalRecords || bids.length,
        offset: offset,
        limit: limit,
        source: "sam.gov",
        cached: false,
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to reach SAM.gov API",
        detail: err.message,
        bids: [],
      }),
    };
  }
};
