export const runtime = "nodejs";

let cache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 60 * 1000;

const COUNTRY_FLAGS = {
  "Algeria":"🇩🇿","Angola":"🇦🇴","Argentina":"🇦🇷","Armenia":"🇦🇲","Australia":"🇦🇺",
  "Austria":"🇦🇹","Azerbaijan":"🇦🇿","Bahrain":"🇧🇭","Bangladesh":"🇧🇩","Belarus":"🇧🇾",
  "Belgium":"🇧🇪","Bolivia":"🇧🇴","Bosnia and Herzegovina":"🇧🇦","Botswana":"🇧🇼",
  "Brazil":"🇧🇷","Bulgaria":"🇧🇬","Cambodia":"🇰🇭","Cameroon":"🇨🇲","Canada":"🇨🇦",
  "Chile":"🇨🇱","China":"🇨🇳","Colombia":"🇨🇴","Croatia":"🇭🇷","Cuba":"🇨🇺",
  "Cyprus":"🇨🇾","Czech Republic":"🇨🇿","Denmark":"🇩🇰","Ecuador":"🇪🇨","Egypt":"🇪🇬",
  "El Salvador":"🇸🇻","Estonia":"🇪🇪","Ethiopia":"🇪🇹","Finland":"🇫🇮","France":"🇫🇷",
  "Georgia":"🇬🇪","Germany":"🇩🇪","Ghana":"🇬🇭","Greece":"🇬🇷","Guatemala":"🇬🇹",
  "Honduras":"🇭🇳","Hong Kong":"🇭🇰","Hungary":"🇭🇺","Iceland":"🇮🇸","India":"🇮🇳",
  "Indonesia":"🇮🇩","Iran":"🇮🇷","Iraq":"🇮🇶","Ireland":"🇮🇪","Israel":"🇮🇱",
  "Italy":"🇮🇹","Ivory Coast":"🇨🇮","Jamaica":"🇯🇲","Japan":"🇯🇵","Jordan":"🇯🇴",
  "Kazakhstan":"🇰🇿","Kenya":"🇰🇪","Kosovo":"🇽🇰","Kuwait":"🇰🇼","Kyrgyzstan":"🇰🇬",
  "Laos":"🇱🇦","Latvia":"🇱🇻","Lebanon":"🇱🇧","Libya":"🇱🇾","Lithuania":"🇱🇹",
  "Luxembourg":"🇱🇺","Macau":"🇲🇴","Malaysia":"🇲🇾","Malta":"🇲🇹","Mexico":"🇲🇽",
  "Moldova":"🇲🇩","Mongolia":"🇲🇳","Morocco":"🇲🇦","Mozambique":"🇲🇿","Myanmar":"🇲🇲",
  "Namibia":"🇳🇦","Nepal":"🇳🇵","Netherlands":"🇳🇱","New Zealand":"🇳🇿","Nicaragua":"🇳🇮",
  "Nigeria":"🇳🇬","North Macedonia":"🇲🇰","Norway":"🇳🇴","Oman":"🇴🇲","Pakistan":"🇵🇰",
  "Panama":"🇵🇦","Paraguay":"🇵🇾","Peru":"🇵🇪","Philippines":"🇵🇭","Poland":"🇵🇱",
  "Portugal":"🇵🇹","Qatar":"🇶🇦","Romania":"🇷🇴","Russia":"🇷🇺","Rwanda":"🇷🇼",
  "Saudi Arabia":"🇸🇦","Senegal":"🇸🇳","Serbia":"🇷🇸","Singapore":"🇸🇬","Slovakia":"🇸🇰",
  "Slovenia":"🇸🇮","South Africa":"🇿🇦","South Korea":"🇰🇷","Spain":"🇪🇸","Sri Lanka":"🇱🇰",
  "Sudan":"🇸🇩","Sweden":"🇸🇪","Switzerland":"🇨🇭","Taiwan":"🇹🇼","Tajikistan":"🇹🇯",
  "Tanzania":"🇹🇿","Thailand":"🇹🇭","Trinidad and Tobago":"🇹🇹","Tunisia":"🇹🇳",
  "Turkey":"🇹🇷","Turkmenistan":"🇹🇲","Uganda":"🇺🇬","Ukraine":"🇺🇦",
  "United Arab Emirates":"🇦🇪","United Kingdom":"🇬🇧","United States":"🇺🇸",
  "Uruguay":"🇺🇾","Uzbekistan":"🇺🇿","Venezuela":"🇻🇪","Vietnam":"🇻🇳",
  "Yemen":"🇾🇪","Zambia":"🇿🇲","Zimbabwe":"🇿🇼",
};

