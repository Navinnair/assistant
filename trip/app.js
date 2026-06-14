// --- Trip Planner: destination + date range -> daily weather & outfit ---
// Outfit/weather logic mirrors the Office day planner (8am-9pm waking window).

const WAKING = { start: 8, end: 21 };

const WEATHER_CODES = {
  0: ["Clear sky", "sun"], 1: ["Mainly clear", "sun"], 2: ["Partly cloudy", "cloud-sun"],
  3: ["Overcast", "cloud"], 45: ["Fog", "fog"], 48: ["Fog", "fog"],
  51: ["Light drizzle", "rain"], 53: ["Drizzle", "rain"], 55: ["Dense drizzle", "rain"],
  56: ["Freezing drizzle", "rain"], 57: ["Freezing drizzle", "rain"],
  61: ["Light rain", "rain"], 63: ["Rain", "rain"], 65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"], 67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"], 73: ["Snow", "snow"], 75: ["Heavy snow", "snow"], 77: ["Snow grains", "snow"],
  80: ["Rain showers", "rain"], 81: ["Rain showers", "rain"], 82: ["Violent showers", "storm"],
  85: ["Snow showers", "snow"], 86: ["Snow showers", "snow"],
  95: ["Thunderstorm", "storm"], 96: ["Thunderstorm + hail", "storm"], 99: ["Thunderstorm + hail", "storm"],
};
function weatherInfo(code) { return WEATHER_CODES[code] || ["Unknown", "cloud"]; }

const WEATHER_ICONS = {
  sun: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  "cloud-sun": `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3" stroke="#f5a623"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 3.5l-1 1" stroke="#f5a623"/><path d="M9 18a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.5 3.5 0 0 0 4.5 18H9z" stroke="currentColor" fill="none" transform="translate(6,2)"/></svg>`,
  cloud: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 19h10z"/></svg>`,
  fog: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 14a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.4 1.8"/><path d="M3 14h13M3 18h18M3 10h6"/></svg>`,
  rain: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 13h10z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="#4da3ff"/></svg>`,
  snow: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 13h10z"/><path d="M8 17v3M8 18.5l-1.5 1M8 18.5l1.5 1M12 17v3M12 18.5l-1.5 1M12 18.5l1.5 1M16 17v3M16 18.5l-1.5 1M16 18.5l1.5 1" stroke="#9ad6ff"/></svg>`,
  storm: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 12a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 12h10z"/><path d="M13 11l-3 4h3l-2 4" stroke="#f5a623"/></svg>`,
};
function weatherIcon(category, size) {
  let svg = WEATHER_ICONS[category] || WEATHER_ICONS.cloud;
  if (size) svg = svg.replace(/width="40" height="40"/, `width="${size}" height="${size}"`);
  return svg;
}

const OUTFIT_ICONS = {
  shirt: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 5 6l2 3 2-1.4V21h6V7.6L17 9l2-3-4-3a3 3 0 0 1-6 0Z"/></svg>`,
  sweater: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 4 7l2 6 3-2.2V21h6V10.8l3 2.2 2-6-5-4a3 3 0 0 1-6 0Z"/></svg>`,
  coat: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 5 6l2 4 2-1.2V21h6V8.8l2 1.2 2-4-4-3a3 3 0 0 1-6 0Z"/><path d="M12 6v15"/></svg>`,
  umbrella: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 8 0 0 1 9 8H3a9 8 0 0 1 9-8Z"/><path d="M12 11v7a2.5 2.5 0 0 0 5 0"/><path d="M12 3V2"/></svg>`,
};
function outfitIcon(key) { return key === "sun" ? weatherIcon("sun", 28) : (OUTFIT_ICONS[key] || ""); }

// Reduce an hourly field over waking hours (8am-9pm) of one day.
function daytimeReduce(data, dayIdx, field, fn, init) {
  const date = data.daily.time[dayIdx];
  let res = init, seen = false;
  for (let i = 0; i < data.hourly.time.length; i++) {
    const [d, t] = data.hourly.time[i].split("T");
    if (d !== date) continue;
    const h = parseInt(t.split(":")[0], 10);
    if (h < WAKING.start || h > WAKING.end) continue;
    const v = data.hourly[field][i];
    if (v == null) continue;
    res = fn(res, v); seen = true;
  }
  return seen ? res : null;
}

// Outfit decision — same thresholds as the Office planner.
function computeOutfit(minTemp, rainProb, wind) {
  let wearKey, wearText, jacketKey, jacketText, notes = [];
  if (minTemp < 2) { wearKey = "sweater"; wearText = "Thermal + sweater"; jacketKey = "coat"; jacketText = "Big winter coat"; notes.push("Scarf + gloves"); }
  else if (minTemp < 9) { wearKey = "sweater"; wearText = "Warm sweater"; jacketKey = "coat"; jacketText = "Warm coat"; }
  else if (minTemp < 15) { wearKey = "shirt"; wearText = "Long sleeve"; jacketKey = "coat"; jacketText = "Light jacket"; }
  else if (minTemp < 21) { wearKey = "shirt"; wearText = "T-shirt / light top"; jacketKey = "sun"; jacketText = "No coat"; }
  else { wearKey = "shirt"; wearText = "T-shirt"; jacketKey = "sun"; jacketText = "No jacket"; }
  if (wind >= 30) notes.push("💨 Windy");
  const umbrella = rainProb != null && rainProb >= 30;
  return { wearKey, wearText, jacketKey, jacketText, umbrella, notes };
}

