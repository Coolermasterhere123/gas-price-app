"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";

const CATEGORY_CONFIG = {
  very_low: { label: "Very Cheap", color: "#22d07a", bg: "rgba(34,208,122,0.1)", bar: "#22d07a" },
  low:      { label: "Cheap",      color: "#6ee7b7", bg: "rgba(110,231,183,0.1)", bar: "#6ee7b7" },
  medium:   { label: "Moderate",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  bar: "#f59e0b" },
  high:     { label: "Expensive",  color: "#f97316", bg: "rgba(249,115,22,0.1)",  bar: "#f97316" },
  very_high:{ label: "Very Pricey",color: "#ef4444", bg: "rgba(239,68,68,0.1)",   bar: "#ef4444" },
};

const REGIONS = ["All Regions", "North America", "South America", "Europe", "Middle East", "Africa", "Asia", "Oceania"];

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [sortBy, setSortBy] = useState("gallonsPerDollar");
  const [sortDir, setSortDir] = useState("desc");
  const [usdAmount, setUsdAmount] = useState(20);
  const [view, setView] = useState("cards"); // "cards" | "table"

  useEffect(() => {
    fetch("/api/prices")
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
        return (a[sortBy] - b[sortBy]) * mul;
      });
  }, [data, search, region, sortBy, sortDir]);

  const maxGallons = useMemo(() => {
    if (!filtered.length) return 1;
    return Math.max(...filtered.map(c => c.gallonsPerDollar));
  }, [filtered]);

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!data) return null;

  const worldAvg = data.worldAvgGallonsPerDollar || 0;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>⛽ Global Fuel Tracker</div>
          <h1 className={styles.heroTitle}>
            How much gas does <span className={styles.heroAccent}>$1 USD</span> buy?
          </h1>
          <p className={styles.heroSub}>
            Real-time comparison of regular (87-octane) gasoline prices worldwide,
            converted to gallons per dollar.
          </p>
          <div className={styles.heroStats}>
            <StatPill label="World avg" value={`${worldAvg.toFixed(3)} gal / $1`} icon="🌍" />
            <StatPill label="Cheapest" value={data.cheapestCountry} icon="🏆" />
            <StatPill label="Priciest" value={data.mostExpensiveCountry} icon="💸" />
            <StatPill label="Countries" value={data.countries?.length} icon="🗺️" />
          </div>
        </div>
      </header>

      {/* USD Calculator */}
      <section className={styles.calculator}>
        <div className={styles.calcInner}>
          <div className={styles.calcLabel}>
            <span>💵 If I have</span>
            <div className={styles.calcInputWrap}>
              <span className={styles.calcDollar}>$</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={usdAmount}
                onChange={e => setUsdAmount(Number(e.target.value))}
                className={styles.calcInput}
              />
              <span className={styles.calcUSD}>USD</span>
            </div>
            <span>I can buy...</span>
          </div>
          <div className={styles.calcGrid}>
            {data.countries.slice(0, 6).map(c => (
              <div key={c.country} className={styles.calcCard}>
                <span className={styles.calcFlag}>{c.flag}</span>
                <span className={styles.calcCountry}>{c.country}</span>
                <span className={styles.calcGallons}>
                  {(c.gallonsPerDollar * usdAmount).toFixed(2)}
                </span>
                <span className={styles.calcUnit}>gallons</span>
                <span className={styles.calcLiters}>
                  {(c.litersPerDollar * usdAmount).toFixed(1)} liters
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            { field: "gallonsPerDollar", label: "Gal/$" },
            { field: "usdPerGallon",     label: "$/gal" },
            { field: "country",          label: "A–Z" },
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

      {/* Results count */}
      <div className={styles.resultsMeta}>
        Showing {filtered.length} of {data.countries.length} countries
        {data.updated && <span className={styles.updated}> · Data: {data.updated}</span>}
      </div>

      {/* Country Grid or Table */}
      {view === "cards" ? (
        <div className={styles.grid}>
          {filtered.map((c, i) => {
            const cfg = CATEGORY_CONFIG[c.priceCategory] || CATEGORY_CONFIG.medium;
            const barPct = Math.min((c.gallonsPerDollar / maxGallons) * 100, 100);
            const isUSA = c.country === "United States";
            return (
              <div
                key={c.country}
                className={styles.card}
                style={{ "--cat-color": cfg.color, "--cat-bg": cfg.bg }}
              >
                <div className={styles.cardRank}>#{i + 1}</div>
                <div className={styles.cardHead}>
                  <span className={styles.cardFlag}>{c.flag}</span>
                  <div>
                    <div className={styles.cardCountry}>{c.country} {isUSA && <span className={styles.usBadge}>benchmark</span>}</div>
                    <div className={styles.cardRegion}>{c.region}</div>
                  </div>
                  <div className={styles.cardBadge} style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>

                {/* Main stat */}
                <div className={styles.cardMain}>
                  <span className={styles.cardGallons}>{c.gallonsPerDollar.toFixed(3)}</span>
                  <span className={styles.cardGallonsLabel}>gallons per $1 USD</span>
                </div>

                {/* Bar */}
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${barPct}%`, background: cfg.bar }} />
                </div>

                {/* Details */}
                <div className={styles.cardDetails}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Local price</span>
                    <span className={styles.detailVal}>{c.localCurrencySymbol}{c.localPrice.toFixed(2)}/L</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>USD/gallon</span>
                    <span className={styles.detailVal}>${c.usdPerGallon.toFixed(2)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>USD/liter</span>
                    <span className={styles.detailVal}>${c.usdPerLiter.toFixed(3)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Liters/$1</span>
                    <span className={styles.detailVal}>{c.litersPerDollar.toFixed(2)} L</span>
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
                <th onClick={() => toggleSort("gallonsPerDollar")} className={styles.sortable}>
                  Gal / $1 {sortBy === "gallonsPerDollar" ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}
                </th>
                <th onClick={() => toggleSort("usdPerGallon")} className={styles.sortable}>
                  $/gallon {sortBy === "usdPerGallon" ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}
                </th>
                <th>$/liter</th>
                <th>Local price/L</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cfg = CATEGORY_CONFIG[c.priceCategory] || CATEGORY_CONFIG.medium;
                return (
                  <tr key={c.country} className={c.country === "United States" ? styles.usRow : ""}>
                    <td className={styles.rankCell}>#{i + 1}</td>
                    <td>
                      <span className={styles.tableFlag}>{c.flag}</span>
                      {c.country}
                    </td>
                    <td className={styles.regionCell}>{c.region}</td>
                    <td className={styles.numCell}><strong>{c.gallonsPerDollar.toFixed(3)}</strong></td>
                    <td className={styles.numCell}>${c.usdPerGallon.toFixed(2)}</td>
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
          Live data from <a href="https://www.globalpetrolprices.com/gasoline_prices/" target="_blank" rel="noopener">globalpetrolprices.com</a>
          {data.updated && ` · Week of ${data.updated}`}
          {" · "}Parsed by Groq AI · National averages · Prices vary by region &amp; grade
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
      <p className={styles.loadingText}>Fetching live prices from globalpetrolprices.com…</p>
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