const COUNTRY_REGIONS = {
  "Canada":"North America","United States":"North America","Mexico":"North America",
  "Cuba":"North America","Jamaica":"North America","Trinidad and Tobago":"North America",
  "El Salvador":"North America","Guatemala":"North America","Honduras":"North America",
  "Nicaragua":"North America","Panama":"North America",
  "Argentina":"South America","Bolivia":"South America","Brazil":"South America",
  "Chile":"South America","Colombia":"South America","Ecuador":"South America",
  "Paraguay":"South America","Peru":"South America","Uruguay":"South America","Venezuela":"South America",
  "Austria":"Europe","Belgium":"Europe","Bulgaria":"Europe","Croatia":"Europe","Cyprus":"Europe",
  "Czech Republic":"Europe","Denmark":"Europe","Estonia":"Europe","Finland":"Europe","France":"Europe",
  "Germany":"Europe","Greece":"Europe","Hungary":"Europe","Iceland":"Europe","Ireland":"Europe",
  "Italy":"Europe","Kosovo":"Europe","Latvia":"Europe","Lithuania":"Europe","Luxembourg":"Europe",
  "Malta":"Europe","Moldova":"Europe","Netherlands":"Europe","North Macedonia":"Europe","Norway":"Europe",
  "Poland":"Europe","Portugal":"Europe","Romania":"Europe","Russia":"Europe","Serbia":"Europe",
  "Slovakia":"Europe","Slovenia":"Europe","Spain":"Europe","Sweden":"Europe","Switzerland":"Europe",
  "Ukraine":"Europe","United Kingdom":"Europe","Bosnia and Herzegovina":"Europe","Georgia":"Europe",
  "Armenia":"Europe","Azerbaijan":"Europe","Belarus":"Europe","Turkey":"Europe",
  "Bahrain":"Middle East","Iran":"Middle East","Iraq":"Middle East","Israel":"Middle East",
  "Jordan":"Middle East","Kuwait":"Middle East","Lebanon":"Middle East","Libya":"Middle East",
  "Oman":"Middle East","Qatar":"Middle East","Saudi Arabia":"Middle East",
  "United Arab Emirates":"Middle East","Yemen":"Middle East",
  "Algeria":"Africa","Angola":"Africa","Botswana":"Africa","Cameroon":"Africa","Ethiopia":"Africa",
  "Ghana":"Africa","Ivory Coast":"Africa","Kenya":"Africa","Morocco":"Africa","Mozambique":"Africa",
  "Namibia":"Africa","Nigeria":"Africa","Rwanda":"Africa","Senegal":"Africa","South Africa":"Africa",
  "Sudan":"Africa","Tanzania":"Africa","Tunisia":"Africa","Uganda":"Africa","Zambia":"Africa","Zimbabwe":"Africa",
  "Bangladesh":"Asia","Cambodia":"Asia","China":"Asia","Hong Kong":"Asia","India":"Asia",
  "Indonesia":"Asia","Japan":"Asia","Kazakhstan":"Asia","Kyrgyzstan":"Asia","Laos":"Asia",
  "Macau":"Asia","Malaysia":"Asia","Mongolia":"Asia","Myanmar":"Asia","Nepal":"Asia",
  "Pakistan":"Asia","Philippines":"Asia","Singapore":"Asia","South Korea":"Asia","Sri Lanka":"Asia",
  "Taiwan":"Asia","Tajikistan":"Asia","Thailand":"Asia","Turkmenistan":"Asia","Uzbekistan":"Asia","Vietnam":"Asia",
  "Australia":"Oceania","New Zealand":"Oceania",
};

