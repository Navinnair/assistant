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
  // Show the disruption banner when the chosen train is at least this late.
  disruptionDelayMin: 5,
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

// Outfit icons — outline SVGs matching the weather icon style.
const OUTFIT_ICONS = {
  shirt: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 5 6l2 3 2-1.4V21h6V7.6L17 9l2-3-4-3a3 3 0 0 1-6 0Z"/></svg>`,
  sweater: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 4 7l2 6 3-2.2V21h6V10.8l3 2.2 2-6-5-4a3 3 0 0 1-6 0Z"/></svg>`,
  coat: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 5 6l2 4 2-1.2V21h6V8.8l2 1.2 2-4-4-3a3 3 0 0 1-6 0Z"/><path d="M12 6v15"/></svg>`,
  umbrella: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 8 0 0 1 9 8H3a9 8 0 0 1 9-8Z"/><path d="M12 11v7a2.5 2.5 0 0 0 5 0"/><path d="M12 3V2"/></svg>`,
};

function outfitIcon(key) {
  if (key === "sun") return weatherIcon("sun", 36);
  return OUTFIT_ICONS[key] || "";
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
    <span class="strip-chevron">⌄</span>
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

  let wearKey, wearText, jacketKey, jacketText, notes = [];

  if (minTemp < 2) {
    wearKey = "sweater";
    wearText = "Thermal layers + warm sweater";
    jacketKey = "coat";
    jacketText = "Big winter coat";
    notes.push("Scarf + gloves recommended");
  } else if (minTemp < 9) {
    wearKey = "sweater";
    wearText = "Warm sweater";
    jacketKey = "coat";
    jacketText = "Medium/warm coat";
  } else if (minTemp < 15) {
    wearKey = "shirt";
    wearText = "Long sleeve / light sweater";
    jacketKey = "coat";
    jacketText = "Light jacket";
  } else if (minTemp < 21) {
    wearKey = "shirt";
    wearText = "T-shirt or light top";
    jacketKey = "sun";
    jacketText = "❌ No";
  } else {
    wearKey = "shirt";
    wearText = "T-shirt";
    jacketKey = "sun";
    jacketText = "❌ No";
  }

  if (wind >= 30) {
    notes.push("💨 Windy — windbreaker helps");
  }

  const needsUmbrella = rainProb >= 30;
  const umbrellaText = needsUmbrella ? "Yes" : "❌ No";

  const el = document.getElementById("outfit");
  el.innerHTML = `
    <div class="outfit-sections">
      <div class="outfit-section">
        <div class="outfit-icon">${outfitIcon(wearKey)}</div>
        <div class="outfit-label">Wear</div>
        <div class="outfit-text">${wearText}</div>
      </div>
      <div class="outfit-section">
        <div class="outfit-icon">${outfitIcon(jacketKey)}</div>
        <div class="outfit-label">Outerwear</div>
        <div class="outfit-text">${jacketText}</div>
      </div>
      <div class="outfit-section">
        <div class="outfit-icon">${outfitIcon("umbrella")}</div>
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
      boardStationId: p.from.stationGlobalId,
      boardTime: p.from.plannedDeparture,
      alightTime: p.to.plannedDeparture,
      realTime: p.realTime,
      occupancy: p.occupancy || "UNKNOWN",
      delayMin: 0,        // filled by enrichRealtime()
      realtimeBoard: null,
      cancelled: false,
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

// Live delay of a route's first train (minutes), and effective (delay-shifted)
// times. A delay pushes both the train and your leave-home time back equally.
function routeDelayMs(s) {
  const leg = s.legs[0];
  return leg && leg.delayMin ? leg.delayMin * 60000 : 0;
}
function effDepartureMs(s) {
  return new Date(s.departure).getTime() + routeDelayMs(s);
}
function effBoardMs(s) {
  const leg = s.legs[0];
  const planned = leg ? new Date(leg.boardTime).getTime() : new Date(s.departure).getTime();
  return planned + routeDelayMs(s);
}
function routeCancelled(s) {
  return s.legs.some((l) => l.cancelled);
}

// Enrich summaries with live delays from the /departures endpoint, matched by
// line + planned time at each route's first station. One call per distinct
// station (usually 1-2), so cheap. Mutates the leg objects in place.
async function enrichRealtime(summaries) {
  const byStation = {};
  for (const s of summaries) {
    const leg = s.legs[0];
    if (!leg || !leg.boardStationId) continue;
    (byStation[leg.boardStationId] = byStation[leg.boardStationId] || []).push(leg);
  }
  await Promise.all(Object.keys(byStation).map(async (gid) => {
    try {
      const deps = await fetch(
        `https://www.mvg.de/api/bgw-pt/v3/departures?globalId=${encodeURIComponent(gid)}&limit=60`
      ).then((r) => r.json());
      for (const leg of byStation[gid]) {
        const plannedMs = new Date(leg.boardTime).getTime();
        const m = deps.find((x) =>
          x.label === leg.line && Math.abs(x.plannedDepartureTime - plannedMs) < 60000
        );
        if (m) {
          leg.delayMin = m.delayInMinutes || 0;
          leg.realtimeBoard = m.realtimeDepartureTime ? new Date(m.realtimeDepartureTime).toISOString() : null;
          leg.cancelled = !!m.cancelled;
          leg.realTime = true;
          if (m.occupancy) leg.occupancy = m.occupancy;
        }
      }
    } catch (e) {}
  }));
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
// Deep link to Google Maps transit directions for the current direction.
function mapsUrlFor(direction) {
  const o = direction === "office" ? CONFIG.home : CONFIG.office;
  const d = direction === "office" ? CONFIG.office : CONFIG.home;
  return `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}` +
    `&destination=${d.lat},${d.lon}&travelmode=transit`;
}
let lastSwipeAt = 0;
function openRoute() {
  if (Date.now() - lastSwipeAt < 400) return; // ignore the tap a swipe leaves behind
  window.open(mapsUrlFor(selectedDirection), "_blank", "noopener");
}

