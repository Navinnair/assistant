// --- Single place to tweak everything ---
const CONFIG = {
  // Fixed coordinates resolved via MVG location lookup.
  home:   { lat: 48.1769745, lon: 11.5652835, name: "Riesenfeldstraße 10" },
  office: { lat: 48.1411534, lon: 11.5681888, name: "Lenbachplatz 3" },
  // Usual times — the reference point when routing for "tomorrow".
  officeArrival: { hour: 9, minute: 0 },
  homeReturn:    { hour: 17, minute: 45 },
  // Leave-by countdown color thresholds (minutes to leave).
  urgentMin: 4,
  soonMin: 8,
  // Minimum head start before a train counts as catchable — skip trains you'd
  // need to bolt for in under this many minutes (grab-bag/reaction time).
  prepBufferMin: 3,
  // Waking-hours window (24h) for outfit/umbrella decisions and the forecast.
  waking: { start: 8, end: 21 },
  // Auto-refresh cadence.
  refreshMs: 5 * 60 * 1000,
  // Don't show cached routes older than this — old transit times are useless.
  routeCacheMaxAgeMs: 30 * 60 * 1000,
};
const HOME = CONFIG.home;
const OFFICE = CONFIG.office;

const TRANSPORT_TYPES = "SCHIFF,RUFTAXI,BAHN,REGIONAL_BUS,UBAHN,TRAM,SBAHN,BUS";