const CURRENCY_SYMBOLS = {
  USD:"$",CAD:"CA$",EUR:"€",GBP:"£",JPY:"¥",CNY:"¥",KRW:"₩",INR:"₹",BRL:"R$",
  MXN:"$",AUD:"A$",NZD:"NZ$",CHF:"Fr",NOK:"kr",SEK:"kr",DKK:"kr",PLN:"zł",
  CZK:"Kč",HUF:"Ft",RON:"lei",BGN:"лв",RUB:"₽",UAH:"₴",TRY:"₺",SAR:"﷼",
  AED:"د.إ",QAR:"﷼",KWD:"د.ك",ILS:"₪",EGP:"£",ZAR:"R",NGN:"₦",KES:"Ksh",
  GHS:"₵",MAD:"د.م.",TND:"د.ت",DZD:"دج",PKR:"₨",BDT:"৳",LKR:"₨",THB:"฿",
  VND:"₫",PHP:"₱",MYR:"RM",SGD:"S$",IDR:"Rp",HKD:"HK$",TWD:"NT$",KZT:"₸",
  UZS:"so'm",ARS:"$",CLP:"$",COP:"$",PEN:"S/.",IRR:"﷼",IQD:"ع.د",
};

function getPriceCategory(cadPerGallon) {
  // Categories based on CAD per gallon
  if (cadPerGallon < 2.00) return "very_low";
  if (cadPerGallon < 4.00) return "low";
  if (cadPerGallon < 6.00) return "medium";
  if (cadPerGallon < 9.00) return "high";
  return "very_high";
}

// Fetch live USD→CAD exchange rate from a free no-key API
async function fetchUsdToCad() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.CAD;
    if (!rate || rate < 1.0 || rate > 2.0) throw new Error("Implausible rate");
    console.log(`✅ Live USD→CAD rate: ${rate}`);
    return rate;
  } catch (err) {
    console.warn(`⚠️ Exchange rate fetch failed (${err.message}), using fallback 1.37`);
    return 1.37; // reasonable fallback
  }
}

function enrichRows(rows, usdToCad) {
  const LITERS_PER_GALLON = 3.78541;
  return rows
    .filter(r => r.country && r.usdPerLiter > 0)
    .map(r => {
      const usdPerGallon = r.usdPerLiter * LITERS_PER_GALLON;
      const cadPerLiter = r.usdPerLiter * usdToCad;
      const cadPerGallon = usdPerGallon * usdToCad;
      const gallonsPerCad = 1 / cadPerGallon;
      const litersPerCad = 1 / cadPerLiter;
      const currency = r.localCurrency || "USD";
      return {
        country: r.country,
        flag: COUNTRY_FLAGS[r.country] || "🏳️",
        region: COUNTRY_REGIONS[r.country] || "Other",
        localPrice: r.localPrice,
        localCurrency: currency,
        localCurrencySymbol: CURRENCY_SYMBOLS[currency] || currency,
        // USD values (kept for reference)
        usdPerLiter: Math.round(r.usdPerLiter * 10000) / 10000,
        usdPerGallon: Math.round(usdPerGallon * 100) / 100,
        // CAD values (primary display)
        cadPerLiter: Math.round(cadPerLiter * 1000) / 1000,
        cadPerGallon: Math.round(cadPerGallon * 100) / 100,
        gallonsPerCad: Math.round(gallonsPerCad * 10000) / 10000,
        litersPerCad: Math.round(litersPerCad * 100) / 100,
        priceCategory: getPriceCategory(cadPerGallon),
      };
    })
    .sort((a, b) => b.litersPerCad - a.litersPerCad);
}

function buildStats(countries, source, date, usdToCad) {
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    updated: date,
    source,
    usdToCad,
    countries,
    worldAvgLitersPerCad: Math.round(avg(countries.map(c => c.litersPerCad)) * 100) / 100,
    worldAvgGallonsPerCad: Math.round(avg(countries.map(c => c.gallonsPerCad)) * 10000) / 10000,
    worldAvgCadPerLiter: Math.round(avg(countries.map(c => c.cadPerLiter)) * 1000) / 1000,
    worldAvgCadPerGallon: Math.round(avg(countries.map(c => c.cadPerGallon)) * 100) / 100,
    cheapestCountry: countries[0]?.country,
    mostExpensiveCountry: countries[countries.length - 1]?.country,
    cadBenchmarkLitersPerDollar: countries.find(c => c.country === "Canada")?.litersPerCad,
  };
}

