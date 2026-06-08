/* ============================================================
   BuildBids — app.js
   Main feed + search logic for index.html & dashboard.html
   ============================================================ */

(function () {
  "use strict";

  // ── Realistic Mock Bid Data ──────────────────────────────────

  const BIDS = [
    // ── CLEANING / JANITORIAL (4) ─────────────────────────────
    {
      id: "bid-001",
      title: "Janitorial Services for Washington County Facilities",
      agency: "Washington County, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Hillsboro", county: "Washington", state: "Oregon" },
      categories: ["cleaning", "janitorial"],
      trades: ["cleaning"],
      estimatedValue: "$50K–$100K",
      valueBracket: "50k-100k",
      bondRequired: true,
      bondAmount: 25000,
      deadlineDate: "2026-06-25",
      publishDate: "2026-06-01",
      sourceUrl: "https://www.co.washington.or.us/Purchasing/",
      status: "open",
      summary: {
        plainEnglish: "Washington County is looking for a janitorial company to clean and maintain 12 county-owned buildings including the courthouse, public services building, and community centers. The contract covers nightly cleaning, floor maintenance, window washing, and restroom supply restocking. Previous government cleaning experience preferred but not required.",
        keyDates: ["Bid Due: June 25, 2026", "Pre-Bid Meeting: June 12 (mandatory)", "Contract Start: August 1, 2026"],
        requirements: ["Active business license in Oregon", "General liability insurance ($1M minimum)", "Performance bond (50% of contract value)", "Workers comp coverage", "3 references from similar contracts"],
        scope: "Janitorial services for 12 county facilities, approximately 185,000 sq ft total. Nightly cleaning 5 days/week with periodic deep cleaning.",
        fitScore: 8,
      },
    },
    {
      id: "bid-002",
      title: "Custodial Services — Clackamas County Schools",
      agency: "Clackamas County School District, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Oregon City", county: "Clackamas", state: "Oregon" },
      categories: ["cleaning", "janitorial"],
      trades: ["cleaning"],
      estimatedValue: "$100K–$250K",
      valueBracket: "100k-250k",
      bondRequired: true,
      bondAmount: 50000,
      deadlineDate: "2026-07-10",
      publishDate: "2026-06-05",
      sourceUrl: "https://www.clackamas.us/procurement",
      status: "open",
      summary: {
        plainEnglish: "Clackamas County School District needs a custodial contractor for 8 elementary and 3 middle school buildings during the 2026–2027 academic year. Work includes daily classroom cleaning, gymnasium maintenance, cafeteria sanitation, and seasonal deep-clean during school breaks.",
        keyDates: ["Bid Due: July 10, 2026", "Pre-Bid Walkthrough: June 24, 2026", "Contract Start: September 1, 2026"],
        requirements: ["Oregon business license", "Background checks for all employees", "Liability insurance ($2M)", "EPA-approved green cleaning products", "Experience with K-12 facilities"],
        scope: "Custodial services for 11 school buildings totaling 420,000 sq ft. 5 nights/week during school year, 3 nights/week summer.",
        fitScore: 7,
      },
    },
    {
      id: "bid-003",
      title: "Building Maintenance & Cleaning — King County Courthouse",
      agency: "King County Facilities Management, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Seattle", county: "King", state: "Washington" },
      categories: ["cleaning", "janitorial", "maintenance"],
      trades: ["cleaning"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 100000,
      deadlineDate: "2026-07-18",
      publishDate: "2026-06-10",
      sourceUrl: "https://kingcounty.gov/depts/finance-business-operations/procurement.aspx",
      status: "open",
      summary: {
        plainEnglish: "King County is soliciting bids for comprehensive building maintenance and janitorial services at the King County Courthouse and adjacent Justice Center. This is a high-security facility requiring cleared personnel. Includes day porter services, after-hours deep cleaning, and emergency biohazard cleanup capability.",
        keyDates: ["Bid Due: July 18, 2026", "Mandatory Site Visit: July 2, 2026", "Contract Start: October 1, 2026"],
        requirements: ["Washington State UBI number", "Security clearance for all staff", "24/7 emergency response capability", "Biohazard cleanup certification", "Surety bond ($100K)"],
        scope: "Full janitorial and building maintenance for 2 buildings (~310,000 sq ft). Day porter + nightly crew, 7 days/week.",
        fitScore: 6,
      },
    },
    {
      id: "bid-004",
      title: "Janitorial Contract — Pierce County Admin Buildings",
      agency: "Pierce County, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Tacoma", county: "Pierce", state: "Washington" },
      categories: ["cleaning", "janitorial"],
      trades: ["cleaning"],
      estimatedValue: "$50K–$100K",
      valueBracket: "50k-100k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-06-30",
      publishDate: "2026-06-08",
      sourceUrl: "https://www.piercecountywa.gov/bids",
      status: "open",
      summary: {
        plainEnglish: "Pierce County needs janitorial services for 5 administrative office buildings in downtown Tacoma. Standard nightly cleaning, restroom maintenance, and quarterly carpet cleaning. Straightforward contract suitable for small to mid-size cleaning companies.",
        keyDates: ["Bid Due: June 30, 2026", "Questions Deadline: June 20, 2026", "Contract Start: August 15, 2026"],
        requirements: ["Washington business license", "General liability insurance ($1M)", "Workers comp coverage", "2 references"],
        scope: "Nightly janitorial for 5 office buildings, approximately 95,000 sq ft total. Monday–Friday service.",
        fitScore: 9,
      },
    },

    // ── ELECTRICAL (3) ────────────────────────────────────────
    {
      id: "bid-005",
      title: "Electrical Upgrades — Los Angeles County Fire Stations",
      agency: "LA County Department of Public Works, CA",
      state: "California",
      stateCode: "CA",
      location: { city: "Los Angeles", county: "Los Angeles", state: "California" },
      categories: ["electrical", "construction"],
      trades: ["electrical"],
      estimatedValue: "$500K–$1M",
      valueBracket: "500k-1m",
      bondRequired: true,
      bondAmount: 250000,
      deadlineDate: "2026-07-22",
      publishDate: "2026-06-15",
      sourceUrl: "https://dpw.lacounty.gov/contracts/",
      status: "open",
      summary: {
        plainEnglish: "Los Angeles County is upgrading electrical systems at 14 fire stations across the county. Work includes replacing aging panels, adding EV charging infrastructure, installing emergency backup generators, and bringing all stations to current NEC code. Must hold CA C-10 license.",
        keyDates: ["Bid Due: July 22, 2026", "Pre-Bid Conference: July 1, 2026", "Project Duration: 18 months"],
        requirements: ["CA C-10 Electrical Contractor License", "DIR registration (prevailing wage)", "Payment & performance bonds (100%)", "OSHA 30-hour certification for supervisors", "Experience with municipal fire station work"],
        scope: "Complete electrical panel upgrades, EV charging stations, and generator installs at 14 fire stations. Phased approach, 2–3 stations at a time.",
        fitScore: 7,
      },
    },
    {
      id: "bid-006",
      title: "LED Lighting Retrofit — Harris County Office Complex",
      agency: "Harris County Purchasing, TX",
      state: "Texas",
      stateCode: "TX",
      location: { city: "Houston", county: "Harris", state: "Texas" },
      categories: ["electrical", "energy"],
      trades: ["electrical"],
      estimatedValue: "$100K–$250K",
      valueBracket: "100k-250k",
      bondRequired: true,
      bondAmount: 50000,
      deadlineDate: "2026-07-08",
      publishDate: "2026-06-12",
      sourceUrl: "https://www.harriscountytx.gov/purchasing",
      status: "open",
      summary: {
        plainEnglish: "Harris County wants to replace all fluorescent lighting with LED fixtures in a 6-building office complex in downtown Houston. Project includes fixture removal, new LED panel installation, dimmer controls, and occupancy sensors. Energy audit and savings verification required post-installation.",
        keyDates: ["Bid Due: July 8, 2026", "Site Visit: June 25, 2026", "Completion Deadline: December 2026"],
        requirements: ["Texas Electrical Contractor License", "Energy Star partnership certification preferred", "Performance bond (50%)", "Detailed project schedule required", "Disposal plan for fluorescent fixtures"],
        scope: "Replace approximately 4,200 fluorescent fixtures with LED alternatives across 6 office buildings (~280,000 sq ft).",
        fitScore: 8,
      },
    },
    {
      id: "bid-007",
      title: "Panel & Wiring Replacement — Sacramento Municipal Utility District",
      agency: "SMUD Facilities, CA",
      state: "California",
      stateCode: "CA",
      location: { city: "Sacramento", county: "Sacramento", state: "California" },
      categories: ["electrical"],
      trades: ["electrical"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 125000,
      deadlineDate: "2026-08-05",
      publishDate: "2026-06-20",
      sourceUrl: "https://www.smud.org/en/Corporate/Doing-business-with-SMUD",
      status: "open",
      summary: {
        plainEnglish: "SMUD needs to replace outdated electrical panels and aluminum wiring in 3 customer service centers. Work involves full panel changeouts, copper rewiring, arc-fault breaker installation, and code compliance upgrades. Must be done during off-hours to avoid service interruptions.",
        keyDates: ["Bid Due: August 5, 2026", "Pre-Bid Meeting: July 15, 2026", "Project Duration: 6 months"],
        requirements: ["CA C-10 License", "Experience with occupied building electrical work", "After-hours work capability", "Asbestos awareness training", "Performance bond (100%)"],
        scope: "Panel replacements and complete rewiring for 3 facilities, totaling approximately 45,000 sq ft. Night and weekend work required.",
        fitScore: 6,
      },
    },

    // ── PLUMBING (3) ──────────────────────────────────────────
    {
      id: "bid-008",
      title: "Plumbing Repairs & Fixture Replacement — Snohomish County Parks",
      agency: "Snohomish County Parks & Recreation, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Everett", county: "Snohomish", state: "Washington" },
      categories: ["plumbing"],
      trades: ["plumbing"],
      estimatedValue: "$25K–$50K",
      valueBracket: "25k-50k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-06-28",
      publishDate: "2026-06-08",
      sourceUrl: "https://snohomishcountywa.gov/2092/Bid-Opportunities",
      status: "open",
      summary: {
        plainEnglish: "Snohomish County Parks needs plumbing repairs and ADA-compliant fixture replacements at 6 park restroom buildings. Work includes replacing old toilets and sinks, fixing leaks, upgrading water heaters, and winterizing irrigation backflow preventers. Good small project for a local plumber.",
        keyDates: ["Bid Due: June 28, 2026", "Site Visits: Available June 16–20", "Completion: August 31, 2026"],
        requirements: ["WA Plumbing Contractor License", "Liability insurance ($500K)", "ADA compliance knowledge", "2 references"],
        scope: "Fixture replacements and pipe repairs at 6 park restroom facilities across Snohomish County.",
        fitScore: 9,
      },
    },
    {
      id: "bid-009",
      title: "Water Line Replacement — City of Clearwater",
      agency: "City of Clearwater Public Works, FL",
      state: "Florida",
      stateCode: "FL",
      location: { city: "Clearwater", county: "Pinellas", state: "Florida" },
      categories: ["plumbing", "construction"],
      trades: ["plumbing"],
      estimatedValue: "$500K–$1M",
      valueBracket: "500k-1m",
      bondRequired: true,
      bondAmount: 250000,
      deadlineDate: "2026-08-12",
      publishDate: "2026-06-22",
      sourceUrl: "https://www.myclearwater.com/bids",
      status: "open",
      summary: {
        plainEnglish: "The City of Clearwater is replacing aging galvanized water mains along Gulf-to-Bay Boulevard. The project covers roughly 2.5 miles of 8-inch ductile iron pipe, service lateral connections for 180 properties, and road restoration. Experienced underground utility contractors preferred.",
        keyDates: ["Bid Due: August 12, 2026", "Pre-Bid Meeting: July 22, 2026", "Project Duration: 12 months"],
        requirements: ["FL Certified Plumbing Contractor or Underground Utility License", "Performance & payment bonds (100%)", "MOT (Maintenance of Traffic) plan", "Stormwater pollution prevention plan", "5 years municipal water main experience"],
        scope: "Replace 2.5 miles of water main, reconnect 180 service laterals, and restore road surfaces along Gulf-to-Bay Blvd.",
        fitScore: 5,
      },
    },
    {
      id: "bid-010",
      title: "Backflow Prevention Device Installation — Clark County",
      agency: "Clark County Public Works, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Vancouver", county: "Clark", state: "Washington" },
      categories: ["plumbing"],
      trades: ["plumbing"],
      estimatedValue: "$25K–$50K",
      valueBracket: "25k-50k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-07-15",
      publishDate: "2026-06-10",
      sourceUrl: "https://clark.wa.gov/purchasing",
      status: "open",
      summary: {
        plainEnglish: "Clark County needs installation and testing of backflow prevention devices at 22 county-owned facilities. This includes reduced pressure zone (RPZ) assemblies, double-check valves, and annual testing/certification. Ideal for a licensed backflow specialist or plumbing contractor.",
        keyDates: ["Bid Due: July 15, 2026", "Questions Due: July 1, 2026", "Completion: September 30, 2026"],
        requirements: ["WA Plumber License", "Backflow Assembly Tester certification (BAT)", "Liability insurance ($1M)", "ASSE 5110 certification preferred"],
        scope: "Install 22 new backflow prevention devices and provide initial testing/certification at county facilities.",
        fitScore: 8,
      },
    },

    // ── HVAC (3) ──────────────────────────────────────────────
    {
      id: "bid-011",
      title: "HVAC System Replacement — Multnomah County Library Branches",
      agency: "Multnomah County Facilities, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Portland", county: "Multnomah", state: "Oregon" },
      categories: ["hvac", "mechanical"],
      trades: ["hvac"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 100000,
      deadlineDate: "2026-07-28",
      publishDate: "2026-06-18",
      sourceUrl: "https://multco.us/purchasing/current-solicitations",
      status: "open",
      summary: {
        plainEnglish: "Multnomah County is replacing aging HVAC systems in 4 library branch buildings. Work includes removing old rooftop units, installing high-efficiency heat pump systems, upgrading ductwork, and adding smart thermostats. Buildings must remain operational during construction with temporary HVAC provided.",
        keyDates: ["Bid Due: July 28, 2026", "Pre-Bid Walkthrough: July 10, 2026", "Project Duration: 8 months"],
        requirements: ["Oregon CCB license with HVAC endorsement", "EPA 608 Universal certification", "Performance bond (100%)", "Experience with occupied public buildings", "Temporary HVAC plan required"],
        scope: "Full HVAC replacement for 4 library branches, approximately 48,000 sq ft total. Transition from gas furnace to heat pump.",
        fitScore: 7,
      },
    },
    {
      id: "bid-012",
      title: "Preventive Maintenance Agreement — Tarrant County HVAC",
      agency: "Tarrant County Facilities, TX",
      state: "Texas",
      stateCode: "TX",
      location: { city: "Fort Worth", county: "Tarrant", state: "Texas" },
      categories: ["hvac", "maintenance"],
      trades: ["hvac"],
      estimatedValue: "$100K–$250K",
      valueBracket: "100k-250k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-07-02",
      publishDate: "2026-06-08",
      sourceUrl: "https://www.tarrantcounty.com/en/purchasing.html",
      status: "open",
      summary: {
        plainEnglish: "Tarrant County seeks an HVAC contractor for a 3-year preventive maintenance agreement covering 28 county-owned buildings. Quarterly inspections, filter changes, coil cleaning, refrigerant checks, and on-call emergency repair. Good recurring revenue contract for an established HVAC company.",
        keyDates: ["Bid Due: July 2, 2026", "Q&A Period: June 15–25, 2026", "Contract Start: September 1, 2026"],
        requirements: ["TX HVAC/R Contractor License (TDLR)", "24/7 emergency service capability", "Fleet of at least 3 service vehicles", "EPA 608 certification for all technicians", "Liability insurance ($2M)"],
        scope: "Quarterly preventive maintenance for 28 buildings with on-call emergency repair. 3-year contract with 2 optional renewal years.",
        fitScore: 9,
      },
    },
    {
      id: "bid-013",
      title: "Chiller Plant Overhaul — Marion County Justice Center",
      agency: "Marion County Public Works, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Salem", county: "Marion", state: "Oregon" },
      categories: ["hvac", "mechanical"],
      trades: ["hvac"],
      estimatedValue: "$500K–$1M",
      valueBracket: "500k-1m",
      bondRequired: true,
      bondAmount: 300000,
      deadlineDate: "2026-08-15",
      publishDate: "2026-06-25",
      sourceUrl: "https://www.co.marion.or.us/PW/Pages/bids.aspx",
      status: "open",
      summary: {
        plainEnglish: "Marion County needs a complete chiller plant overhaul at the Justice Center. The existing 20-year-old centrifugal chiller system is at end of life. Project includes demolition of existing equipment, installation of two new 200-ton chillers, cooling tower replacement, and BAS integration. Critical facility — must maintain cooling during transition.",
        keyDates: ["Bid Due: August 15, 2026", "Pre-Bid Meeting: July 25, 2026 (mandatory)", "Project Duration: 10 months"],
        requirements: ["Oregon CCB with HVAC specialty", "Chiller manufacturer authorization (Trane, Carrier, or York)", "Payment & performance bonds (100%)", "Temporary cooling plan for transition period", "BAS/DDC programming experience"],
        scope: "Replace 2 centrifugal chillers (400 tons total), cooling tower, and primary/secondary pumping. Full BAS integration.",
        fitScore: 5,
      },
    },

    // ── PAINTING (2) ──────────────────────────────────────────
    {
      id: "bid-014",
      title: "Interior/Exterior Painting — Alameda County Health Clinics",
      agency: "Alameda County General Services, CA",
      state: "California",
      stateCode: "CA",
      location: { city: "Oakland", county: "Alameda", state: "California" },
      categories: ["painting"],
      trades: ["painting"],
      estimatedValue: "$50K–$100K",
      valueBracket: "50k-100k",
      bondRequired: true,
      bondAmount: 25000,
      deadlineDate: "2026-07-05",
      publishDate: "2026-06-10",
      sourceUrl: "https://www.acgov.org/gsa/purchasing/bid_content/contractopportunities.jsp",
      status: "open",
      summary: {
        plainEnglish: "Alameda County needs interior and exterior painting at 5 public health clinic buildings. Interior work includes halls, waiting rooms, and exam rooms. Exterior includes stucco repair/patch and full repaint. Must use low-VOC paints. Work in occupied clinics — weekend/after-hours scheduling required.",
        keyDates: ["Bid Due: July 5, 2026", "Site Visits: June 20–27, 2026", "Completion: October 31, 2026"],
        requirements: ["CA C-33 Painting Contractor License", "Lead-RRP certification (pre-1978 buildings)", "Low-VOC/Green Seal certified products", "After-hours work capability", "Liability insurance ($1M)"],
        scope: "Interior and exterior painting for 5 clinic buildings. Approximately 45,000 sq ft interior, 22,000 sq ft exterior.",
        fitScore: 8,
      },
    },
    {
      id: "bid-015",
      title: "Exterior Repainting — Lane County Government Buildings",
      agency: "Lane County Facilities, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Eugene", county: "Lane", state: "Oregon" },
      categories: ["painting"],
      trades: ["painting"],
      estimatedValue: "$25K–$50K",
      valueBracket: "25k-50k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-06-20",
      publishDate: "2026-06-01",
      sourceUrl: "https://www.lanecounty.org/government/county_departments/public_works",
      status: "closing-soon",
      summary: {
        plainEnglish: "Lane County needs exterior repainting of 3 government office buildings in downtown Eugene. Work includes power washing, scraping, priming, and 2-coat application. Basic exterior paint job — great opportunity for a smaller painting company looking for government experience.",
        keyDates: ["Bid Due: June 20, 2026", "Contract Start: July 15, 2026", "Completion: September 15, 2026"],
        requirements: ["Oregon CCB license", "Lead-safe work practices (RRP if pre-1978)", "Liability insurance ($500K)", "1 reference from commercial painting project"],
        scope: "Exterior repainting of 3 buildings, approximately 18,000 sq ft of exterior surface. Includes prep, prime, and 2 finish coats.",
        fitScore: 9,
      },
    },

    // ── GENERAL CONSTRUCTION (3) ──────────────────────────────
    {
      id: "bid-016",
      title: "ADA Restroom Renovations — Thurston County Courthouse",
      agency: "Thurston County Facilities, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Olympia", county: "Thurston", state: "Washington" },
      categories: ["general-construction", "renovation"],
      trades: ["general-construction"],
      estimatedValue: "$100K–$250K",
      valueBracket: "100k-250k",
      bondRequired: true,
      bondAmount: 50000,
      deadlineDate: "2026-07-12",
      publishDate: "2026-06-12",
      sourceUrl: "https://www.thurstoncountywa.gov/purchasing",
      status: "open",
      summary: {
        plainEnglish: "Thurston County is renovating 8 restrooms in the historic courthouse to meet ADA compliance standards. Work includes demolition of existing fixtures, widening doorways, installing grab bars, new partitions, accessible fixtures, and tile work. Phased approach to keep building operational.",
        keyDates: ["Bid Due: July 12, 2026", "Pre-Bid Walkthrough: June 28, 2026", "Project Duration: 4 months"],
        requirements: ["WA General Contractor License", "ADA/accessibility experience required", "Historical building renovation experience preferred", "Performance bond (100%)", "Phased construction plan"],
        scope: "Renovate 8 restrooms for ADA compliance in a historic courthouse. Includes demo, framing, tile, plumbing fixtures, and accessories.",
        fitScore: 7,
      },
    },
    {
      id: "bid-017",
      title: "Community Center Construction — City of Jacksonville",
      agency: "City of Jacksonville Public Works, FL",
      state: "Florida",
      stateCode: "FL",
      location: { city: "Jacksonville", county: "Duval", state: "Florida" },
      categories: ["general-construction"],
      trades: ["general-construction"],
      estimatedValue: "$1M+",
      valueBracket: "1m-plus",
      bondRequired: true,
      bondAmount: 500000,
      deadlineDate: "2026-08-20",
      publishDate: "2026-06-20",
      sourceUrl: "https://www.coj.net/departments/procurement",
      status: "open",
      summary: {
        plainEnglish: "The City of Jacksonville is building a new 15,000 sq ft community center in the Northside neighborhood. Ground-up construction including site work, concrete foundations, steel framing, exterior finishes, full MEP, and site amenities (parking lot, landscaping, playground). Major project requiring an experienced GC.",
        keyDates: ["Bid Due: August 20, 2026", "Mandatory Pre-Bid: July 30, 2026", "Project Duration: 14 months"],
        requirements: ["FL Certified General Contractor License", "Payment & performance bonds (100%)", "Minimum 3 projects of similar scope ($1M+)", "Drug-free workplace certification", "MBE/WBE subcontracting plan"],
        scope: "New construction of 15,000 sq ft community center with parking, landscaping, and site amenities. Full scope from site prep to CO.",
        fitScore: 4,
      },
    },
    {
      id: "bid-018",
      title: "Parking Garage Repairs — Bexar County, TX",
      agency: "Bexar County Purchasing, TX",
      state: "Texas",
      stateCode: "TX",
      location: { city: "San Antonio", county: "Bexar", state: "Texas" },
      categories: ["general-construction", "concrete"],
      trades: ["general-construction"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 125000,
      deadlineDate: "2026-07-25",
      publishDate: "2026-06-15",
      sourceUrl: "https://www.bexar.org/purchasing",
      status: "open",
      summary: {
        plainEnglish: "Bexar County needs structural repairs to a 4-level parking garage adjacent to the courthouse. Work includes concrete spall repair, post-tensioning cable repair, expansion joint replacement, waterproof membrane application, and restriping. Garage must remain partially operational during construction.",
        keyDates: ["Bid Due: July 25, 2026", "Pre-Bid Meeting: July 10, 2026", "Project Duration: 6 months"],
        requirements: ["TX General Contractor registration", "Structural concrete repair experience (5 years)", "Post-tensioning contractor certification", "Performance bond (100%)", "Traffic control plan"],
        scope: "Structural repairs to a 250,000 sq ft, 4-level parking garage. Concrete repair, joint replacement, membrane, and restripe.",
        fitScore: 6,
      },
    },

    // ── LANDSCAPING (2) ──────────────────────────────────────
    {
      id: "bid-019",
      title: "Parks & Median Landscape Maintenance — City of Bend",
      agency: "City of Bend Parks & Recreation, OR",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Bend", county: "Deschutes", state: "Oregon" },
      categories: ["landscaping", "maintenance"],
      trades: ["landscaping"],
      estimatedValue: "$50K–$100K",
      valueBracket: "50k-100k",
      bondRequired: false,
      bondAmount: 0,
      deadlineDate: "2026-06-22",
      publishDate: "2026-06-01",
      sourceUrl: "https://www.bendoregon.gov/government/departments/finance/purchasing",
      status: "closing-soon",
      summary: {
        plainEnglish: "City of Bend is looking for a landscaping contractor to maintain 12 city parks and 8 road medians. Work includes mowing, edging, weed control, irrigation system maintenance, seasonal planting, and leaf/debris removal. 2-year contract with option to renew for 2 more years.",
        keyDates: ["Bid Due: June 22, 2026", "Contract Start: July 15, 2026", "Contract Term: 2 years + 2 renewal"],
        requirements: ["Oregon Landscape Contractor License (LCB)", "Pesticide Applicator License", "Liability insurance ($1M)", "Irrigation system experience", "Equipment list required with bid"],
        scope: "Year-round landscape maintenance for 12 parks and 8 road medians. Weekly mowing April–October, monthly November–March.",
        fitScore: 8,
      },
    },
    {
      id: "bid-020",
      title: "Campus Grounds Maintenance — San Bernardino County",
      agency: "San Bernardino County Real Estate Services, CA",
      state: "California",
      stateCode: "CA",
      location: { city: "San Bernardino", county: "San Bernardino", state: "California" },
      categories: ["landscaping", "maintenance"],
      trades: ["landscaping"],
      estimatedValue: "$100K–$250K",
      valueBracket: "100k-250k",
      bondRequired: true,
      bondAmount: 50000,
      deadlineDate: "2026-07-30",
      publishDate: "2026-06-20",
      sourceUrl: "https://cms.sbcounty.gov/purchasing/Home.aspx",
      status: "open",
      summary: {
        plainEnglish: "San Bernardino County needs grounds maintenance for the county government center campus and 6 satellite office locations. Includes turf care, tree trimming, drought-tolerant bed maintenance, irrigation repairs, and hardscape cleaning. Desert climate knowledge important — water efficiency is a key evaluation criterion.",
        keyDates: ["Bid Due: July 30, 2026", "Pre-Bid Walkthrough: July 15, 2026", "Contract Start: October 1, 2026"],
        requirements: ["CA C-27 Landscaping Contractor License", "Qualified Applicator License (QAL)", "Water-efficient landscape experience", "Performance bond (50%)", "Equipment inventory with bid"],
        scope: "Grounds maintenance for 7 county locations (~85 acres total). Year-round service with seasonal adjustments.",
        fitScore: 6,
      },
    },

    // ── ROOFING (2) ───────────────────────────────────────────
    {
      id: "bid-021",
      title: "Roof Replacement — Dallas County Records Building",
      agency: "Dallas County Facilities Management, TX",
      state: "Texas",
      stateCode: "TX",
      location: { city: "Dallas", county: "Dallas", state: "Texas" },
      categories: ["roofing", "construction"],
      trades: ["roofing"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 150000,
      deadlineDate: "2026-07-20",
      publishDate: "2026-06-15",
      sourceUrl: "https://www.dallascounty.org/departments/purchasing/",
      status: "open",
      summary: {
        plainEnglish: "Dallas County is replacing the roof on the 6-story Records Building downtown. Current built-up roof is failing and causing leaks into archive storage areas. New TPO membrane system with tapered insulation for proper drainage. Protection of county records below is the #1 priority during construction.",
        keyDates: ["Bid Due: July 20, 2026", "Mandatory Pre-Bid: July 5, 2026", "Project Duration: 3 months"],
        requirements: ["TX roofing contractor registration", "TPO manufacturer authorization (Carlisle, Firestone, or GAF)", "20-year NDL warranty required", "Performance bond (100%)", "Interior protection plan for records storage"],
        scope: "Complete tear-off and replacement of ~42,000 sq ft built-up roof with TPO membrane system. Includes insulation, flashings, and edge metal.",
        fitScore: 7,
      },
    },
    {
      id: "bid-022",
      title: "Emergency Roof Repairs — Hillsborough County Schools",
      agency: "Hillsborough County Public Schools, FL",
      state: "Florida",
      stateCode: "FL",
      location: { city: "Tampa", county: "Hillsborough", state: "Florida" },
      categories: ["roofing"],
      trades: ["roofing"],
      estimatedValue: "$50K–$100K",
      valueBracket: "50k-100k",
      bondRequired: true,
      bondAmount: 25000,
      deadlineDate: "2026-06-18",
      publishDate: "2026-06-02",
      sourceUrl: "https://www.hillsboroughschools.org/Page/36183",
      status: "closing-soon",
      summary: {
        plainEnglish: "Hillsborough County Schools needs immediate roof repairs at 4 school buildings that sustained damage from recent storms. Work includes patching metal roof panels, sealing penetrations, replacing damaged flashing, and temporary waterproofing for the upcoming hurricane season. Fast turnaround required.",
        keyDates: ["Bid Due: June 18, 2026", "Work Must Begin: Within 5 days of award", "Completion: July 31, 2026"],
        requirements: ["FL Certified Roofing Contractor (CCC)", "Hurricane damage repair experience", "Mobilize within 5 business days", "Liability insurance ($2M)", "Workers comp for all crew"],
        scope: "Emergency roof repairs at 4 K-12 school buildings. Patch, seal, and weatherproof approximately 15,000 sq ft of damaged roofing.",
        fitScore: 7,
      },
    },

    // ── MIXED / RENOVATION (3) ────────────────────────────────
    {
      id: "bid-023",
      title: "Office Tenant Improvement — Oregon State DAS",
      agency: "Oregon Department of Administrative Services",
      state: "Oregon",
      stateCode: "OR",
      location: { city: "Salem", county: "Marion", state: "Oregon" },
      categories: ["general-construction", "renovation", "electrical", "plumbing", "hvac"],
      trades: ["general-construction", "electrical", "plumbing", "hvac"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 125000,
      deadlineDate: "2026-08-01",
      publishDate: "2026-06-22",
      sourceUrl: "https://orpin.oregon.gov/",
      status: "open",
      summary: {
        plainEnglish: "Oregon DAS is renovating 2 floors (3rd and 4th) of the Labor & Industries Building in Salem for new state agency offices. Full tenant improvement including demolition, new partition walls, suspended ceiling, flooring, electrical/data, plumbing for break rooms, and HVAC modifications. Must follow Oregon's COBID requirements.",
        keyDates: ["Bid Due: August 1, 2026", "Pre-Bid: July 14, 2026", "Project Duration: 5 months"],
        requirements: ["Oregon CCB – General Contractor", "COBID certified subcontractor utilization plan", "Prevailing wage (BOLI rates)", "Performance & payment bonds (100%)", "Asbestos abatement plan (pre-1980 building)"],
        scope: "2-floor tenant improvement (~28,000 sq ft). Demo, framing, drywall, ceiling, flooring, MEP rough/finish, and furniture install coordination.",
        fitScore: 6,
      },
    },
    {
      id: "bid-024",
      title: "Public Library Renovation — City of Austin",
      agency: "City of Austin Capital Projects, TX",
      state: "Texas",
      stateCode: "TX",
      location: { city: "Austin", county: "Travis", state: "Texas" },
      categories: ["general-construction", "renovation", "electrical", "hvac", "painting"],
      trades: ["general-construction", "electrical", "hvac", "painting"],
      estimatedValue: "$500K–$1M",
      valueBracket: "500k-1m",
      bondRequired: true,
      bondAmount: 250000,
      deadlineDate: "2026-08-25",
      publishDate: "2026-06-28",
      sourceUrl: "https://www.austintexas.gov/financeonline/vendor_connection/",
      status: "open",
      summary: {
        plainEnglish: "The City of Austin is renovating the Manchaca Road Branch Library. The scope covers interior demolition, new layout with expanded children's area, updated electrical with additional power/data outlets, HVAC upgrades to VRF system, new restrooms, full repaint, and site work for an expanded parking lot.",
        keyDates: ["Bid Due: August 25, 2026", "Pre-Bid Conference: August 5, 2026", "Project Duration: 10 months"],
        requirements: ["TX General Contractor", "Previous public library or community building renovation", "MBE/WBE subcontracting plan (15% goal)", "Payment & performance bonds (100%)", "LEED Silver design compliance"],
        scope: "Full renovation of 12,000 sq ft branch library. Interior build-out, MEP upgrades, exterior painting, and parking lot expansion.",
        fitScore: 5,
      },
    },
    {
      id: "bid-025",
      title: "Fire Station #7 Remodel — City of Lakewood, WA",
      agency: "City of Lakewood Public Works, WA",
      state: "Washington",
      stateCode: "WA",
      location: { city: "Lakewood", county: "Pierce", state: "Washington" },
      categories: ["general-construction", "renovation", "plumbing", "electrical"],
      trades: ["general-construction", "plumbing", "electrical"],
      estimatedValue: "$250K–$500K",
      valueBracket: "250k-500k",
      bondRequired: true,
      bondAmount: 100000,
      deadlineDate: "2026-08-30",
      publishDate: "2026-07-01",
      sourceUrl: "https://cityoflakewood.us/purchasing/",
      status: "open",
      summary: {
        plainEnglish: "The City of Lakewood is remodeling Fire Station #7, built in 1985. Work includes expanding the apparatus bay to accommodate modern trucks, upgrading living quarters, replacing all plumbing, electrical panel upgrade, adding a decontamination room, and seismic bracing. Station must remain operational — phased construction required.",
        keyDates: ["Bid Due: August 30, 2026", "Pre-Bid Walkthrough: August 12, 2026 (mandatory)", "Project Duration: 8 months"],
        requirements: ["WA General Contractor License", "Fire station construction/renovation experience", "Seismic retrofit experience", "Performance bond (100%)", "Phased construction plan maintaining station operations"],
        scope: "Remodel 6,800 sq ft fire station including bay expansion, living quarters upgrade, full MEP renovation, and seismic improvements.",
        fitScore: 7,
      },
    },
  ];

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
        '<a href="bid.html?id=' + bid.id + '" class="bid-card-title">' + bid.title + "</a>" +
        '<div class="bid-tags">' + tagsHTML + "</div>" +
        '<div class="bid-meta">' +
          '<span class="meta-value" title="Estimated Value">💰 ' + bid.estimatedValue + "</span>" +
          '<span class="meta-location" title="Location">📍 ' + bid.location.city + ", " + bid.stateCode + "</span>" +
          '<span class="' + deadlineClass + '" title="Deadline">📅 ' + formatDeadline(bid.deadlineDate) +
            (days >= 0 ? " (" + days + "d)" : " (expired)") +
          "</span>" +
        "</div>" +
        '<div class="bid-fitscore">' +
          '<span class="fitscore-label" style="color:' + scoreColor + '">' + fitScoreLabel(score) + " " + score + "/10</span>" +
          '<div class="fitscore-bar"><div class="fitscore-fill" style="width:' + scoreWidth + "%;background:" + scoreColor + '"></div></div>' +
        "</div>" +
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
    // Feed page
    const feedEl = document.getElementById("bidFeed");
    if (feedEl) {
      loadURLParams();
      applyFilters();

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
