// Crawl a LOCAL Next.js server for every path in a sitemap and record the
// SEO-relevant parts of each page.  node crawl.js <sitemap.xml> <outFile.json> [base=http://localhost:3100]
const fs = require("fs");
const [SITEMAP, OUT, BASE = "http://localhost:3100"] = process.argv.slice(2);
const SITE = "https://www.xrealty.ae";
const paths = [...fs.readFileSync(SITEMAP, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}="([^"]*)"`)); return m ? decode(m[1]) : null; };
const text = (html) => decode(html.replace(/<!--.*?-->/gs, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

function extract(html) {
  const head = html.split("</head>")[0];
  const metas = [...head.matchAll(/<meta [^>]+>/g)].map((m) => m[0]);
  const meta = (n) => attr(metas.find((t) => attr(t, "name") === n || attr(t, "property") === n) || "", "content");
  const links = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => decode(m[1]))
    .filter((h) => h.startsWith("/") || h.startsWith(SITE)).map((h) => h.replace(SITE, ""));
  return {
    title: text((head.match(/<title[^>]*>(.*?)<\/title>/s) || [])[1] || ""),
    description: meta("description"),
    robots: meta("robots"),
    ogUrl: meta("og:url"),
    canonical: attr((head.match(/<link [^>]*rel="canonical"[^>]*>/) || [""])[0], "href"),
    h1: [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)].map((m) => text(m[1])),
    links: [...new Set(links)].sort(),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
      .map((m) => { try { return JSON.parse(m[1]); } catch { return m[1]; } }),
  };
}

(async () => {
  const out = {};
  let done = 0;
  const work = paths.map((p) => async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(BASE + p, { redirect: "manual" });
        const html = await res.text();
        out[p] = { status: res.status, location: res.headers.get("location"), ...(res.status === 200 ? extract(html) : {}) };
        break;
      } catch (e) { out[p] = { error: e.message }; }
    }
    if (++done % 100 === 0) console.error(`${done}/${paths.length}`);
  });
  for (let i = 0; i < work.length; i += 5) await Promise.all(work.slice(i, i + 5).map((f) => f()));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const statuses = {};
  for (const v of Object.values(out)) statuses[v.status || "error"] = (statuses[v.status || "error"] || 0) + 1;
  console.log(`crawled ${paths.length} -> ${OUT}`, statuses);
})();