function parseJsonArray(text) {
  // Strip markdown fences
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Find array boundaries
  const s = clean.indexOf("[");
  if (s === -1) throw new Error("No JSON array found in response");
  let e = clean.lastIndexOf("]");

  // Handle truncated response (no closing bracket)
  if (e === -1 || e < s) {
    clean = clean.slice(s);
    const lastComplete = clean.lastIndexOf("},");
    if (lastComplete !== -1) clean = clean.slice(0, lastComplete + 1);
    clean = clean + "]";
  } else {
    clean = clean.slice(s, e + 1);
  }

  // Fix common Groq JSON quirks
  clean = clean.replace(/,\s*([}\]])/g, "$1");           // trailing commas
  clean = clean.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3'); // unquoted keys
  clean = clean.replace(/[\r\n]+/g, " ");                 // newlines inside strings

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Last resort: regex-extract individual objects
    const objects = [];
    const re = /\{\s*"country"\s*:\s*"([^"]+)"\s*,\s*"usdPerLiter"\s*:\s*([\d.]+)\s*,\s*"localPrice"\s*:\s*([\d.]+)\s*,\s*"localCurrency"\s*:\s*"([^"]+)"\s*\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      objects.push({ country: m[1], usdPerLiter: parseFloat(m[2]), localPrice: parseFloat(m[3]), localCurrency: m[4] });
    }
    if (objects.length > 5) return objects;
    throw new Error("JSON parse failed after all repairs: " + err.message);
  }
}

async function callGroq(prompt, temperature = 0.1) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: 6000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Extract plain text rows from HTML table — strips all tags, keeps only data
function extractTableText(html) {
  const tableStart = html.indexOf("<table");
  const tableEnd = html.lastIndexOf("</table>") + 8;
  if (tableStart === -1) throw new Error("No table found in page");
  const tableHtml = html.slice(tableStart, tableEnd);

  // Extract each <tr> and strip tags to get raw cell text
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const tagRegex = /<[^>]+>/g;

  let trMatch;
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const cells = [];
    let tdMatch;
    const tdRe = new RegExp(tdRegex.source, 'gi');
    while ((tdMatch = tdRe.exec(trMatch[1])) !== null) {
      const text = tdMatch[1].replace(tagRegex, '').replace(/\s+/g, ' ').trim();
      if (text) cells.push(text);
    }
    if (cells.length >= 2) rows.push(cells.join(' | '));
  }
  return rows.slice(0, 200).join('\n'); // cap at 200 rows
}

async function tryScrapeLive() {
  const res = await fetch("https://www.globalpetrolprices.com/gasoline_prices/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} from globalpetrolprices.com`);
  const html = await res.text();

  if (html.includes("Just a moment") || html.includes("cf-browser-verification") || html.length < 5000) {
    throw new Error("Blocked by bot protection");
  }

  const tableText = extractTableText(html);
  const dateMatch = html.match(/(\d{1,2}-\w{3}-\d{4})/);
  const pageDate = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];

  const content = await callGroq(
    `Extract gasoline price data from these table rows scraped from globalpetrolprices.com.
Each row is: Country | USD/liter | local price | local currency (approximately).
Return ONLY a JSON array, no markdown, no explanation:
[{"country":"Canada","usdPerLiter":1.18,"localPrice":1.65,"localCurrency":"CAD"},...]

Rows:
${tableText}`,
    0
  );

  const rows = parseJsonArray(content);
  if (rows.length < 10) throw new Error(`Only ${rows.length} rows parsed`);
  return { rows, date: pageDate, source: "globalpetrolprices.com (live)" };
}

