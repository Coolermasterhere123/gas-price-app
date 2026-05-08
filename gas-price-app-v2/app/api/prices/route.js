import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const runtime = "nodejs";

// Cache in-memory for 1 hour to avoid hammering the source site
let cache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const COUNTRY_FLAGS = {
  "Algeria": "🇩🇿", "Angola": "🇦🇴", "Argentina": "🇦🇷", "Armenia": "🇦🇲",
  "Australia": "🇦🇺", "Austria": "🇦🇹", "Azerbaijan": "🇦🇿", "Bahrain": "🇧🇭",
  "Bangladesh": "🇧🇩", "Belarus": "🇧🇾", "Belgium": "🇧🇪", "Bolivia": "🇧🇴",
  "Bosnia and Herzegovina": "🇧🇦", "Botswana": "🇧🇼", "Brazil": "🇧🇷",
  "Bulgaria": "🇧🇬", "Cambodia": "🇰🇭", "Cameroon": "🇨🇲", "Canada": "🇨🇦",
  "Chile": "🇨🇱", "China": "🇨🇳", "Colombia": "🇨🇴", "Croatia": "🇭🇷",
  "Cuba": "🇨🇺", "Cyprus": "🇨🇾", "Czech Republic": "🇨🇿", "Denmark": "🇩🇰",
  "Ecuador": "🇪🇨", "Egypt": "🇪🇬", "El Salvador": "🇸🇻", "Estonia": "🇪🇪",
  "Ethiopia": "🇪🇹", "Finland": "🇫🇮", "France": "🇫🇷", "Georgia": "🇬🇪",
  "Germany": "🇩🇪", "Ghana": "🇬🇭", "Greece": "🇬🇷", "Guatemala": "🇬🇹",
  "Honduras": "🇭🇳", "Hong Kong": "🇭🇰", "Hungary": "🇭🇺", "Iceland": "🇮🇸",
  "India": "🇮🇳", "Indonesia": "🇮🇩", "Iran": "🇮🇷", "Iraq": "🇮🇶",
  "Ireland": "🇮🇪", "Israel": "🇮🇱", "Italy": "🇮🇹", "Ivory Coast": "🇨🇮",
  "Jamaica": "🇯🇲", "Japan": "🇯🇵", "Jordan": "🇯🇴", "Kazakhstan": "🇰🇿",
  "Kenya": "🇰🇪", "Kosovo": "🇽🇰", "Kuwait": "🇰🇼", "Kyrgyzstan": "🇰🇬",
  "Laos": "🇱🇦", "Latvia": "🇱🇻", "Lebanon": "🇱🇧", "Libya": "🇱🇾",
  "Lithuania": "🇱🇹", "Luxembourg": "🇱🇺", "Macau": "🇲🇴", "Malaysia": "🇲🇾",
  "Malta": "🇲🇹", "Mexico": "🇲🇽", "Moldova": "🇲🇩", "Mongolia": "🇲🇳",
  "Morocco": "🇲🇦", "Mozambique": "🇲🇿", "Myanmar": "🇲🇲", "Namibia": "🇳🇦",
  "Nepal": "🇳🇵", "Netherlands": "🇳🇱", "New Zealand": "🇳🇿", "Nicaragua": "🇳🇮",
  "Nigeria": "🇳🇬", "North Macedonia": "🇲🇰", "Norway": "🇳🇴", "Oman": "🇴🇲",
  "Pakistan": "🇵🇰", "Panama": "🇵🇦", "Paraguay": "🇵🇾", "Peru": "🇵🇪",
  "Philippines": "🇵🇭", "Poland": "🇵🇱", "Portugal": "🇵🇹", "Qatar": "🇶🇦",
  "Romania": "🇷🇴", "Russia": "🇷🇺", "Rwanda": "🇷🇼", "Saudi Arabia": "🇸🇦",
  "Senegal": "🇸🇳", "Serbia": "🇷🇸", "Singapore": "🇸🇬", "Slovakia": "🇸🇰",
  "Slovenia": "🇸🇮", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Spain": "🇪🇸",
  "Sri Lanka": "🇱🇰", "Sudan": "🇸🇩", "Sweden": "🇸🇪", "Switzerland": "🇨🇭",
  "Taiwan": "🇹🇼", "Tajikistan": "🇹🇯", "Tanzania": "🇹🇿", "Thailand": "🇹🇭",
  "Trinidad and Tobago": "🇹🇹", "Tunisia": "🇹🇳", "Turkey": "🇹🇷",
  "Turkmenistan": "🇹🇲", "Uganda": "🇺🇬", "Ukraine": "🇺🇦",
  "United Arab Emirates": "🇦🇪", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
  "Uruguay": "🇺🇾", "Uzbekistan": "🇺🇿", "Venezuela": "🇻🇪", "Vietnam": "🇻🇳",
  "Yemen": "🇾🇪", "Zambia": "🇿🇲", "Zimbabwe": "🇿🇼",
};

