export const runtime = "nodejs";

const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000; // 20 min

const CITY_SLUGS = {
  "Vancouver":        "vancouver",
  "North Vancouver":  "north-vancouver",
  "Burnaby":          "burnaby",
  "Surrey":           "surrey",
  "Richmond":         "richmond",
  "Coquitlam":        "coquitlam",
  "Langley":          "langley",
  "Chilliwack":       "chilliwack",
  "Abbotsford":       "abbotsford",
  "Victoria":         "victoria",
  "Saanich":          "saanich",
  "Nanaimo":          "nanaimo",
  "Courtenay":        "courtenay",
  "Campbell River":   "campbell-river",
  "Kelowna":          "kelowna",
  "West Kelowna":     "west-kelowna",
  "Penticton":        "penticton",
  "Vernon":           "vernon",
  "Kamloops":         "kamloops",
  "Salmon Arm":       "salmon-arm",
  "Prince George":    "prince-george",
  "Quesnel":          "quesnel",
  "Williams Lake":    "williams-lake",
  "Terrace":          "terrace",
  "Prince Rupert":    "prince-rupert",
  "Smithers":         "smithers",
  "Castlegar":        "castlegar",
  "Trail":            "trail",
  "Cranbrook":        "cranbrook",
  "Fort St. John":    "fort-st-john",
};

function parseGasBuddyHtml(html) {
  const stations = [];
  const blocks = html.split(/class="[^"]*GenericStationListItem-module__station___[^"]*"/);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // Station name — anchor with font-weight:700
    const nameMatch = block.match(/font-weight: 700[^>]+>([^<]+)<\/a>/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();

    // Address — convert <br> to comma
    const addrMatch = block.match(/StationDisplay-module__address[^>]+>([\s\S]*?)<\/div>/);
    let address = "";
    if (addrMatch) {
      address = addrMatch[1]
        .replace(/<br\s*\/?>/gi, ", ")
        .replace(/<[^>]+>/g, "")
        .trim();
    }

    // Price — "189.9¢" — skip stations showing "- - -"
    const priceMatch = block.match(/StationDisplayPrice-module__price[^"]*"[^>]*>([\d.]+)¢/);
    if (!priceMatch) continue;
    const priceCents = parseFloat(priceMatch[1]);
    if (!priceCents || priceCents < 100 || priceCents > 500) continue;

    // Reporter username
    const reporterMatch = block.match(/memberLink[^>]+>(?:<img[^>]+>&nbsp;)?([^<]+)<\/a>/);
    const timeMatch = block.match(/postedTime[^>]+>([^<]+)<\/span>/);

    // Brand from logo img alt
    const brandMatch = block.match(/logoImageContainer[^>]+>[\s\S]*?<img alt="([^"]+)"/);

    stations.push({
      name,
      address,
      brand: brandMatch ? brandMatch[1] : "",
      priceCents,
      priceCAD: priceCents / 100,
      reporter: reporterMatch ? reporterMatch[1].trim() : "",
      reportedTime: timeMatch ? timeMatch[1].trim() : "",
    });
  }

  return stations
    .sort((a, b) => a.priceCents - b.priceCents)
    .slice(0, 10);
}

// Try multiple user agents and approaches to get past Cloudflare
async function scrapeGasBuddy(city) {
  const slug = CITY_SLUGS[city] || city.toLowerCase().replace(/[\s.]+/g, "-");
  const url = `https://www.gasbuddy.com/gasprices/british-columbia/${slug}`;

  const attempts = [
    {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-CA,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
    },
    {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-CA,en;q=0.5",
    },
  ];

  for (const headers of attempts) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) continue;
      const html = await res.text();

      if (html.includes("Just a moment") || html.includes("cf-browser-verification")) continue;
      if (!html.includes("GenericStationListItem-module__station___")) continue;

      const stations = parseGasBuddyHtml(html);
      if (!stations.length) continue;

      console.log(`✅ GasBuddy live: ${stations.length} stations for ${city}`);
      return { stations, url, slug, isLive: true };
    } catch (_) {
      continue;
    }
  }

  throw new Error("All GasBuddy scrape attempts blocked");
}

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const d = await res.json();
  return d.choices?.[0]?.message?.content || "";
}

function parseJsonArray(text) {
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const s = clean.indexOf("["), e = clean.lastIndexOf("]");
  if (s === -1 || e === -1) throw new Error("No JSON array");
  return JSON.parse(clean.slice(s, e + 1).replace(/,\s*([}\]])/g, "$1"));
}

async function getGroqFallback(city) {
  const today = new Date().toISOString().split("T")[0];
  const content = await callGroq(
    `Today is ${today}. Gas prices in ${city}, BC are currently around CA$2.00-2.20 per litre in May 2026.

List the 10 cheapest gas stations in ${city}, BC, Canada for regular (87-octane) gas as of today.
Use real station names and real addresses that exist in ${city} BC.
Prices MUST reflect current May 2026 BC pump prices (around 195-215 cents per litre).
Do NOT use old prices from 2024 or before.

Return ONLY a JSON array sorted cheapest first:
[{
  "name": "Costco Gasoline",
  "address": "1675 Versatile Dr, Kamloops, BC",
  "brand": "Costco",
  "priceCents": 189.9,
  "priceCAD": 1.899,
  "tip": "Members only — typically cheapest in city",
  "reportedTime": "estimated May 2026"
}]

priceCents = price in cents (e.g. 203.9 for CA$2.039/L).
Only include stations that genuinely exist in ${city} BC with real addresses.`
  );

  const parsed = parseJsonArray(content);
  return parsed
    .filter(s => s.priceCents && s.priceCents > 150)
    .map((s, i) => ({
      ...s,
      priceCAD: s.priceCents / 100,
      rank: i + 1,
      isEstimate: true,
      reporter: "",
      reportedTime: s.reportedTime || "estimated",
    }));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  if (!city) return Response.json({ success: false, error: "city param required" }, { status: 400 });

  const cacheKey = city.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return Response.json({ success: true, data: cached.data, cached: true });
  }

  let rawStations, isLive = false;
  const slug = CITY_SLUGS[city] || city.toLowerCase().replace(/[\s.]+/g, "-");
  const gasBuddyUrl = `https://www.gasbuddy.com/gasprices/british-columbia/${slug}`;

  try {
    const result = await scrapeGasBuddy(city);
    rawStations = result.stations;
    isLive = true;
  } catch (err) {
    console.warn(`⚠️ GasBuddy blocked for ${city}: ${err.message} — using Groq`);
    try {
      rawStations = await getGroqFallback(city);
    } catch (groqErr) {
      return Response.json({ success: false, error: `Both sources failed: ${groqErr.message}` }, { status: 500 });
    }
  }

  const data = {
    city,
    isLive,
    gasBuddyUrl,
    fetchedAt: new Date().toISOString(),
    note: isLive
      ? "Live prices from GasBuddy — reported by drivers in real time"
      : "AI estimates for May 2026 — GasBuddy temporarily unavailable",
    stations: rawStations.map((s, i) => ({
      rank: i + 1,
      name: s.name,
      address: s.address,
      brand: s.brand || "",
      typicalPrice: s.priceCAD,
      priceCents: s.priceCents,
      tip: s.tip || "",
      lastUpdated: s.reportedTime || "",
      reporter: s.reporter || "",
      isEstimate: s.isEstimate || false,
    })),
  };

  cache.set(cacheKey, { data, ts: Date.now() });
  return Response.json({ success: true, data });
}
