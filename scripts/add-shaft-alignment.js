// One-shot, idempotent: wire the new "Precision Shaft Alignment" service into
// the already-built pages without rebuilding them (the committed HTML carries
// manual post-build copy edits a full rebuild would revert — see commit
// 1d44e1e). Templates + configs are patched separately; this only touches the
// generated HTML + sitemap.
//
//   1. Nav "Services" dropdown — every branch page (services/ prefix) and every
//      service page (no prefix), inserted after Commercial Refrigeration.
//   2. Footer "Services" list on service pages, inserted after Building Controls.
//   3. Charlotte homepage capability card, inserted after Commercial Refrigeration.
//   4. sitemap.xml entry.
//
// Run:  node scripts/add-shaft-alignment.js

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const BRANCH_PAGES = ["index.html", "charlotte.html", "greenville.html", "raleigh-durham.html", "virginia-beach.html"];
const SERVICE_PAGES = ["hvac", "building-controls", "commercial-refrigeration", "shaft-alignment", "planned-maintenance", "emergency", "project-support"]
  .map(s => path.join("services", s + ".html"));

function patch(rel, transforms) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { console.warn("  · not found: " + rel); return; }
  let html = fs.readFileSync(file, "utf8");
  const orig = html;
  for (const fn of transforms) html = fn(html);
  if (html === orig) { console.log("  · " + rel + " (already current)"); return; }
  fs.writeFileSync(file, html);
  console.log("  ✓ " + rel);
}

// --- nav dropdown (branch pages: services/ prefix) ---
const navBranch = h => h.includes('href="services/shaft-alignment.html"') ? h : h.replace(
  '<a class="site-nav__dropdown-link" href="services/commercial-refrigeration.html">Commercial Refrigeration</a>',
  '<a class="site-nav__dropdown-link" href="services/commercial-refrigeration.html">Commercial Refrigeration</a>\n            <a class="site-nav__dropdown-link" href="services/shaft-alignment.html">Precision Shaft Alignment</a>'
);

// --- nav dropdown (service pages: no prefix) ---
const navService = h => /href="shaft-alignment\.html">Precision Shaft Alignment<\/a>\s*$/m.test(h) || h.includes('dropdown-link" href="shaft-alignment.html"') ? h : h.replace(
  '<a class="site-nav__dropdown-link" href="commercial-refrigeration.html">Commercial Refrigeration</a>',
  '<a class="site-nav__dropdown-link" href="commercial-refrigeration.html">Commercial Refrigeration</a>\n            <a class="site-nav__dropdown-link" href="shaft-alignment.html">Precision Shaft Alignment</a>'
);

// --- footer Services list (service pages) ---
const footerService = h => h.includes('<li><a href="shaft-alignment.html">') ? h : h.replace(
  '<li><a href="building-controls.html">Building Controls</a></li>',
  '<li><a href="building-controls.html">Building Controls</a></li>\n            <li><a href="shaft-alignment.html">Precision Shaft Alignment</a></li>'
);

// --- Charlotte homepage capability card (after refrigeration) ---
const charlotteCard = h => h.includes('id="service-alignment"') ? h : h.replace(
  '          <article class="capability" id="service-planned">',
  `          <article class="capability" id="service-alignment">
            <span class="capability__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg>
            </span>
            <h4 class="capability__title">Precision Shaft Alignment</h4>
            <p class="capability__body">Laser shaft alignment for motors, pumps, fans, compressors, and gearboxes — cutting vibration and extending bearing and seal life on rotating equipment.</p>
          </article>

          <article class="capability" id="service-planned">`
);

// --- sitemap ---
const sitemap = h => h.includes("services/shaft-alignment.html") ? h : h.replace(
  /(\s*)(<url>\s*<loc>https:\/\/strmechanical\.com\/services\/planned-maintenance\.html<\/loc>)/,
  `$1<url>
    <loc>https://strmechanical.com/services/shaft-alignment.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>$1$2`
);

console.log("Nav dropdown — branch pages:");
for (const p of BRANCH_PAGES) patch(p, [navBranch]);

console.log("Nav + footer — service pages:");
for (const p of SERVICE_PAGES) patch(p, [navService, footerService]);

console.log("Charlotte capability card:");
patch("charlotte.html", [charlotteCard]);

console.log("Sitemap:");
patch("sitemap.xml", [sitemap]);