const COUNTRY_REGIONS = {
  "Canada": "North America", "United States": "North America", "Mexico": "North America",
  "Cuba": "North America", "Jamaica": "North America", "Trinidad and Tobago": "North America",
  "El Salvador": "North America", "Guatemala": "North America", "Honduras": "North America",
  "Nicaragua": "North America", "Panama": "North America",
  "Argentina": "South America", "Bolivia": "South America", "Brazil": "South America",
  "Chile": "South America", "Colombia": "South America", "Ecuador": "South America",
  "Paraguay": "South America", "Peru": "South America", "Uruguay": "South America",
  "Venezuela": "South America",
  "Austria": "Europe", "Belgium": "Europe", "Bulgaria": "Europe", "Croatia": "Europe",
  "Cyprus": "Europe", "Czech Republic": "Europe", "Denmark": "Europe", "Estonia": "Europe",
  "Finland": "Europe", "France": "Europe", "Germany": "Europe", "Greece": "Europe",
  "Hungary": "Europe", "Iceland": "Europe", "Ireland": "Europe", "Italy": "Europe",
  "Kosovo": "Europe", "Latvia": "Europe", "Lithuania": "Europe", "Luxembourg": "Europe",
  "Malta": "Europe", "Moldova": "Europe", "Netherlands": "Europe",
  "North Macedonia": "Europe", "Norway": "Europe", "Poland": "Europe", "Portugal": "Europe",
  "Romania": "Europe", "Russia": "Europe", "Serbia": "Europe", "Slovakia": "Europe",
  "Slovenia": "Europe", "Spain": "Europe", "Sweden": "Europe", "Switzerland": "Europe",
  "Ukraine": "Europe", "United Kingdom": "Europe", "Bosnia and Herzegovina": "Europe",
  "Georgia": "Europe", "Armenia": "Europe", "Azerbaijan": "Europe", "Belarus": "Europe",
  "Turkey": "Europe",
  "Bahrain": "Middle East", "Iran": "Middle East", "Iraq": "Middle East",
  "Israel": "Middle East", "Jordan": "Middle East", "Kuwait": "Middle East",
  "Lebanon": "Middle East", "Oman": "Middle East", "Qatar": "Middle East",
  "Saudi Arabia": "Middle East", "United Arab Emirates": "Middle East", "Yemen": "Middle East",
  "Libya": "Middle East",
  "Algeria": "Africa", "Angola": "Africa", "Botswana": "Africa", "Cameroon": "Africa",
  "Ethiopia": "Africa", "Ghana": "Africa", "Ivory Coast": "Africa", "Kenya": "Africa",
  "Morocco": "Africa", "Mozambique": "Africa", "Namibia": "Africa", "Nigeria": "Africa",
  "Rwanda": "Africa", "Senegal": "Africa", "South Africa": "Africa", "Sudan": "Africa",
  "Tanzania": "Africa", "Tunisia": "Africa", "Uganda": "Africa", "Zambia": "Africa",
  "Zimbabwe": "Africa",
  "Bangladesh": "Asia", "Cambodia": "Asia", "China": "Asia", "Hong Kong": "Asia",
  "India": "Asia", "Indonesia": "Asia", "Japan": "Asia", "Kazakhstan": "Asia",
  "Kyrgyzstan": "Asia", "Laos": "Asia", "Macau": "Asia", "Malaysia": "Asia",
  "Mongolia": "Asia", "Myanmar": "Asia", "Nepal": "Asia", "Pakistan": "Asia",
  "Philippines": "Asia", "Singapore": "Asia", "South Korea": "Asia", "Sri Lanka": "Asia",
  "Taiwan": "Asia", "Tajikistan": "Asia", "Thailand": "Asia", "Turkmenistan": "Asia",
  "Uzbekistan": "Asia", "Vietnam": "Asia",
  "Australia": "Oceania", "New Zealand": "Oceania",
};

function getPriceCategory(usdPerGallon) {
  if (usdPerGallon < 1.50) return "very_low";
  if (usdPerGallon < 3.00) return "low";
  if (usdPerGallon < 4.50) return "medium";
  if (usdPerGallon < 7.00) return "high";
  return "very_high";
}