// WMO weather code -> [label, icon-category]
const WEATHER_CODES = {
  0: ["Clear sky", "sun"],
  1: ["Mainly clear", "sun"],
  2: ["Partly cloudy", "cloud-sun"],
  3: ["Overcast", "cloud"],
  45: ["Fog", "fog"],
  48: ["Fog", "fog"],
  51: ["Light drizzle", "rain"],
  53: ["Drizzle", "rain"],
  55: ["Dense drizzle", "rain"],
  56: ["Freezing drizzle", "rain"],
  57: ["Freezing drizzle", "rain"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Violent showers", "storm"],
  85: ["Snow showers", "snow"],
  86: ["Snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm + hail", "storm"],
  99: ["Thunderstorm + hail", "storm"],
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || ["Unknown", "cloud"];
}

// Inline SVG icon set (stroke="currentColor" so it follows theme)
const WEATHER_ICONS = {
  sun: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  "cloud-sun": `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3" stroke="#f5a623"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 3.5l-1 1" stroke="#f5a623"/><path d="M9 18a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.5A3.5 3.5 0 0 0 4.5 18H9z" stroke="currentColor" fill="none" transform="translate(6,2)"/></svg>`,
  cloud: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 19h10z"/></svg>`,
  fog: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 14a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.4 1.8"/><path d="M3 14h13M3 18h18M3 10h6"/></svg>`,
  rain: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 13h10z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="#4da3ff"/></svg>`,
  snow: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 13h10z"/><path d="M8 17v3M8 18.5l-1.5 1M8 18.5l1.5 1M12 17v3M12 18.5l-1.5 1M12 18.5l1.5 1M16 17v3M16 18.5l-1.5 1M16 18.5l1.5 1" stroke="#9ad6ff"/></svg>`,
  storm: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 12a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7.5 12h10z"/><path d="M13 11l-3 4h3l-2 4" stroke="#f5a623"/></svg>`,
};

// UI icons (outline, follow theme via currentColor) — match weather icon style.
const UI_ICONS = {
  refresh: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v5h-5"/></svg>`,
  moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
};

function weatherIcon(category, size) {
  let svg = WEATHER_ICONS[category] || WEATHER_ICONS.cloud;
  if (size) svg = svg.replace(/width="40" height="40"/, `width="${size}" height="${size}"`);
  return svg;
}

// Hourly entries for the given day, starting from "now" (today) or the start
// of waking hours (tomorrow), at a fixed step, capped to waking hours.
function hourlyEntries(data, dayIdx, count, stepH) {
  const targetDate = data.daily.time[dayIdx];
  const startHour = dayIdx === 0 ? new Date().getHours() : CONFIG.waking.start;
  const entries = [];
  for (let i = 0; i < data.hourly.time.length && entries.length < count; i++) {
    const [date, time] = data.hourly.time[i].split("T");
    if (date !== targetDate) continue;
    const hour = parseInt(time.split(":")[0], 10);
    if (hour < startHour || hour > CONFIG.waking.end) continue;
    if ((hour - startHour) % stepH !== 0) continue;
    entries.push({
      hour,
      temp: Math.round(data.hourly.temperature_2m[i]),
      rain: data.hourly.precipitation_probability[i],
      category: weatherInfo(data.hourly.weathercode[i])[1],
    });
  }
  return entries;
}

function flashIn(el) {
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.classList.add("fade-in");
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  return `${min} min`;
}

async function fetchWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${HOME.lat}&longitude=${HOME.lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max` +
    `&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m` +
    `&timezone=Europe%2FBerlin&forecast_days=2`;
  const res = await fetch(url);
  return res.json();
}

async function fetchRoutes(origin, dest, dateTime) {
  const dt = dateTime.toISOString();
  const url = `https://www.mvg.de/api/bgw-pt/v3/routes?originLatitude=${origin.lat}&originLongitude=${origin.lon}` +
    `&destinationLatitude=${dest.lat}&destinationLongitude=${dest.lon}` +
    `&routingDateTime=${dt}&routingDateTimeIsArrival=false&transportTypes=${TRANSPORT_TYPES}`;
  const res = await fetch(url);
  return res.json();
}

// MVG sometimes returns fewer than 10 routes for a given time (e.g. only
// the next few unique departures). Top up by re-querying from just after
// the last departure we already have, until we hit 10 or stop gaining any.
async function fetchRoutesPadded(origin, dest, dateTime) {
  let routes = await fetchRoutes(origin, dest, dateTime);
  let attempts = 0;
  while (routes.length < 10 && routes.length > 0 && attempts < 3) {
    const last = routes[routes.length - 1];
    const lastDep = new Date(last.parts[0].from.plannedDeparture);
    lastDep.setMinutes(lastDep.getMinutes() + 1);
    let more;
    try {
      more = await fetchRoutes(origin, dest, lastDep);
    } catch (e) {
      break;
    }
    const seen = new Set(routes.map(r => r.parts[0].from.plannedDeparture + (r.parts[0].line ? r.parts[0].line.label : "")));
    let gained = 0;
    for (const r of more) {
      const key = r.parts[0].from.plannedDeparture + (r.parts[0].line ? r.parts[0].line.label : "");
      if (!seen.has(key)) {
        seen.add(key);
        routes.push(r);
        gained++;
      }
    }
    if (gained === 0) break;
    attempts++;
  }
  return routes.slice(0, 10);
}

// dayIdx: 0 = today, 1 = tomorrow. refHour/refMinute = usual departure time.
// Today always shows next available departures from now (so it works
// whether you check before or after your usual commute time).
// Tomorrow uses the fixed reference time since "now" doesn't apply yet.
function routingDateTime(dayIdx, refHour, refMinute) {
  if (dayIdx === 1) {
    const ref = new Date();
    ref.setDate(ref.getDate() + 1);
    ref.setHours(refHour, refMinute, 0, 0);
    return ref;
  }
  return new Date();
}

// Reduce an hourly field over waking hours (8am-9pm) for the given day —
// e.g. min temperature or max windspeed/rain chance, since overnight
// conditions don't affect what you wear or whether you need an umbrella.
function daytimeHourlyReduce(data, dayIdx, field, fn, init) {
  const targetDate = data.daily.time[dayIdx];
  let result = init;
  for (let i = 0; i < data.hourly.time.length; i++) {
    const [date, time] = data.hourly.time[i].split("T");
    if (date !== targetDate) continue;
    const hour = parseInt(time.split(":")[0], 10);
    if (hour >= CONFIG.waking.start && hour <= CONFIG.waking.end) {
      result = fn(result, data.hourly[field][i]);
    }
  }
  return result;
}

// Max rain chance during waking hours (8am-9pm) for the given day —
// used for the umbrella suggestion since overnight rain doesn't matter.
function daytimeRainChance(data, dayIdx) {
  return daytimeHourlyReduce(data, dayIdx, "precipitation_probability", Math.max, 0);
}

function daytimeMinTemp(data, dayIdx) {
  return daytimeHourlyReduce(data, dayIdx, "temperature_2m", Math.min, Infinity);
}

function daytimeMaxWind(data, dayIdx) {
  return daytimeHourlyReduce(data, dayIdx, "windspeed_10m", Math.max, 0);
}

function renderWeather(data, dayIdx) {
  const i = dayIdx || 0;
  const [label, category] = weatherInfo(data.daily.weathercode[i]);
  const max = Math.round(data.daily.temperature_2m_max[i]);
  const min = Math.round(data.daily.temperature_2m_min[i]);
  const rain = data.daily.precipitation_probability_max[i];
  const wind = Math.round(data.daily.windspeed_10m_max[i]);

  // One-line glance strip under the header.
  const strip = document.getElementById("weatherStrip");
  strip.classList.remove("loading");
  strip.innerHTML = `
    <span class="ws-icon">${weatherIcon(category, 22)}</span>
    <span class="ws-temp">${min}° / ${max}°</span>
    <span class="ws-sep">·</span>
    <span>${label}</span>
    <span class="ws-sep">·</span>
    <span>🌧️ ${rain}%</span>
    <span>💨 ${wind} km/h</span>
  `;

  // Hourly forecast card.
  const entries = hourlyEntries(data, i, 7, 2);
  const hourlyHtml = entries.map(e => `
    <div class="hour-col">
      <div class="hour-time">${e.hour}h</div>
      <div class="hour-icon">${weatherIcon(e.category, 24)}</div>
      <div class="hour-temp">${e.temp}°</div>
      <div class="hour-rain">🌧️ ${e.rain}%</div>
    </div>`).join("");
  const el = document.getElementById("weather");
  el.innerHTML = `<div class="hourly-strip">${hourlyHtml || '<div class="loading">No hourly data</div>'}</div>`;
  flashIn(el);
  return data;
}

function renderOutfit(data, dayIdx) {
  const rainProb = daytimeRainChance(data, dayIdx);
  const wind = daytimeMaxWind(data, dayIdx);
  const minTemp = daytimeMinTemp(data, dayIdx);

  let wearIcon, wearText, jacketIcon, jacketText, notes = [];

  if (minTemp < 2) {
    wearIcon = "🧶";
    wearText = "Thermal layers + warm sweater";
    jacketIcon = "🧥❄️";
    jacketText = "Big winter coat";
    notes.push("Scarf + gloves recommended");
  } else if (minTemp < 9) {
    wearIcon = "🧶";
    wearText = "Warm sweater";
    jacketIcon = "🧥";
    jacketText = "Medium/warm coat";
  } else if (minTemp < 15) {
    wearIcon = "👕";
    wearText = "Long sleeve / light sweater";
    jacketIcon = "🧥";
    jacketText = "Light jacket";
  } else if (minTemp < 21) {
    wearIcon = "👕";
    wearText = "T-shirt or light top";
    jacketIcon = "🧥";
    jacketText = "❌ No";
  } else {
    wearIcon = "👕";
    wearText = "T-shirt";
    jacketIcon = "☀️";
    jacketText = "❌ No";
  }

  if (wind >= 30) {
    notes.push("💨 Windy — windbreaker helps");
  }

  const needsUmbrella = rainProb >= 30;
  const umbrellaIcon = "☔";
  const umbrellaText = needsUmbrella ? "Yes" : "❌ No";

  const el = document.getElementById("outfit");
  el.innerHTML = `
    <div class="outfit-sections">
      <div class="outfit-section">
        <div class="outfit-icon">${wearIcon}</div>
        <div class="outfit-label">Wear</div>
        <div class="outfit-text">${wearText}</div>
      </div>
      <div class="outfit-section">
        <div class="outfit-icon">${jacketIcon}</div>
        <div class="outfit-label">Outerwear</div>
        <div class="outfit-text">${jacketText}</div>
      </div>
      <div class="outfit-section">
        <div class="outfit-icon">${umbrellaIcon}</div>
        <div class="outfit-label">Umbrella</div>
        <div class="outfit-text">${umbrellaText}</div>
      </div>
    </div>
    ${notes.length ? `<div class="outfit-notes">${notes.join(" · ")}</div>` : ""}
  `;
  flashIn(el);
}

function summarizeRoute(route) {
  const parts = route.parts;

  // Leading walk from origin to the first station, if the route has one.
  let walk = null;
  let leadWalkMs = 0;
  if (parts[0].line && parts[0].line.transportType === "PEDESTRIAN") {
    leadWalkMs = new Date(parts[0].to.plannedDeparture) - new Date(parts[0].from.plannedDeparture);
    walk = { minutes: Math.round(leadWalkMs / 60000), dest: parts[0].to.name };
  }

  const legs = parts
    .filter(p => p.line && p.line.transportType !== "PEDESTRIAN")
    .map(p => ({
      line: p.line.label,
      transportType: p.line.transportType,
      direction: p.line.destination,
      board: p.from.name,
      alight: p.to.name,
      boardTime: p.from.plannedDeparture,
      alightTime: p.to.plannedDeparture,
      realTime: p.realTime,
      warnings: [...(p.messages || []), ...(p.infos || [])]
        .map(m => (typeof m === "string" ? m : m.text || m.title || ""))
        .filter(Boolean),
    }));

  // "Leave home" = first train's board time minus the walk it takes to reach
  // the stop. MVG occasionally mis-anchors the walk's start (leaving it after
  // the train it's meant to connect to); deriving it this way keeps walk →
  // board → … always consistent. Fall back to the raw walk start otherwise.
  let departure;
  if (legs.length && leadWalkMs) {
    departure = new Date(new Date(legs[0].boardTime) - leadWalkMs).toISOString();
  } else {
    departure = parts[0].from.plannedDeparture;
  }

  const arrival = parts[parts.length - 1].to.plannedDeparture;
  const durationMs = new Date(arrival) - new Date(departure);

  return { departure, arrival, durationMs, walk, legs };
}

// Official MVG line colors. Keyed by exact line label; fall back to a
// per-transport-type default for anything not listed (e.g. bus numbers).
const LINE_COLORS = {
  U1: "#438136", U2: "#C40C37", U3: "#ED6720", U4: "#00A984",
  U5: "#BC7A00", U6: "#0065AE", U7: "#C40C37", U8: "#ED6720",
  S1: "#16BAE7", S2: "#76B82A", S3: "#951B81", S4: "#E30613",
  S6: "#00975F", S7: "#943126", S8: "#000000", S20: "#ED6720",
};
const TYPE_COLORS = {
  UBAHN: "#0065AE", SBAHN: "#00975F", TRAM: "#E2001A",
  BUS: "#00586A", REGIONAL_BUS: "#00586A", BAHN: "#5b6770",
};
function lineColor(line, type) {
  return LINE_COLORS[line] || TYPE_COLORS[type] || "#5b6770";
}

// Color tier for a "minutes from now" value: urgent (red) / soon (amber) / ok.
function leaveTier(diffMin) {
  if (diffMin <= CONFIG.urgentMin) return "urgent";
  if (diffMin <= CONFIG.soonMin) return "soon";
  return "ok";
}

// The departure you'd actually take: first one whose leave-home time is at
// least prepBufferMin away (you can realistically still make it). If none
// qualify (you're too late), fall back to the last — shown as "now".
function pickChosen(summaries, now) {
  const cutoff = new Date(now.getTime() + CONFIG.prepBufferMin * 60000);
  let chosen = summaries[summaries.length - 1];
  for (const s of summaries) {
    if (new Date(s.departure) > cutoff) { chosen = s; break; }
  }
  return chosen;
}

// Shimmer placeholders shown while data loads.
const SKELETON = {
  routes: '<div class="skeleton skel-row"></div>'.repeat(4),
  outfit: '<div class="skel-grid3">' + '<div class="skeleton skel-tile"></div>'.repeat(3) + "</div>",
  weather: '<div class="skel-strip">' + '<div class="skeleton"></div>'.repeat(5) + "</div>",
};

function showRoutesError() {
  document.getElementById("routesList").innerHTML =
    '<div class="loading">Couldn\'t load routes.<button class="retry-btn" onclick="loadRoutes(selectedDay)">Retry</button></div>';
  document.getElementById("showMoreBtn").style.display = "none";
}

function renderRoutes(elementId, summaries, count) {
  if (!summaries.length) {
    document.getElementById(elementId).innerHTML = `<div class="loading">No routes found</div>`;
    return;
  }
  const shown = summaries.slice(0, count);
  const html = shown.map(s => {
    const legsHtml = s.legs.length
      ? s.legs.map(l => `
          <div class="route-leg">
            <span class="route-line" style="background:${lineColor(l.line, l.transportType)}">${l.line}</span> → ${l.direction}
            ${l.realTime ? '<span class="route-livetag">● live</span>' : ""}<br>
            <span class="route-station">${fmtTime(l.boardTime)} ${l.board}</span> →
            <span class="route-station">${fmtTime(l.alightTime)} ${l.alight}</span>
            ${l.warnings.map(w => `<div class="route-warning">⚠️ ${w}</div>`).join("")}
          </div>`).join("")
      : `<div class="route-leg">Walk only</div>`;
    const walkHtml = s.walk
      ? `<div class="route-walk">🚶 ${s.walk.minutes} min walk to ${s.walk.dest}</div>`
      : "";
    // Route-level disruption flag: any leg carrying a warning/info message.
    const allWarnings = s.legs.flatMap(l => l.warnings);
    const alertHtml = allWarnings.length
      ? `<div class="route-alert">⚠️ ${allWarnings[0]}${allWarnings.length > 1 ? ` (+${allWarnings.length - 1} more)` : ""}</div>`
      : "";
    return `
      <div class="route" data-departure="${s.departure}">
        <div class="route-time"><span class="route-num"></span>${fmtTime(s.departure)} → ${fmtTime(s.arrival)} (${fmtDuration(s.durationMs)})<span class="route-rel"></span></div>
        ${alertHtml}
        ${walkHtml}
        ${legsHtml}
      </div>`;
  }).join("");
  const el = document.getElementById(elementId);
  el.innerHTML = html;
  flashIn(el);

  const moreBtn = document.getElementById("showMoreBtn");
  moreBtn.style.display = summaries.length > count ? "" : "none";

  refreshRouteLive();
}

// Live per-row overlay (today only): relative "in X min" countdown + highlight
// the departure the Time-to-Go card picked. Cheap DOM update, runs on the tick.
function refreshRouteLive() {
  const list = document.getElementById("routesList");
  if (!list) return;
  const rows = list.querySelectorAll(".route");
  if (!rows.length) return;

  const summaries = routeCache[selectedDirection];
  const now = new Date();
  const live = selectedDay === 0 && summaries && summaries.length;
  const chosenDep = live ? pickChosen(summaries, now).departure : null;

  let visibleNum = 0;
  let chosenMarked = false; // only the first row at the chosen time is highlighted
  rows.forEach((row) => {
    const dep = row.getAttribute("data-departure");
    const rel = row.querySelector(".route-rel");
    const num = row.querySelector(".route-num");
    if (live && dep) {
      const diffExact = (new Date(dep) - now) / 60000;
      const diff = Math.round(diffExact);
      // Drop rows whose leave time has passed — old options are just clutter.
      if (diffExact < 0) {
        row.style.display = "none";
        row.classList.remove("chosen");
        if (num) num.textContent = "";
        return;
      }
      row.style.display = "";
      if (rel) {
        if (diff === 0) { rel.textContent = " · now"; rel.className = "route-rel " + leaveTier(0); }
        else { rel.textContent = ` · in ${diff} min`; rel.className = "route-rel " + leaveTier(diff); }
      }
      const isChosen = !chosenMarked && dep === chosenDep;
      if (isChosen) chosenMarked = true;
      row.classList.toggle("chosen", isChosen);
    } else {
      row.style.display = "";
      if (rel) { rel.textContent = ""; rel.className = "route-rel"; }
      row.classList.remove("chosen");
    }
    if (num) num.textContent = ++visibleNum;
  });
}

let weatherData = null;
let selectedDay = 0; // 0 = today, 1 = tomorrow
let selectedDirection = "office"; // "home" or "office" — master toggle, defaults to office
let visibleCount = 5;
let routeCache = { home: null, office: null };

function routesTitleFor(direction, dayIdx) {
  const label = dayIdx === 0 ? "Today" : "Tomorrow";
  return direction === "home"
    ? `To Home (Riesenfeldstr. 10) — ${label}`
    : `To Office (Lenbachpl. 3) — ${label}`;
}

function selectDay(dayIdx) {
  selectedDay = dayIdx;
  document.getElementById("btnToday").classList.toggle("active", dayIdx === 0);
  document.getElementById("btnTomorrow").classList.toggle("active", dayIdx === 1);
  const label = dayIdx === 0 ? "Today" : "Tomorrow";
  document.getElementById("outfitTitle").textContent = `Outfit for ${label}`;
  document.getElementById("routesTitle").textContent = routesTitleFor(selectedDirection, dayIdx);

  if (weatherData) {
    renderWeather(weatherData, dayIdx);
    renderOutfit(weatherData, dayIdx);
  }
  loadRoutes(dayIdx);
}

function selectDirection(direction) {
  selectedDirection = direction;
  visibleCount = 5;
  document.getElementById("btnDirHome").classList.toggle("active", direction === "home");
  document.getElementById("btnDirOffice").classList.toggle("active", direction === "office");
  document.getElementById("routesTitle").textContent = routesTitleFor(direction, selectedDay);

  const cached = routeCache[direction];
  if (cached) {
    renderRoutes("routesList", cached, visibleCount);
  } else {
    document.getElementById("routesList").innerHTML = SKELETON.routes;
    document.getElementById("showMoreBtn").style.display = "none";
  }
  updateLeaveBy();
  renderStaleNote();
}

function showMoreRoutes() {
  visibleCount = 10;
  const cached = routeCache[selectedDirection];
  if (cached) renderRoutes("routesList", cached, visibleCount);
}

function updateLeaveBy() {
  const card = document.getElementById("leaveByCard");
  // Follows the master direction toggle: "office" = leave home → office,
  // "home" = leave office → home. Live countdown only makes sense today.
  const summaries = routeCache[selectedDirection];
  if (selectedDay !== 0 || !summaries || !summaries.length) {
    card.style.display = "none";
    return;
  }
  card.style.display = "block";
  const now = new Date();

  const origin = selectedDirection === "office" ? "home" : "office";
  document.getElementById("leaveByTitle").textContent =
    selectedDirection === "office" ? "Time to Go — To Office" : "Time to Go — To Home";

  // s.departure is the API-accurate time to leave the origin (start of the
  // walk to the station).
  const chosen = pickChosen(summaries, now);

  const leaveTime = new Date(chosen.departure);
  // The actual transit departure = first transit leg's board time.
  const departTime = chosen.legs[0] ? new Date(chosen.legs[0].boardTime) : leaveTime;

  const leaveDiff = Math.round((leaveTime - now) / 60000);
  const departDiff = Math.round((departTime - now) / 60000);

  function countdownText(diffMin) {
    if (diffMin <= 0) return ["Now!", leaveTier(diffMin)];
    if (diffMin === 1) return ["1 min", leaveTier(diffMin)];
    return [`${diffMin} min`, leaveTier(diffMin)];
  }

  function leaveCountdownText(diffMin) {
    if (diffMin <= 0) return ["Leave now!", leaveTier(diffMin)];
    if (diffMin === 1) return ["Leave in 1 min", leaveTier(diffMin)];
    return [`Leave in ${diffMin} mins`, leaveTier(diffMin)];
  }

  const [leaveText, leaveLevel] = leaveCountdownText(leaveDiff);
  const [departText, departLevel] = countdownText(departDiff);

  const el = document.getElementById("leaveBy");
  el.innerHTML = `
    <div class="leave-grid">
      <div class="leave-col">
        <div class="leave-label">Leave ${origin}</div>
        <div class="leave-clock">${fmtTime(leaveTime.toISOString())}</div>
        <div class="leave-countdown highlight ${leaveLevel}">${leaveText}</div>
      </div>
      <div class="leave-col">
        <div class="leave-label">Departure (${chosen.legs[0] ? chosen.legs[0].line : "walk"})</div>
        <div class="leave-clock">${fmtTime(departTime.toISOString())}</div>
        <div class="leave-countdown ${departLevel}">${departText}</div>
      </div>
    </div>
    <div class="leave-sub">${chosen.walk ? `${chosen.walk.minutes} min walk to ${chosen.walk.dest}` : "no walk needed"}</div>
  `;
  flashIn(el);
}

// --- Route cache (localStorage) for offline fallback ---
const ROUTE_CACHE_KEY = "planner_routes_cache";
let liveLoaded = { home: false, office: false };
let routeCacheSavedAt = 0;

function loadRouteCache(dayIdx) {
  try {
    const o = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || "null");
    if (!o || o.dayIdx !== dayIdx) return null;
    if (Date.now() - o.savedAt > CONFIG.routeCacheMaxAgeMs) return null;
    return o; // { dayIdx, savedAt, routes: {home, office} }
  } catch (e) {
    return null;
  }
}