// --- theme ---
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeToggle").innerHTML = theme === "light" ? MOON : SUN;
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme(next);
}
const MOON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
applyTheme(localStorage.getItem("theme") || "dark");

// --- helpers ---
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDayDate(isoDate) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// Default the date inputs to today..+5.
(function initDates() {
  const today = new Date();
  const end = new Date(); end.setDate(end.getDate() + 5);
  document.getElementById("start").value = ymd(today);
  document.getElementById("end").value = ymd(end);
  document.getElementById("start").min = ymd(today);
})();

async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en`;
  const d = await fetch(url).then((r) => r.json());
  return (d.results || []).map((r) => ({
    lat: r.latitude, lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    short: r.name,
  }));
}

async function fetchTripWeather(lat, lon, start, end) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max` +
    `&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m` +
    `&timezone=auto&start_date=${start}&end_date=${end}`;
  return fetch(url).then((r) => r.json());
}

function status(msg) { document.getElementById("tripStatus").textContent = msg || ""; }

let chosenPlace = null;
async function planTrip(e) {
  e.preventDefault();
  const dest = document.getElementById("dest").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  document.getElementById("tripResults").innerHTML = "";
  document.getElementById("tripHeading").style.display = "none";
  document.getElementById("placeMatches").style.display = "none";

  if (!dest || !start || !end) return false;
  if (end < start) { status("End date is before the start date."); return false; }

  status("Finding place…");
  let places;
  try { places = await geocode(dest); }
  catch (err) { status("Couldn't reach the location service."); return false; }
  if (!places.length) { status(`No place found for "${dest}".`); return false; }

  // If several matches, let the user pick; default to the first.
  if (places.length > 1) renderPlaceChips(places, start, end);
  chosenPlace = places[0];
  await runPlan(chosenPlace, start, end);
  return false;
}

function renderPlaceChips(places, start, end) {
  const box = document.getElementById("placeMatches");
  box.style.display = "flex";
  box.innerHTML = places.map((p, i) =>
    `<button type="button" class="place-chip${i === 0 ? " active" : ""}" data-i="${i}">${p.label}</button>`
  ).join("");
  box.querySelectorAll(".place-chip").forEach((btn) => {
    btn.onclick = () => {
      box.querySelectorAll(".place-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      chosenPlace = places[+btn.dataset.i];
      runPlan(chosenPlace, start, end);
    };
  });
}

async function runPlan(place, start, end) {
  status(`Loading weather for ${place.short}…`);
  let data;
  try { data = await fetchTripWeather(place.lat, place.lon, start, end); }
  catch (err) { status("Couldn't load the forecast."); return; }
  if (!data.daily || !data.daily.time || !data.daily.time.length) {
    status("No forecast for those dates (try within the next ~16 days).");
    return;
  }
  renderTrip(place, data);
  status("");
}

function renderTrip(place, data) {
  const days = data.daily.time;
  const heading = document.getElementById("tripHeading");
  heading.innerHTML = `${place.label}<span class="sub"> · ${fmtDayDate(days[0])} – ${fmtDayDate(days[days.length - 1])}</span>`;
  heading.style.display = "block";

  const cards = days.map((date, i) => {
    const code = data.daily.weathercode[i];
    if (code == null || data.daily.temperature_2m_max[i] == null) {
      return `<div class="day-card nodata"><div class="day-date">${fmtDayDate(date)}</div><div>No forecast available</div></div>`;
    }
    const [label, cat] = weatherInfo(code);
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const min = Math.round(data.daily.temperature_2m_min[i]);
    const dayRain = data.daily.precipitation_probability_max[i];
    const dayWind = Math.round(data.daily.windspeed_10m_max[i]);

    const wMin = daytimeReduce(data, i, "temperature_2m", Math.min, Infinity);
    const wRain = daytimeReduce(data, i, "precipitation_probability", Math.max, 0);
    const wWind = daytimeReduce(data, i, "windspeed_10m", Math.max, 0);
    const o = computeOutfit(wMin == null ? min : wMin, wRain == null ? dayRain : wRain, wWind == null ? dayWind : wWind);

    return `
      <div class="day-card">
        <div class="day-top">
          <div class="day-icon">${weatherIcon(cat, 34)}</div>
          <div>
            <div class="day-date">${fmtDayDate(date)}</div>
            <div class="day-cond">${label}</div>
          </div>
          <div class="day-temp">${min}° / ${max}°</div>
        </div>
        <div class="day-meta">🌧️ ${dayRain == null ? "–" : dayRain + "%"} · 💨 ${dayWind} km/h</div>
        <div class="day-outfit">
          <div class="day-tile"><div class="t-ic">${outfitIcon(o.wearKey)}</div><div class="t-label">Wear</div><div class="t-text">${o.wearText}</div></div>
          <div class="day-tile"><div class="t-ic">${outfitIcon(o.jacketKey)}</div><div class="t-label">Outerwear</div><div class="t-text">${o.jacketText}</div></div>
          <div class="day-tile"><div class="t-ic">${outfitIcon("umbrella")}</div><div class="t-label">Umbrella</div><div class="t-text">${o.umbrella ? "Yes" : "❌ No"}</div></div>
        </div>
        ${o.notes.length ? `<div class="day-note">${o.notes.join(" · ")}</div>` : ""}
      </div>`;
  }).join("");

  document.getElementById("tripResults").innerHTML = `<div class="day-grid">${cards}</div>`;
}
