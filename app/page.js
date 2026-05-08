"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";

const CATEGORY_CONFIG = {
  very_low: { label: "Very Cheap",  color: "#22d07a", bg: "rgba(34,208,122,0.1)",  bar: "#22d07a" },
  low:      { label: "Cheap",       color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", bar: "#6ee7b7" },
  medium:   { label: "Moderate",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  bar: "#f59e0b" },
  high:     { label: "Expensive",   color: "#f97316", bg: "rgba(249,115,22,0.1)",  bar: "#f97316" },
  very_high:{ label: "Very Pricey", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   bar: "#ef4444" },
};

const REGIONS = ["All Regions","North America","South America","Europe","Middle East","Africa","Asia","Oceania"];

// Canadian province averages — May 2026 (approximate, based on NRCan data)
const PROVINCES = [
  { name: "Nunavut",               abbr: "NU", avg: 2.15, note: "Remote supply costs" },
  { name: "British Columbia",      abbr: "BC", avg: 2.07, note: "Highest taxes in Canada" },
  { name: "Yukon",                 abbr: "YT", avg: 2.01, note: "" },
  { name: "Northwest Territories", abbr: "NT", avg: 1.98, note: "" },
  { name: "Ontario",               abbr: "ON", avg: 1.72, note: "" },
  { name: "Quebec",                abbr: "QC", avg: 1.70, note: "" },
  { name: "Prince Edward Island",  abbr: "PE", avg: 1.68, note: "" },
  { name: "Nova Scotia",           abbr: "NS", avg: 1.67, note: "" },
  { name: "New Brunswick",         abbr: "NB", avg: 1.65, note: "" },
  { name: "Newfoundland",          abbr: "NL", avg: 1.64, note: "" },
  { name: "Manitoba",              abbr: "MB", avg: 1.60, note: "" },
  { name: "Saskatchewan",          abbr: "SK", avg: 1.57, note: "" },
  { name: "Alberta",               abbr: "AB", avg: 1.45, note: "No provincial carbon tax" },
];

// BC city prices — approximate May 2026
const BC_CITIES = [
  { city: "Vancouver",        price: 2.19, note: "TransLink levy" },
  { city: "North Vancouver",  price: 2.18, note: "TransLink levy" },
  { city: "Burnaby",          price: 2.17, note: "TransLink levy" },
  { city: "Surrey",           price: 2.16, note: "TransLink levy" },
  { city: "Richmond",         price: 2.17, note: "TransLink levy" },
  { city: "Coquitlam",        price: 2.16, note: "TransLink levy" },
  { city: "Langley",          price: 2.15, note: "TransLink levy" },
  { city: "Chilliwack",       price: 2.10, note: "" },
  { city: "Abbotsford",       price: 2.13, note: "" },
  { city: "Victoria",         price: 2.14, note: "" },
  { city: "Saanich",          price: 2.13, note: "" },
  { city: "Nanaimo",          price: 2.11, note: "" },
  { city: "Courtenay",        price: 2.09, note: "" },
  { city: "Campbell River",   price: 2.08, note: "" },
  { city: "Kelowna",          price: 2.09, note: "" },
  { city: "West Kelowna",     price: 2.08, note: "" },
  { city: "Penticton",        price: 2.07, note: "" },
  { city: "Vernon",           price: 2.06, note: "" },
  { city: "Kamloops",         price: 2.07, note: "" },
  { city: "Salmon Arm",       price: 2.05, note: "" },
  { city: "Prince George",    price: 2.05, note: "" },
  { city: "Quesnel",          price: 2.04, note: "" },
  { city: "Williams Lake",    price: 2.03, note: "" },
  { city: "Terrace",          price: 2.06, note: "" },
  { city: "Prince Rupert",    price: 2.08, note: "Remote coastal" },
  { city: "Smithers",         price: 2.04, note: "" },
  { city: "Castlegar",        price: 2.00, note: "" },
  { city: "Trail",            price: 1.99, note: "" },
  { city: "Cranbrook",        price: 1.98, note: "" },
  { city: "Fort St. John",    price: 1.96, note: "Near oil production" },
];
const BC_HIGH = BC_CITIES.reduce((a, b) => b.price > a.price ? b : a);
const BC_LOW  = BC_CITIES.reduce((a, b) => b.price < a.price ? b : a);

function getPriceCategory(cadPerLiter) {
  if (cadPerLiter < 0.80) return "very_low";
  if (cadPerLiter < 1.20) return "low";
  if (cadPerLiter < 1.60) return "medium";
  if (cadPerLiter < 2.20) return "high";
  return "very_high";
}

export default function Page() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [region, setRegion]       = useState("All Regions");
  const [sortBy, setSortBy]       = useState("litersPerCad");
  const [sortDir, setSortDir]     = useState("desc");
  const [cadAmount, setCadAmount]   = useState(20);
  const [view, setView]             = useState("cards");
  const [canadaOpen, setCanadaOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [stations, setStations]     = useState(null);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError]   = useState(null);

  useEffect(() => {
    const bust = typeof window !== "undefined" && sessionStorage.getItem("gas_loaded") ? "" : "?refresh=1";
    if (bust) sessionStorage.setItem("gas_loaded", "1");
    fetch(`/api/prices${bust}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || "Failed to load");
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!data?.countries) return [];
    return data.countries
      .filter(c => {
        const matchSearch = c.country.toLowerCase().includes(search.toLowerCase());
        const matchRegion = region === "All Regions" || c.region === region;
        return matchSearch && matchRegion;
      })
      .sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        if (sortBy === "country") return mul * a.country.localeCompare(b.country);
        return (a[sortBy] - b[sortBy]) * mul;
      });
  }, [data, search, region, sortBy, sortDir]);

  const maxLiters = useMemo(() => {
    if (!filtered.length) return 1;
    return Math.max(...filtered.map(c => c.litersPerCad));
  }, [filtered]);

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  function openCity(city) {
    setSelectedCity(city);
    setStations(null);
    setStationsError(null);
    setStationsLoading(true);
    fetch(`/api/bc-stations?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setStations(res.data);
        else setStationsError(res.error);
        setStationsLoading(false);
      })
      .catch(e => { setStationsError(e.message); setStationsLoading(false); });
  }

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen error={error} />;
  if (!data)   return null;

  const worldAvg = data.worldAvgLitersPerCad || 0;
  const rate = data.usdToCad || 1.37;
  const calcCountries = data.countries.slice(0, 6);

  return (
    <div className={styles.page}>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>⛽ Global Fuel Tracker</div>
          <h1 className={styles.heroTitle}>
            How many litres does <span className={styles.heroAccent}>CA$1</span> buy?
          </h1>
          <p className={styles.heroSub}>
            Live global comparison of regular (87-octane) gasoline prices,
            converted to Canadian dollars. Updated weekly.
          </p>
          <div className={styles.heroStats}>
            <StatPill label="World avg"  value={`${worldAvg.toFixed(2)} L / CA$1`} icon="🌍" />
            <StatPill label="Cheapest"   value={data.cheapestCountry}               icon="🏆" />
            <StatPill label="Priciest"   value={data.mostExpensiveCountry}          icon="💸" />
            <StatPill label="Countries"  value={data.countries?.length}             icon="🗺️" />
          </div>
          <div className={styles.rateTag}>
            💱 1 USD = CA${rate.toFixed(4)} · live rate
          </div>
        </div>
      </header>



      {/* ── Canada Section ── */}
      <section className={styles.canadaSection}>
        <button className={styles.collapseHeader} onClick={() => setCanadaOpen(v => !v)}>
          <span>🍁 Canadian Gas Prices by Province &amp; BC Cities</span>
          <span className={styles.collapseChevron}>{canadaOpen ? "▲" : "▼"}</span>
        </button>
        {canadaOpen && (
          <div className={styles.canadaBody}>

            {/* BC High / Low */}
            <div className={styles.bcHLRow}>
              <div className={styles.bcHLCard} style={{borderColor:"rgba(239,68,68,0.4)"}}>
                <div className={styles.bcHLBadge} style={{background:"rgba(239,68,68,0.12)",color:"#ef4444"}}>Highest in BC</div>
                <div className={styles.bcHLCity}>{BC_HIGH.city}</div>
                <div className={styles.bcHLPrice}>CA${BC_HIGH.price.toFixed(2)}<span>/L</span></div>
                {BC_HIGH.note && <div className={styles.bcHLNote}>{BC_HIGH.note}</div>}
              </div>
              <div className={styles.bcHLDivider}>↔</div>
              <div className={styles.bcHLCard} style={{borderColor:"rgba(34,208,122,0.4)"}}>
                <div className={styles.bcHLBadge} style={{background:"rgba(34,208,122,0.12)",color:"#22d07a"}}>Lowest in BC</div>
                <div className={styles.bcHLCity}>{BC_LOW.city}</div>
                <div className={styles.bcHLPrice}>CA${BC_LOW.price.toFixed(2)}<span>/L</span></div>
                {BC_LOW.note && <div className={styles.bcHLNote}>{BC_LOW.note}</div>}
              </div>
            </div>

            {/* All BC cities */}
            <div className={styles.sectionLabel}>BC Cities — click any city for cheapest stations</div>
            <div className={styles.bcCitiesGrid}>
              {[...BC_CITIES].sort((a,b) => a.price - b.price).map(c => {
                const pct = ((c.price - BC_LOW.price) / (BC_HIGH.price - BC_LOW.price)) * 100;
                const col = pct < 33 ? "#22d07a" : pct < 66 ? "#f59e0b" : "#ef4444";
                return (
                  <button key={c.city} className={styles.bcCityBtn} onClick={() => openCity(c.city)}>
                    <div className={styles.bcCityBtnTop}>
                      <span className={styles.bcCityBtnName}>{c.city}</span>
                      <span className={styles.bcCityBtnPrice} style={{color: col}}>CA${c.price.toFixed(2)}</span>
                    </div>
                    <div className={styles.bcCityBarTrack}>
                      <div className={styles.bcCityBarFill} style={{width:`${pct}%`, background: col}}/>
                    </div>
                    {c.note && <div className={styles.bcCityBtnNote}>{c.note}</div>}
                    <div className={styles.bcCityBtnCta}>Tap for cheapest stations →</div>
                  </button>
                );
              })}
            </div>

            {/* Province grid */}
            <div className={styles.sectionLabel}>All Provinces &amp; Territories</div>
            <div className={styles.provGrid}>
              {[...PROVINCES].sort((a,b) => b.avg - a.avg).map(p => {
                const litersPerCad = 1 / p.avg;
                const pct = ((p.avg - 1.40) / (2.20 - 1.40)) * 100;
                const col = p.avg < 1.55 ? "#22d07a" : p.avg < 1.80 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={p.abbr} className={styles.provCard}>
                    <div className={styles.provAbbr}>{p.abbr}</div>
                    <div className={styles.provName}>{p.name}</div>
                    <div className={styles.provPrice} style={{color: col}}>CA${p.avg.toFixed(2)}<span className={styles.provPriceUnit}>/L</span></div>
                    <div className={styles.provLiters}>{litersPerCad.toFixed(2)} L / CA$1</div>
                    <div className={styles.provBarTrack}><div className={styles.provBarFill} style={{width:`${Math.min(pct,100)}%`, background: col}}/></div>
                    {p.note && <div className={styles.provNote}>{p.note}</div>}
                  </div>
                );
              })}
            </div>
            <div className={styles.canadaDisclaimer}>ℹ️ Province &amp; city averages are approximate · May 2026 · Based on NRCan weekly data</div>
          </div>
        )}
      </section>

      {/* ── BC Stations Modal ── */}
      {selectedCity && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCity(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>⛽ Cheapest Gas in {selectedCity}, BC</div>
                <div className={styles.modalSub}>Sorted cheapest first{stations?.isLive ? " · Live GasBuddy data" : " · AI estimates"}</div>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedCity(null)}>✕</button>
            </div>

            {stationsLoading && (
              <div className={styles.modalLoading}>
                <div className={styles.loadingSpinner}/>
                <p>Finding cheapest stations in {selectedCity}…</p>
              </div>
            )}

            {stationsError && (
              <div className={styles.modalError}>⚠️ {stationsError}</div>
            )}

            {stations && (
              <>
                <div className={styles.stationsList}>
                  {stations.stations.map((s, i) => (
                    <div key={i} className={styles.stationCard}>
                      <div className={styles.stationRank}>#{s.rank}</div>
                      <div className={styles.stationBody}>
                        <div className={styles.stationTop}>
                          <span className={styles.stationName}>{s.name}</span>
                          <span className={styles.stationPrice}>{s.priceCents ? `${s.priceCents}¢` : s.typicalPrice ? `CA$${s.typicalPrice.toFixed(2)}/L` : "N/A"}</span>
                        </div>
                        <div className={styles.stationAddress}>📍 {s.address}</div>
                        {s.hours && <div className={styles.stationHours}>🕐 {s.hours}</div>}
                        <div className={styles.stationMeta}>
                          {s.lastUpdated && <span>🕐 {s.lastUpdated}</span>}
                          {s.reporter && <span> · reported by {s.reporter}</span>}
                        </div>
                        {s.tip && <div className={styles.stationTip}>💡 {s.tip}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.modalDisclaimer}>
                  ⚠️ AI estimates based on training data — prices change daily.
                  {" "}<a href={stations?.gasBuddyUrl || `https://www.gasbuddy.com/gasprices/british-columbia/${(selectedCity || "").toLowerCase().replace(/\s+/g, "-")}`} target="_blank" rel="noopener">Check GasBuddy for live prices →</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Warning banner */}
      {data.scrapeError && (
        <div className={styles.sourceBanner}>
          ⚠️ Showing baseline prices — live data temporarily unavailable. Resets midnight UTC.
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="🔍 Search country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select value={region} onChange={e => setRegion(e.target.value)} className={styles.regionSelect}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className={styles.sortBtns}>
          {[
            { field: "litersPerCad", label: "L/CA$" },
            { field: "cadPerLiter",  label: "CA$/L" },
            { field: "country",      label: "A–Z"   },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`${styles.sortBtn} ${sortBy === field ? styles.sortActive : ""}`}
            >
              {label} {sortBy === field ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </button>
          ))}
        </div>
        <div className={styles.viewToggle}>
          <button onClick={() => setView("cards")} className={view === "cards" ? styles.viewActive : ""}>⊞</button>
          <button onClick={() => setView("table")} className={view === "table" ? styles.viewActive : ""}>☰</button>
        </div>
      </div>

      <div className={styles.resultsMeta}>
        Showing {filtered.length} of {data.countries.length} countries
        {data.updated && <span> · Data: {data.updated}</span>}
      </div>

      {/* Cards */}
      {view === "cards" ? (
        <div className={styles.grid}>
          {filtered.map((c, i) => {
            const cfg = CATEGORY_CONFIG[c.priceCategory] || CATEGORY_CONFIG.medium;
            const barPct = Math.min((c.litersPerCad / maxLiters) * 100, 100);
            const isCanada = c.country === "Canada";
            return (
              <div
                key={c.country}
                className={`${styles.card} ${c.isLocal ? styles.cardLocal : ""}`}
                style={{ "--cat-color": cfg.color, "--cat-bg": cfg.bg }}
              >
                <div className={styles.cardRank}>#{i + 1}</div>
                <div className={styles.cardHead}>
                  <span className={styles.cardFlag}>{c.flag}</span>
                  <div>
                    <div className={styles.cardCountry}>
                      {c.country}
                      {isCanada && <span className={styles.caBadge}>🍁 avg</span>}
                    </div>
                    <div className={styles.cardRegion}>{c.region}</div>
                  </div>
                  <div className={styles.cardBadge} style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>

                <div className={styles.cardMain}>
                  <span className={styles.cardMainNum}>{c.litersPerCad.toFixed(2)}</span>
                  <span className={styles.cardMainLabel}>litres per CA$1</span>
                </div>

                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${barPct}%`, background: c.isLocal ? "#a78bfa" : cfg.bar }} />
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Local price</span>
                    <span className={styles.detailVal}>{c.localCurrencySymbol}{c.localPrice.toFixed(2)}/L</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>CA$/litre</span>
                    <span className={styles.detailVal}>CA${c.cadPerLiter.toFixed(3)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>USD/litre</span>
                    <span className={styles.detailVal}>${c.usdPerLiter.toFixed(3)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Litres/CA$1</span>
                    <span className={styles.detailVal}>{c.litersPerCad.toFixed(2)} L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Region</th>
                <th onClick={() => toggleSort("litersPerCad")} className={styles.sortable}>
                  L / CA$1 {sortBy === "litersPerCad" ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}
                </th>
                <th onClick={() => toggleSort("cadPerLiter")} className={styles.sortable}>
                  CA$ / litre {sortBy === "cadPerLiter" ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}
                </th>
                <th>USD / litre</th>
                <th>Local / L</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cfg = CATEGORY_CONFIG[c.priceCategory] || CATEGORY_CONFIG.medium;
                return (
                  <tr
                    key={c.country}
                    className={c.country === "Canada" ? styles.caRow : ""}
                  >
                    <td className={styles.rankCell}>#{i + 1}</td>
                    <td>
                      <span className={styles.tableFlag}>{c.flag}</span>
                      {c.country}
                    </td>
                    <td className={styles.regionCell}>{c.region}</td>
                    <td className={styles.numCell}><strong>{c.litersPerCad.toFixed(2)}</strong></td>
                    <td className={styles.numCell}>CA${c.cadPerLiter.toFixed(3)}</td>
                    <td className={styles.numCell}>${c.usdPerLiter.toFixed(3)}</td>
                    <td className={styles.numCell}>{c.localCurrencySymbol}{c.localPrice.toFixed(2)}</td>
                    <td>
                      <span className={styles.tableBadge} style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className={styles.footer}>
        <p>
          Live data from{" "}
          <a href="https://www.globalpetrolprices.com/gasoline_prices/" target="_blank" rel="noopener">
            globalpetrolprices.com
          </a>
          {data.updated && ` · ${data.updated}`}
          {" · "}Exchange rate:{" "}
          <a href="https://open.er-api.com" target="_blank" rel="noopener">open.er-api.com</a>
          {" · "}National averages · Prices vary by region &amp; grade
        </p>
      </footer>
    </div>
  );
}

function StatPill({ label, value, icon }) {
  return (
    <div className={styles.statPill}>
      <span className={styles.statIcon}>{icon}</span>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className={styles.fullscreen}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>Fetching live prices & exchange rate…</p>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div className={styles.fullscreen}>
      <div className={styles.errorIcon}>⚠️</div>
      <p className={styles.errorText}>Failed to load: {error}</p>
    </div>
  );
}