// Crowding badge for a leg's occupancy; empty when unknown.
const OCCUPANCY = { LOW: ["occ-low", "Quiet"], MEDIUM: ["occ-med", "Busy"], HIGH: ["occ-high", "Packed"] };
function occupancyTag(level) {
  const o = OCCUPANCY[level];
  return o ? `<span class="occupancy ${o[0]}">● ${o[1]}</span>` : "";
}

function lineColor(line, type) {
  if (LINE_COLORS[line]) return LINE_COLORS[line];
  // Munich line-family conventions for anything without an explicit color.
  if (/^N\d/i.test(line)) return "#2b2d42";  // night lines (NachtTram/NachtBus)
  if (/^X\d/i.test(line)) return "#6a1b9a";  // express buses
  if (/^5[0-9]$|^6[0-8]$/.test(line)) return "#004f6e"; // MetroBus (50–68), bolder blue
  return TYPE_COLORS[type] || "#5b6770";
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
  const cutoffMs = now.getTime() + CONFIG.prepBufferMin * 60000;
  let chosen = summaries[summaries.length - 1];
  for (const s of summaries) {
    if (routeCancelled(s)) continue; // never recommend a cancelled train
    if (effDepartureMs(s) > cutoffMs) { chosen = s; break; }
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
    document.getElementById(elementId).innerHTML = `<div class="loading">No departures found for this window.</div>`;
    const empty = document.getElementById("routesEmpty");
    if (empty) empty.style.display = "none";
    const more = document.getElementById("showMoreBtn");
    if (more) more.style.display = "none";
    return;
  }
  const shown = summaries.slice(0, count);
  const html = shown.map(s => {
    const legsHtml = s.legs.length
      ? `<div class="route-legs">` + s.legs.map(l => {
          const meta = [
            l.realTime ? '<span class="route-livetag">● live</span>' : "",
            occupancyTag(l.occupancy),
          ].filter(Boolean).join(" ");
          return `
            <div class="leg-line">
              <span class="route-line" style="background:${lineColor(l.line, l.transportType)}">${l.line}</span> → ${l.direction}
              ${meta ? `<span class="leg-meta">${meta}</span>` : ""}
            </div>
            <div class="leg-stop"><i class="dot"></i><span class="route-station">${fmtTime(l.boardTime)} ${l.board}</span></div>
            <div class="leg-stop"><i class="dot end"></i><span class="route-station">${fmtTime(l.alightTime)} ${l.alight}</span></div>
            ${l.warnings.map(w => `<div class="route-warning">⚠️ ${w}</div>`).join("")}`;
        }).join("") + `</div>`
      : `<div class="route-leg">Walk only</div>`;
    const walkHtml = s.walk
      ? `<div class="route-walk">🚶 ${s.walk.minutes} min walk to ${s.walk.dest}</div>`
      : "";
    // Route-level disruption flag: any leg carrying a warning/info message.
    const allWarnings = s.legs.flatMap(l => l.warnings);
    const alertHtml = allWarnings.length
      ? `<div class="route-alert">⚠️ ${allWarnings[0]}${allWarnings.length > 1 ? ` (+${allWarnings.length - 1} more)` : ""}</div>`
      : "";
    const delayM = s.legs[0] ? s.legs[0].delayMin : 0;
    const cancelled = routeCancelled(s);
    const delayTag = cancelled
      ? '<span class="delay-tag cancel">cancelled</span>'
      : delayM > 0 ? `<span class="delay-tag">+${delayM} late</span>` : "";
    return `
      <div class="route" data-departure="${s.departure}" data-delay="${delayM}" onclick="openRoute()" onkeydown="if(event.key==='Enter')openRoute()" role="link" tabindex="0" title="Open in Google Maps">
        <div class="route-time"><span class="route-num"></span>${fmtTime(s.departure)} → ${fmtTime(s.arrival)} (${fmtDuration(s.durationMs)})${delayTag}<span class="route-rel"></span><span class="route-ext">↗</span></div>
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
  const emptyEl = document.getElementById("routesEmpty");
  const rows = list.querySelectorAll(".route");
  if (!rows.length) { if (emptyEl) emptyEl.style.display = "none"; return; }

  const summaries = routeCache[selectedDirection];
  const now = new Date();
  const live = selectedDay === 0 && summaries && summaries.length;
  const chosenDep = live ? pickChosen(summaries, now).departure : null;

  let visibleNum = 0;
  let chosenMarked = false; // only the first row at the chosen time is highlighted
  rows.forEach((row) => {
    const dep = row.getAttribute("data-departure");
    const delayMs = (parseInt(row.getAttribute("data-delay"), 10) || 0) * 60000;
    const rel = row.querySelector(".route-rel");
    const num = row.querySelector(".route-num");
    if (live && dep) {
      // Effective leave-home = planned + live delay.
      const diffExact = (new Date(dep).getTime() + delayMs - now) / 60000;
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

  // All options have departed (stale data / late night) — show a friendly note.
  if (emptyEl) emptyEl.style.display = (live && visibleNum === 0) ? "" : "none";
}

let weatherData = null;
let selectedDay = 0; // 0 = today, 1 = tomorrow
// Morning you're heading to the office; from ~13:00 you're heading home.
function defaultDirection() {
  const h = new Date().getHours();
  return h >= 13 && h < 24 ? "home" : "office";
}
// A PWA shortcut (?to=office|home) overrides the time-based default.
function initialDirection() {
  const to = new URLSearchParams(window.location.search).get("to");
  return to === "home" || to === "office" ? to : defaultDirection();
}
let selectedDirection = initialDirection(); // "home" or "office" — master toggle
let visibleCount = 5;
let routeCache = { home: null, office: null };
let enriched = { home: false, office: false }; // live delays applied this load?

// Toggle a segmented button's active state + its aria-pressed.
function setToggle(id, on) {
  const btn = document.getElementById(id);
  btn.classList.toggle("active", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

function routesTitleFor(direction, dayIdx) {
  const label = dayIdx === 0 ? "Today" : "Tomorrow";
  return direction === "home"
    ? `To Home (Riesenfeldstr. 10) — ${label}`
    : `To Office (Lenbachpl. 3) — ${label}`;
}

function selectDay(dayIdx) {
  selectedDay = dayIdx;
  setToggle("btnToday", dayIdx === 0);
  setToggle("btnTomorrow", dayIdx === 1);
  const label = dayIdx === 0 ? "Today" : "Tomorrow";
  document.getElementById("outfitTitle").textContent = `Outfit for ${label}`;
  document.getElementById("routesTitle").textContent = routesTitleFor(selectedDirection, dayIdx);

  if (weatherData) {
    renderWeather(weatherData, dayIdx);
    renderOutfit(weatherData, dayIdx);
  }
  refreshDayOff();
  loadRoutes(dayIdx);
}

function selectDirection(direction) {
  selectedDirection = direction;
  visibleCount = 5;
  setToggle("btnDirHome", direction === "home");
  setToggle("btnDirOffice", direction === "office");
  document.getElementById("routesTitle").textContent = routesTitleFor(direction, selectedDay);

  const cached = routeCache[direction];
  if (cached) {
    renderRoutes("routesList", cached, visibleCount);
    // First time we show this direction today, pull its live delays.
    if (!enriched[direction] && selectedDay === 0) {
      enrichRealtime(cached).then(() => {
        enriched[direction] = true;
        if (selectedDirection === direction) {
          renderRoutes("routesList", cached, visibleCount);
          updateLeaveBy();
        }
      });
    }
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

// Static "tomorrow" plan: first train around your usual time, no live countdown.
function renderTomorrowPlan(summaries) {
  const card = document.getElementById("leaveByCard");
  card.style.display = "block";
  document.getElementById("disruptionBanner").style.display = "none";
  leaveActive = false;
  updateLeaveBar();

  const origin = selectedDirection === "office" ? "home" : "office";
  const dest = selectedDirection === "office" ? "To Office" : "To Home";
  document.getElementById("leaveByTitle").textContent = `Tomorrow — ${dest}`;

  const s = summaries[0];
  const leaveTime = new Date(s.departure);
  const board = s.legs[0] ? new Date(s.legs[0].boardTime) : leaveTime;
  const line = s.legs[0] ? s.legs[0].line : "walk";

  const el = document.getElementById("leaveBy");
  el.innerHTML = `
    <div class="leave-grid">
      <div class="leave-col">
        <div class="leave-label">Leave ${origin}</div>
        <div class="leave-clock">${fmtTime(leaveTime.toISOString())}</div>
        <div class="leave-plan">around this time</div>
      </div>
      <div class="leave-col">
        <div class="leave-label">First train (${line})</div>
        <div class="leave-clock">${fmtTime(board.toISOString())}</div>
        <div class="leave-plan">planning ahead</div>
      </div>
    </div>
    <div class="leave-sub">${s.walk ? `${s.walk.minutes} min walk to ${s.walk.dest}` : "no walk needed"} · tomorrow</div>
  `;
  flashIn(el);
}

function updateLeaveBy() {
  const card = document.getElementById("leaveByCard");
  // Follows the master direction toggle: "office" = leave home → office,
  // "home" = leave office → home. Live countdown only makes sense today.
  const summaries = routeCache[selectedDirection];
  const off = dayOffInfo(selectedDay);
  const noData = !summaries || !summaries.length;
  // Day off hides it (unless today + the "heading out" toggle); no data hides it.
  if (noData || (off && !(selectedDay === 0 && showLeaveOnDayOff))) {
    card.style.display = "none";
    leaveActive = false;
    updateLeaveBar();
    document.getElementById("disruptionBanner").style.display = "none";
    return;
  }
  // Tomorrow (workday) → static plan, no live countdown.
  if (selectedDay === 1) {
    renderTomorrowPlan(summaries);
    return;
  }
  card.style.display = "block";
  const now = new Date();

  const origin = selectedDirection === "office" ? "home" : "office";
  document.getElementById("leaveByTitle").textContent =
    selectedDirection === "office" ? "Time to Go — To Office" : "Time to Go — To Home";

  const chosen = pickChosen(summaries, now);

  // Effective (live, delay-shifted) times: leaving and the train departure.
  const leaveTime = new Date(effDepartureMs(chosen));
  const departTime = new Date(effBoardMs(chosen));
  const delayMin = chosen.legs[0] ? chosen.legs[0].delayMin : 0;

  const leaveDiff = Math.round((leaveTime - now) / 60000);
  const departDiff = Math.round((departTime - now) / 60000);

  const lineLabel = chosen.legs[0] ? chosen.legs[0].line : "walk";
  let depLabel = `Departure (${lineLabel})`;
  if (chosen.legs[0] && chosen.legs[0].cancelled) depLabel += " ✖ cancelled";
  else if (delayMin > 0) depLabel += ` · <span class="delay-tag">+${delayMin} late</span>`;

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
        <div class="leave-label">${depLabel}</div>
        <div class="leave-clock">${fmtTime(departTime.toISOString())}</div>
        <div class="leave-countdown ${departLevel}">${departText}</div>
      </div>
    </div>
    <div class="leave-sub">${chosen.walk ? `${chosen.walk.minutes} min walk to ${chosen.walk.dest}` : "no walk needed"}</div>
  `;
  flashIn(el);

  // Disruption banner: flag the chosen train when it's cancelled, badly late,
  // or carries a service message — so you catch it without scrolling.
  const banner = document.getElementById("disruptionBanner");
  const warns = chosen.legs.flatMap((l) => l.warnings);
  let bMsg = "", bLevel = "warn";
  if (routeCancelled(chosen)) { bMsg = `⚠ ${lineLabel} cancelled — check alternatives below`; bLevel = "bad"; }
  else if (delayMin >= CONFIG.disruptionDelayMin) { bMsg = `⚠ ${lineLabel} running ${delayMin} min late`; bLevel = "warn"; }
  else if (warns.length) { bMsg = `⚠ ${warns[0]}`; bLevel = "warn"; }
  if (bMsg) {
    banner.textContent = bMsg;
    banner.className = "disruption-banner " + bLevel;
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
  }

  // Feed the slim sticky bar (shown when this card is scrolled out of view).
  const dirIcon = selectedDirection === "office" ? "🏢" : "🏠";
  leaveActive = true;
  leaveBarHtml = `<span>${dirIcon}</span><span>Leave ${fmtTime(leaveTime.toISOString())}</span>` +
    `<span class="lb-count ${leaveLevel}">· ${leaveText}</span>` +
    `<span class="lb-sub">${lineLabel} ${fmtTime(departTime.toISOString())}</span>`;
  updateLeaveBar();
}

// --- Slim "leave by" bar that appears once the full card scrolls away ---
let leaveBarHtml = "";
let leaveActive = false;
let leaveCardVisible = true;
function updateLeaveBar() {
  const bar = document.getElementById("leaveBar");
  if (!bar) return;
  bar.innerHTML = leaveBarHtml;
  bar.style.display = (leaveActive && !leaveCardVisible) ? "flex" : "none";
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
  enriched = { home: false, office: false };
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
      // Overlay live delays for the visible direction (today only), then redraw.
      if (selectedDirection === dir && dayIdx === 0) {
        await enrichRealtime(routeCache[dir]);
        enriched[dir] = true;
        if (selectedDirection === dir) {
          renderRoutes("routesList", routeCache[dir], visibleCount);
          updateLeaveBy();
        }
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

// --- Bavarian public holidays (Nager.Date), cached ~30 days ---
let holidayMap = {}; // "YYYY-MM-DD" -> holiday name
function localYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
async function loadHolidays(year) {
  const key = `holidays_DE_BY_${year}`;
  try {
    const c = JSON.parse(localStorage.getItem(key) || "null");
    if (c && Date.now() - c.savedAt < 30 * 24 * 3600 * 1000) return c.dates;
  } catch (e) {}
  try {
    const all = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`).then((r) => r.json());
    // National holidays (counties null) plus those that include Bavaria.
    const dates = {};
    for (const h of all) {
      if (!h.counties || h.counties.includes("DE-BY")) dates[h.date] = h.localName || h.name;
    }
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), dates }));
    return dates;
  } catch (e) {
    return {};
  }
}

const WEEKEND_QUIPS = [
  "🛋️ No office today, bro. Touch some grass.",
  "🛌 Weekend mode on. Office can wait.",
  "😎 It's the weekend — boss can't find you.",
  "🍻 No commute. Trains run, you don't have to.",
  "🦥 Zero meetings. Maximum couch.",
];
const HOLIDAY_QUIPS = [
  (n) => `🎉 ${n}! Free day — boss said no.`,
  (n) => `🥳 ${n} — no office, go enjoy.`,
  (n) => `🎊 ${n}. Office closed, vibes open.`,
];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Returns null on a working day, else a (funny) reason this day is off.
function dayOffInfo(dayIdx) {
  const d = new Date();
  d.setDate(d.getDate() + dayIdx);
  const dow = d.getDay();
  const name = holidayMap[localYmd(d)];
  if (name) return { holiday: true, name };
  if (dow === 0 || dow === 6) return { holiday: false };
  return null;
}

let showLeaveOnDayOff = false; // reveal the leave-by on a day off if heading out
let dayOffMsg = "";            // keep the quip stable across re-renders this load
function refreshDayOff() {
  const note = document.getElementById("dayOffNote");
  const info = dayOffInfo(selectedDay);
  if (!info) { note.style.display = "none"; dayOffMsg = ""; return; }
  if (!dayOffMsg) dayOffMsg = info.holiday ? pick(HOLIDAY_QUIPS)(info.name) : pick(WEEKEND_QUIPS);
  note.innerHTML = `<div>${dayOffMsg}</div>` +
    `<button class="dayoff-toggle" onclick="toggleLeaveOnDayOff()">` +
    `${showLeaveOnDayOff ? "Hide travel times" : "🚆 Heading out? Show travel times"}</button>`;
  note.style.display = "block";
}

function toggleLeaveOnDayOff() {
  showLeaveOnDayOff = !showLeaveOnDayOff;
  updateLeaveBy();
  refreshDayOff();
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

// --- Hourly forecast: collapsible under the weather strip ---
function setHourly(open) {
  document.getElementById("hourlyWrap").style.display = open ? "block" : "none";
  document.getElementById("weatherStrip").setAttribute("aria-expanded", open ? "true" : "false");
  document.getElementById("weatherStrip").classList.toggle("open", open);
}
function toggleHourly() {
  const open = document.getElementById("hourlyWrap").style.display === "none";
  localStorage.setItem("hourly_open", open ? "1" : "0");
  setHourly(open);
}
setHourly(localStorage.getItem("hourly_open") === "1"); // default collapsed

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

let isLoading = false;
async function loadAll() {
  if (isLoading) return;
  isLoading = true;
  document.getElementById("refreshBtn").classList.add("spinning");
  try {
    await loadAllInner();
  } finally {
    isLoading = false;
    document.getElementById("refreshBtn").classList.remove("spinning");
  }
}

async function loadAllInner() {
  document.getElementById("dateLine").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // Bavarian holidays (cached ~30 days); cover this year + next for late Dec.
  const yr = new Date().getFullYear();
  const [hy, hy2] = await Promise.all([loadHolidays(yr), loadHolidays(yr + 1)]);
  holidayMap = { ...hy, ...hy2 };
  refreshDayOff();

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

setToggle("btnDirHome", selectedDirection === "home");
setToggle("btnDirOffice", selectedDirection === "office");
document.getElementById("routesTitle").textContent = routesTitleFor(selectedDirection, selectedDay);

loadAll();

// Auto-refresh every 5 minutes
setInterval(loadAll, CONFIG.refreshMs);

// Slim "leave by" bar: reveal it when the full Time-to-Go card scrolls away.
if ("IntersectionObserver" in window) {
  const card = document.getElementById("leaveByCard");
  if (card) {
    new IntersectionObserver((entries) => {
      leaveCardVisible = entries[0].isIntersecting;
      updateLeaveBar();
    }, { threshold: 0 }).observe(card);
  }
}

// --- Touch gestures: pull-to-refresh + swipe to switch direction ---
(function () {
  const PULL_THRESHOLD = 70;
  const SWIPE_THRESHOLD = 60;
  const ind = document.getElementById("pullIndicator");
  let startY = null, startX = 0, armed = false;

  window.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = window.scrollY === 0 ? e.touches[0].clientY : null;
    armed = false;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (startY == null || isLoading) return;
    const dy = e.touches[0].clientY - startY;
    armed = dy > PULL_THRESHOLD;
    ind.style.display = armed ? "block" : "none";
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    ind.style.display = "none";
    if (armed) loadAll();
    armed = false;

    const dx = e.changedTouches[0].clientX - startX;
    const dy = startY == null ? 0 : e.changedTouches[0].clientY - startY;
    // Horizontal swipe (clearly sideways) flips direction: left → Office, right → Home.
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      lastSwipeAt = Date.now(); // suppress the route tap that may follow
      selectDirection(dx < 0 ? "office" : "home");
    }
    startY = null;
  });
})();

// --- PWA: register service worker + "new version" refresh toast ---
function showUpdateToast(reg) {
  const toast = document.getElementById("updateToast");
  toast.style.display = "flex";
  document.getElementById("updateBtn").onclick = () => {
    if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");
  };
}

if ("serviceWorker" in navigator) {
  let reloading = false;
  // Only auto-reload when an EXISTING controller is replaced (a real update).
  // On a first-ever install the controller goes null→worker via clients.claim;
  // don't reload then.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      // A waiting worker already exists (updated while the app was closed).
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          // Installed + an existing controller => this is an update, not first install.
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateToast(reg);
          }
        });
      });
    }).catch(() => {});
  });
}