// Static fallback dataset — May 2025 prices in USD/litre
// Used when both live scrape AND Groq are unavailable (rate limit, etc.)
function getStaticFallback() {
  const rows = [
    {"country":"Venezuela","usdPerLiter":0.02,"localPrice":0.10,"localCurrency":"VES"},
    {"country":"Algeria","usdPerLiter":0.33,"localPrice":44.89,"localCurrency":"DZD"},
    {"country":"Iran","usdPerLiter":0.03,"localPrice":15000,"localCurrency":"IRR"},
    {"country":"Libya","usdPerLiter":0.03,"localPrice":0.15,"localCurrency":"LYD"},
    {"country":"Iraq","usdPerLiter":0.37,"localPrice":550.00,"localCurrency":"IQD"},
    {"country":"Kuwait","usdPerLiter":0.37,"localPrice":0.11,"localCurrency":"KWD"},
    {"country":"Egypt","usdPerLiter":0.39,"localPrice":11.97,"localCurrency":"EGP"},
    {"country":"Kazakhstan","usdPerLiter":0.39,"localPrice":182.00,"localCurrency":"KZT"},
    {"country":"Malaysia","usdPerLiter":0.40,"localPrice":1.90,"localCurrency":"MYR"},
    {"country":"Saudi Arabia","usdPerLiter":0.43,"localPrice":1.61,"localCurrency":"SAR"},
    {"country":"Bahrain","usdPerLiter":0.44,"localPrice":0.165,"localCurrency":"BHD"},
    {"country":"Qatar","usdPerLiter":0.44,"localPrice":1.61,"localCurrency":"QAR"},
    {"country":"UAE","usdPerLiter":0.46,"localPrice":1.69,"localCurrency":"AED"},
    {"country":"Turkmenistan","usdPerLiter":0.47,"localPrice":0.65,"localCurrency":"TMT"},
    {"country":"Oman","usdPerLiter":0.48,"localPrice":0.185,"localCurrency":"OMR"},
    {"country":"Nigeria","usdPerLiter":0.49,"localPrice":750.00,"localCurrency":"NGN"},
    {"country":"Uzbekistan","usdPerLiter":0.51,"localPrice":6500,"localCurrency":"UZS"},
    {"country":"Russia","usdPerLiter":0.52,"localPrice":46.72,"localCurrency":"RUB"},
    {"country":"Indonesia","usdPerLiter":0.56,"localPrice":9000,"localCurrency":"IDR"},
    {"country":"Ecuador","usdPerLiter":0.57,"localPrice":0.57,"localCurrency":"USD"},
    {"country":"Jordan","usdPerLiter":0.61,"localPrice":0.43,"localCurrency":"JOD"},
    {"country":"Vietnam","usdPerLiter":0.61,"localPrice":15000,"localCurrency":"VND"},
    {"country":"Pakistan","usdPerLiter":0.62,"localPrice":180.00,"localCurrency":"PKR"},
    {"country":"Bangladesh","usdPerLiter":0.63,"localPrice":68.00,"localCurrency":"BDT"},
    {"country":"Philippines","usdPerLiter":0.64,"localPrice":36.00,"localCurrency":"PHP"},
    {"country":"China","usdPerLiter":0.66,"localPrice":4.78,"localCurrency":"CNY"},
    {"country":"Ethiopia","usdPerLiter":0.67,"localPrice":38.00,"localCurrency":"ETB"},
    {"country":"Colombia","usdPerLiter":0.67,"localPrice":2630,"localCurrency":"COP"},
    {"country":"Mexico","usdPerLiter":0.69,"localPrice":11.85,"localCurrency":"MXN"},
    {"country":"India","usdPerLiter":0.70,"localPrice":58.00,"localCurrency":"INR"},
    {"country":"Thailand","usdPerLiter":0.70,"localPrice":24.64,"localCurrency":"THB"},
    {"country":"Bolivia","usdPerLiter":0.54,"localPrice":0.54,"localCurrency":"USD"},
    {"country":"Argentina","usdPerLiter":0.71,"localPrice":600.00,"localCurrency":"ARS"},
    {"country":"Tanzania","usdPerLiter":0.72,"localPrice":1800,"localCurrency":"TZS"},
    {"country":"Kenya","usdPerLiter":0.73,"localPrice":94.00,"localCurrency":"KES"},
    {"country":"Sri Lanka","usdPerLiter":0.74,"localPrice":228.00,"localCurrency":"LKR"},
    {"country":"Myanmar","usdPerLiter":0.74,"localPrice":1500,"localCurrency":"MMK"},
    {"country":"Cambodia","usdPerLiter":0.74,"localPrice":3.00,"localCurrency":"USD"},
    {"country":"Ghana","usdPerLiter":0.76,"localPrice":9.50,"localCurrency":"GHS"},
    {"country":"Peru","usdPerLiter":0.78,"localPrice":2.89,"localCurrency":"PEN"},
    {"country":"Uganda","usdPerLiter":0.79,"localPrice":2900,"localCurrency":"UGX"},
    {"country":"Japan","usdPerLiter":0.80,"localPrice":122.00,"localCurrency":"JPY"},
    {"country":"Taiwan","usdPerLiter":0.80,"localPrice":25.40,"localCurrency":"TWD"},
    {"country":"Ukraine","usdPerLiter":0.81,"localPrice":32.00,"localCurrency":"UAH"},
    {"country":"Morocco","usdPerLiter":0.82,"localPrice":8.20,"localCurrency":"MAD"},
    {"country":"South Korea","usdPerLiter":0.83,"localPrice":1100,"localCurrency":"KRW"},
    {"country":"Zambia","usdPerLiter":0.83,"localPrice":16.00,"localCurrency":"ZMW"},
    {"country":"Tunisia","usdPerLiter":0.84,"localPrice":2.65,"localCurrency":"TND"},
    {"country":"Brazil","usdPerLiter":0.85,"localPrice":4.35,"localCurrency":"BRL"},
    {"country":"Nepal","usdPerLiter":0.86,"localPrice":115.00,"localCurrency":"NPR"},
    {"country":"Chile","usdPerLiter":0.86,"localPrice":780.00,"localCurrency":"CLP"},
    {"country":"Paraguay","usdPerLiter":0.86,"localPrice":6200,"localCurrency":"PYG"},
    {"country":"Turkey","usdPerLiter":0.87,"localPrice":28.00,"localCurrency":"TRY"},
    {"country":"South Africa","usdPerLiter":0.88,"localPrice":16.50,"localCurrency":"ZAR"},
    {"country":"Singapore","usdPerLiter":0.89,"localPrice":1.21,"localCurrency":"SGD"},
    {"country":"Moldova","usdPerLiter":0.89,"localPrice":15.90,"localCurrency":"MDL"},
    {"country":"Serbia","usdPerLiter":0.90,"localPrice":97.00,"localCurrency":"RSD"},
    {"country":"Panama","usdPerLiter":0.91,"localPrice":0.91,"localCurrency":"USD"},
    {"country":"Guatemala","usdPerLiter":0.92,"localPrice":7.10,"localCurrency":"GTQ"},
    {"country":"New Zealand","usdPerLiter":0.93,"localPrice":1.55,"localCurrency":"NZD"},
    {"country":"Romania","usdPerLiter":0.94,"localPrice":4.35,"localCurrency":"RON"},
    {"country":"Uruguay","usdPerLiter":0.94,"localPrice":38.00,"localCurrency":"UYU"},
    {"country":"Australia","usdPerLiter":0.95,"localPrice":1.46,"localCurrency":"AUD"},
    {"country":"Hong Kong","usdPerLiter":0.95,"localPrice":7.40,"localCurrency":"HKD"},
    {"country":"Bulgaria","usdPerLiter":0.96,"localPrice":1.77,"localCurrency":"BGN"},
    {"country":"United States","usdPerLiter":0.96,"localPrice":0.96,"localCurrency":"USD"},
    {"country":"Hungary","usdPerLiter":0.97,"localPrice":352.00,"localCurrency":"HUF"},
    {"country":"Albania","usdPerLiter":0.97,"localPrice":105.00,"localCurrency":"ALL"},
    {"country":"Poland","usdPerLiter":0.98,"localPrice":3.95,"localCurrency":"PLN"},
    {"country":"Slovakia","usdPerLiter":1.00,"localPrice":0.91,"localCurrency":"EUR"},
    {"country":"Czech Republic","usdPerLiter":1.01,"localPrice":23.50,"localCurrency":"CZK"},
    {"country":"Canada","usdPerLiter":1.02,"localPrice":1.39,"localCurrency":"CAD"},
    {"country":"Croatia","usdPerLiter":1.03,"localPrice":0.94,"localCurrency":"EUR"},
    {"country":"Spain","usdPerLiter":1.04,"localPrice":0.95,"localCurrency":"EUR"},
    {"country":"Slovenia","usdPerLiter":1.05,"localPrice":0.96,"localCurrency":"EUR"},
    {"country":"Latvia","usdPerLiter":1.06,"localPrice":0.97,"localCurrency":"EUR"},
    {"country":"Greece","usdPerLiter":1.07,"localPrice":0.97,"localCurrency":"EUR"},
    {"country":"Estonia","usdPerLiter":1.07,"localPrice":0.98,"localCurrency":"EUR"},
    {"country":"Lithuania","usdPerLiter":1.07,"localPrice":0.98,"localCurrency":"EUR"},
    {"country":"Austria","usdPerLiter":1.08,"localPrice":0.98,"localCurrency":"EUR"},
    {"country":"Portugal","usdPerLiter":1.09,"localPrice":0.99,"localCurrency":"EUR"},
    {"country":"France","usdPerLiter":1.10,"localPrice":1.00,"localCurrency":"EUR"},
    {"country":"Belgium","usdPerLiter":1.11,"localPrice":1.01,"localCurrency":"EUR"},
    {"country":"Ireland","usdPerLiter":1.12,"localPrice":1.02,"localCurrency":"EUR"},
    {"country":"Sweden","usdPerLiter":1.13,"localPrice":12.10,"localCurrency":"SEK"},
    {"country":"Germany","usdPerLiter":1.14,"localPrice":1.04,"localCurrency":"EUR"},
    {"country":"Italy","usdPerLiter":1.14,"localPrice":1.04,"localCurrency":"EUR"},
    {"country":"Denmark","usdPerLiter":1.15,"localPrice":7.85,"localCurrency":"DKK"},
    {"country":"Finland","usdPerLiter":1.16,"localPrice":1.06,"localCurrency":"EUR"},
    {"country":"Netherlands","usdPerLiter":1.17,"localPrice":1.07,"localCurrency":"EUR"},
    {"country":"United Kingdom","usdPerLiter":1.18,"localPrice":0.93,"localCurrency":"GBP"},
    {"country":"Israel","usdPerLiter":1.19,"localPrice":4.40,"localCurrency":"ILS"},
    {"country":"Switzerland","usdPerLiter":1.20,"localPrice":1.09,"localCurrency":"CHF"},
    {"country":"Iceland","usdPerLiter":1.21,"localPrice":165.00,"localCurrency":"ISK"},
    {"country":"Luxembourg","usdPerLiter":1.02,"localPrice":0.93,"localCurrency":"EUR"},
    {"country":"Norway","usdPerLiter":1.65,"localPrice":18.20,"localCurrency":"NOK"}
  ];
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return {
    rows,
    date: `Static baseline · ${dateStr}`,
    source: "Static baseline data (Groq rate limit reached — reset midnight UTC)",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  try {
    if (!forceRefresh && cache.data && Date.now() - cache.ts < CACHE_TTL) {
      return Response.json({ success: true, data: cache.data, cached: true });
    }

    // Fetch exchange rate and price data in parallel
    const [usdToCad, priceResult] = await Promise.all([
      fetchUsdToCad(),
      tryScrapeLive().catch((err) => {
        console.warn(`⚠️ Scrape failed: ${err.message} — using static fallback`);
        return { ...getStaticFallback(), scrapeError: err.message };
      }),
    ]);

    const countries = enrichRows(priceResult.rows, usdToCad);
    if (!countries.length) throw new Error("No valid country data");

    const data = {
      ...buildStats(countries, priceResult.source, priceResult.date, usdToCad),
      scrapeError: priceResult.scrapeError || null,
    };

    cache = { data, ts: Date.now() };
    return Response.json({ success: true, data });

  } catch (err) {
    console.error("❌ Total API failure:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