async function scrapeGlobalPetrolPrices() {
  const res = await fetch("https://www.globalpetrolprices.com/gasoline_prices/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; research bot; +https://github.com)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();

  // Extract the table portion to keep token count low for Groq
  const tableStart = html.indexOf('<table');
  const tableEnd = html.lastIndexOf('</table>') + 8;
  if (tableStart === -1) throw new Error("Could not find price table in page");
  const tableHtml = html.slice(tableStart, tableEnd);

  // Truncate if too large — we only need the rows
  const truncated = tableHtml.length > 60000
    ? tableHtml.slice(0, 60000)
    : tableHtml;

  return { html: truncated, fullHtml: html };
}

async function parseWithGroq(tableHtml, pageDate) {
  const prompt = `You are a data extraction tool. Extract ALL gasoline price rows from this HTML table from globalpetrolprices.com.

The table has columns: Country, Price in USD (per liter), Price in local currency (per liter).

For each row extract:
- country name (clean, English)
- usdPerLiter (number, USD per liter)  
- localPrice (number, local currency per liter)
- localCurrency (3-letter ISO code, e.g. CAD, EUR, GBP)

Return ONLY a JSON array, no markdown, no commentary:
[
  {"country": "Canada", "usdPerLiter": 1.18, "localPrice": 1.65, "localCurrency": "CAD"},
  ...
]

Extract every country row you can find. Here is the HTML:

${tableHtml}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 8000,
  });

  let raw = completion.choices[0]?.message?.content || "[]";
  raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in Groq response");
  return JSON.parse(raw.slice(start, end + 1));
}

const CURRENCY_SYMBOLS = {
  USD: "$", CAD: "CA$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", KRW: "₩",
  INR: "₹", BRL: "R$", MXN: "$", AUD: "A$", NZD: "NZ$", CHF: "Fr",
  NOK: "kr", SEK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč", HUF: "Ft",
  RON: "lei", BGN: "лв", HRK: "kn", RUB: "₽", UAH: "₴", TRY: "₺",
  SAR: "﷼", AED: "د.إ", QAR: "﷼", KWD: "د.ك", BHD: ".د.ب", OMR: "﷼",
  ILS: "₪", EGP: "£", ZAR: "R", NGN: "₦", KES: "Ksh", GHS: "₵",
  MAD: "د.م.", TND: "د.ت", DZD: "دج", PKR: "₨", BDT: "৳", LKR: "₨",
  THB: "฿", VND: "₫", PHP: "₱", MYR: "RM", SGD: "S$", IDR: "Rp",
  HKD: "HK$", TWD: "NT$", KZT: "₸", UZS: "so'm", ARS: "$", CLP: "$",
  COP: "$", PEN: "S/.", VES: "Bs.", IRR: "﷼", IQD: "ع.د",
};

export async function GET() {
  try {
    // Return cache if fresh
    if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
      return Response.json({ success: true, data: cache.data, cached: true });
    }

    // Step 1: Scrape live data
    let tableHtml, pageDate;
    try {
      const scraped = await scrapeGlobalPetrolPrices();
      tableHtml = scraped.html;
      // Extract date from page title like "27-Apr-2026"
      const dateMatch = scraped.fullHtml.match(/(\d{1,2}-\w{3}-\d{4})/);
      pageDate = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];
    } catch (scrapeErr) {
      console.error("Scrape failed:", scrapeErr.message);
      return Response.json({ success: false, error: `Could not fetch live prices: ${scrapeErr.message}` }, { status: 502 });
    }

    // Step 2: Parse with Groq
    const rows = await parseWithGroq(tableHtml, pageDate);

    if (!rows.length) throw new Error("No rows parsed from page");

    // Step 3: Enrich each row
    const LITERS_PER_GALLON = 3.78541;
    const countries = rows
      .filter(r => r.country && r.usdPerLiter > 0)
      .map(r => {
        const usdPerGallon = r.usdPerLiter * LITERS_PER_GALLON;
        const gallonsPerDollar = 1 / usdPerGallon;
        const litersPerDollar = 1 / r.usdPerLiter;
        const currency = r.localCurrency || "USD";
        return {
          country: r.country,
          flag: COUNTRY_FLAGS[r.country] || "🏳️",
          region: COUNTRY_REGIONS[r.country] || "Other",
          localPrice: r.localPrice,
          localCurrency: currency,
          localCurrencySymbol: CURRENCY_SYMBOLS[currency] || currency,
          usdPerLiter: Math.round(r.usdPerLiter * 10000) / 10000,
          usdPerGallon: Math.round(usdPerGallon * 100) / 100,
          gallonsPerDollar: Math.round(gallonsPerDollar * 10000) / 10000,
          litersPerDollar: Math.round(litersPerDollar * 100) / 100,
          priceCategory: getPriceCategory(usdPerGallon),
        };
      })
      .sort((a, b) => b.gallonsPerDollar - a.gallonsPerDollar);

    // Step 4: Compute world stats
    const allGpd = countries.map(c => c.gallonsPerDollar);
    const worldAvgGallonsPerDollar = allGpd.reduce((a, b) => a + b, 0) / allGpd.length;
    const allUpg = countries.map(c => c.usdPerGallon);
    const worldAvgUsdPerGallon = allUpg.reduce((a, b) => a + b, 0) / allUpg.length;

    const data = {
      updated: pageDate,
      source: "globalpetrolprices.com",
      countries,
      worldAvgGallonsPerDollar: Math.round(worldAvgGallonsPerDollar * 10000) / 10000,
      worldAvgUsdPerGallon: Math.round(worldAvgUsdPerGallon * 100) / 100,
      cheapestCountry: countries[0]?.country,
      mostExpensiveCountry: countries[countries.length - 1]?.country,
      usdBenchmarkGallonsPerDollar: countries.find(c => c.country === "United States")?.gallonsPerDollar,
    };

    cache = { data, ts: Date.now() };
    return Response.json({ success: true, data });

  } catch (err) {
    console.error("Gas price API error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