function saveRouteCache(dayIdx) {
  if (!liveLoaded.home && !liveLoaded.office) return; // never persist stale-only
  try {
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify({
      dayIdx, savedAt: Date.now(), routes: routeCache,
    }));
  } catch (e) {}
}

// Shows "showing routes from HH:MM" when the displayed direction is cache-only.
function renderStaleNote() {
  const el = document.getElementById("routesStale");
  const stale = !liveLoaded[selectedDirection] && routeCache[selectedDirection] && routeCacheSavedAt;
  if (stale) {
    el.textContent = `⚠ Offline — showing routes from ${fmtTime(new Date(routeCacheSavedAt).toISOString())}`;
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

async function loadRoutes(dayIdx) {
  routeCache = { home: null, office: null };
  liveLoaded = { home: false, office: false };
  routeCacheSavedAt = 0;
  visibleCount = 5;

  // Seed from cache (if fresh enough) so something shows instantly / offline.
  const cached = loadRouteCache(dayIdx);
  if (cached) {
    routeCache = cached.routes;
    routeCacheSavedAt = cached.savedAt;
    if (routeCache[selectedDirection]) renderRoutes("routesList", routeCache[selectedDirection], visibleCount);
    updateLeaveBy();
    renderStaleNote();
  } else {
    updateLeaveBy();
    document.getElementById("routesList").innerHTML = SKELETON.routes;
    document.getElementById("showMoreBtn").style.display = "none";
  }

  const fetchDir = async (dir, origin, dest, ref) => {
    try {
      const time = routingDateTime(dayIdx, ref.hour, ref.minute);
      const routes = await fetchRoutesPadded(origin, dest, time);
      routeCache[dir] = routes.map(r => summarizeRoute(r));
      liveLoaded[dir] = true;
      if (selectedDirection === dir) {
        renderRoutes("routesList", routeCache[dir], visibleCount);
        updateLeaveBy();
        renderStaleNote();
      }
    } catch (e) {
      // Keep any cached rows on screen; only show failure if we have nothing.
      if (selectedDirection === dir && !routeCache[dir]) {
        showRoutesError();
      }
    }
  };

  const fetchHome = () => fetchDir("home", OFFICE, HOME, CONFIG.homeReturn);
  const fetchOffice = () => fetchDir("office", HOME, OFFICE, CONFIG.officeArrival);

  // Load the currently-selected direction first so it appears sooner.
  if (selectedDirection === "home") {
    await fetchHome();
    await fetchOffice();
  } else {
    await fetchOffice();
    await fetchHome();
  }

  saveRouteCache(dayIdx);
  lastUpdatedAt = Date.now();
  renderUpdated();
}

// "Updated just now / N min ago" with an amber tint once data is stale.
let lastUpdatedAt = 0;
function renderUpdated() {
  const el = document.getElementById("updated");
  if (!lastUpdatedAt) { el.textContent = ""; return; }
  const mins = Math.floor((Date.now() - lastUpdatedAt) / 60000);
  el.textContent = mins < 1 ? "Updated just now" : `Updated ${mins} min ago`;
  el.classList.toggle("stale", mins >= 6);
}

setInterval(() => { updateLeaveBy(); refreshRouteLive(); renderUpdated(); }, 15000);

// --- Theme toggle ---
document.getElementById("refreshBtn").innerHTML = UI_ICONS.refresh;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Show the icon for the mode you'd switch TO.
  document.getElementById("themeToggle").innerHTML = theme === "light" ? UI_ICONS.moon : UI_ICONS.sun;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme(next);
}

applyTheme(localStorage.getItem("theme") || "dark");

// --- localStorage cache (instant load + offline fallback) ---
const CACHE_KEY = "dayplanner_weather_cache";

function loadCachedWeather() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveCachedWeather(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch (e) {}
}

async function loadAll() {
  document.getElementById("dateLine").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // Show cached weather instantly while fresh data loads
  const cached = loadCachedWeather();
  if (cached) {
    weatherData = cached.data;
    renderWeather(weatherData, selectedDay);
    renderOutfit(weatherData, selectedDay);
  } else {
    document.getElementById("outfit").innerHTML = SKELETON.outfit;
    document.getElementById("weather").innerHTML = SKELETON.weather;
  }

  try {
    weatherData = await fetchWeather();
    saveCachedWeather(weatherData);
    renderWeather(weatherData, selectedDay);
    renderOutfit(weatherData, selectedDay);
  } catch (e) {
    if (!cached) {
      document.getElementById("weather").innerHTML =
        '<div class="loading">Couldn\'t load weather.<button class="retry-btn" onclick="loadAll()">Retry</button></div>';
      document.getElementById("outfit").innerHTML = `<div class="loading">—</div>`;
    }
  }

  await loadRoutes(selectedDay);
}

document.getElementById("btnDirHome").classList.toggle("active", selectedDirection === "home");
document.getElementById("btnDirOffice").classList.toggle("active", selectedDirection === "office");
document.getElementById("routesTitle").textContent = routesTitleFor(selectedDirection, selectedDay);

loadAll();

// Auto-refresh every 5 minutes
setInterval(loadAll, CONFIG.refreshMs);

// --- PWA: register service worker for install + offline ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
