import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './App.css';

// ── Weather code mappings ─────────────────────────────────────────────────────
const WX = {
  0:  { icon: '☀️',  label: 'Clear Sky',           bg: 'clear' },
  1:  { icon: '🌤️', label: 'Mainly Clear',         bg: 'clear' },
  2:  { icon: '⛅',  label: 'Partly Cloudy',        bg: 'cloudy' },
  3:  { icon: '☁️',  label: 'Overcast',             bg: 'cloudy' },
  45: { icon: '🌫️', label: 'Foggy',                bg: 'fog' },
  48: { icon: '🌫️', label: 'Freezing Fog',         bg: 'fog' },
  51: { icon: '🌦️', label: 'Light Drizzle',        bg: 'rain' },
  53: { icon: '🌦️', label: 'Drizzle',              bg: 'rain' },
  55: { icon: '🌧️', label: 'Heavy Drizzle',        bg: 'rain' },
  61: { icon: '🌧️', label: 'Slight Rain',          bg: 'rain' },
  63: { icon: '🌧️', label: 'Rain',                 bg: 'rain' },
  65: { icon: '🌧️', label: 'Heavy Rain',           bg: 'rain' },
  71: { icon: '🌨️', label: 'Slight Snow',          bg: 'snow' },
  73: { icon: '🌨️', label: 'Snow',                 bg: 'snow' },
  75: { icon: '❄️',  label: 'Heavy Snow',           bg: 'snow' },
  77: { icon: '🌨️', label: 'Snow Grains',          bg: 'snow' },
  80: { icon: '🌦️', label: 'Slight Showers',       bg: 'rain' },
  81: { icon: '🌧️', label: 'Showers',              bg: 'rain' },
  82: { icon: '🌧️', label: 'Heavy Showers',        bg: 'rain' },
  85: { icon: '🌨️', label: 'Snow Showers',         bg: 'snow' },
  86: { icon: '❄️',  label: 'Heavy Snow Showers',   bg: 'snow' },
  95: { icon: '⛈️',  label: 'Thunderstorm',         bg: 'storm' },
  96: { icon: '⛈️',  label: 'Thunderstorm + Hail',  bg: 'storm' },
  99: { icon: '⛈️',  label: 'Heavy Thunderstorm',   bg: 'storm' },
};

function getWx(code) { return WX[code] ?? { icon: '🌡️', label: 'Unknown', bg: 'clear' }; }

function getBg(wxCode, isDay) {
  const { bg } = getWx(wxCode);
  if (!isDay) return 'linear-gradient(160deg, #010308 0%, #040814 30%, #060c1c 65%, #08102a 100%)';
  return {
    clear:  'linear-gradient(160deg, #061020 0%, #0e2250 28%, #1a4278 55%, #225ca8 78%, #1a4a8a 100%)',
    cloudy: 'linear-gradient(160deg, #0c1018 0%, #161e30 30%, #1e2840 58%, #242e4c 80%, #1c2840 100%)',
    fog:    'linear-gradient(160deg, #0e1018 0%, #1a1e2c 30%, #242838 58%, #2c3044 80%, #20242e 100%)',
    rain:   'linear-gradient(160deg, #030810 0%, #081422 28%, #0e1e34 55%, #122440 78%, #0c1e36 100%)',
    snow:   'linear-gradient(160deg, #080c20 0%, #101835 28%, #1a2248 55%, #222a5c 78%, #1c2450 100%)',
    storm:  'linear-gradient(160deg, #030308 0%, #0a0514 28%, #140820 55%, #1c0c2e 78%, #140a26 100%)',
  }[bg] ?? 'linear-gradient(160deg, #061020, #1a4278)';
}

function getHeroGlow(wxCode, isDay) {
  const { bg } = getWx(wxCode);
  if (!isDay) return 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(30,50,120,0.25) 0%, transparent 70%)';
  return {
    clear:  'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(80,140,255,0.22) 0%, rgba(255,180,50,0.08) 50%, transparent 70%)',
    cloudy: 'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(80,100,160,0.2) 0%, transparent 70%)',
    fog:    'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(100,110,140,0.15) 0%, transparent 70%)',
    rain:   'radial-gradient(ellipse 80% 55% at 20% 0%, rgba(40,90,200,0.25) 0%, rgba(20,60,130,0.1) 50%, transparent 70%)',
    snow:   'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(140,160,255,0.2) 0%, transparent 70%)',
    storm:  'radial-gradient(ellipse 80% 55% at 20% 0%, rgba(100,50,180,0.25) 0%, rgba(60,20,120,0.1) 50%, transparent 70%)',
  }[bg] ?? 'none';
}

// ── Running score ──────────────────────────────────────────────────────────────
function calcRunScore(temp, humidity, windKmh, precipProb, uvIndex, unit) {
  const tC = unit === 'F' ? (temp - 32) * 5 / 9 : temp;

  const tScore =
    tC >= 8 && tC <= 15 ? 100 :
    (tC >= 3 && tC < 8) || (tC > 15 && tC <= 20) ? 78 :
    (tC >= 0 && tC < 3) || (tC > 20 && tC <= 27) ? 50 :
    (tC >= -5 && tC < 0) || (tC > 27 && tC <= 33) ? 25 : 8;

  const hScore = humidity <= 50 ? 100 : humidity <= 65 ? 82 : humidity <= 75 ? 60 : humidity <= 85 ? 35 : 15;

  const wKmh = unit === 'F' ? windKmh * 1.609 : windKmh;
  const wScore = wKmh <= 10 ? 100 : wKmh <= 20 ? 82 : wKmh <= 32 ? 60 : wKmh <= 48 ? 35 : 15;

  const pScore = precipProb <= 10 ? 100 : precipProb <= 25 ? 72 : precipProb <= 50 ? 42 : precipProb <= 70 ? 18 : 5;

  const uvScore = uvIndex <= 3 ? 100 : uvIndex <= 5 ? 85 : uvIndex <= 7 ? 65 : 40;

  const score = Math.round(tScore * 0.28 + hScore * 0.20 + wScore * 0.25 + pScore * 0.22 + uvScore * 0.05);
  return { score, tScore, hScore, wScore, pScore };
}

function runLabel(s) {
  if (s >= 88) return 'Perfect';
  if (s >= 72) return 'Excellent';
  if (s >= 55) return 'Good';
  if (s >= 38) return 'Fair';
  if (s >= 22) return 'Challenging';
  return 'Tough';
}

function runColor(s) {
  if (s >= 88) return '#80DEEA';
  if (s >= 72) return '#80DEEA';
  if (s >= 55) return '#FFD54F';
  if (s >= 38) return '#FFB74D';
  if (s >= 22) return '#EF9A9A';
  return '#CF6679';
}

function runGear(tC) {
  if (tC > 22) return 'Singlet & shorts · Sunscreen · Cap · Water';
  if (tC > 17) return 'T-shirt & shorts · Sunscreen';
  if (tC > 12) return 'T-shirt & shorts or tights';
  if (tC > 7) return 'Long sleeve & tights · Light jacket';
  if (tC > 2) return 'Thermal top · Wind jacket · Gloves';
  if (tC > -3) return 'Layers · Wind jacket · Gloves & hat';
  return 'Full thermal · Waterproof jacket · Gloves & balaclava';
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function windDir(deg) {
  if (deg == null) return '–';
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg / 45) % 8];
}
function uvLabel(uv) {
  return uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
}
function fmtTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtHour(isoStr, isNow) {
  if (isNow) return 'Now';
  const h = new Date(isoStr).getHours();
  if (h === 0) return 'Midnight';
  if (h === 12) return 'Noon';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
function pressureLabel(hpa) {
  if (!hpa) return '';
  if (hpa < 1000) return 'Low — unsettled';
  if (hpa < 1013) return 'Below normal';
  if (hpa < 1020) return 'Normal';
  if (hpa < 1030) return 'High — settled';
  return 'Very high';
}
function visLabel(m) {
  if (!m) return '';
  return m >= 10000 ? 'Excellent' : m >= 5000 ? 'Good' : m >= 1000 ? 'Moderate' : 'Poor';
}
function dewComfort(dp, unit) {
  const dpC = unit === 'F' ? (dp - 32) * 5 / 9 : dp;
  if (dpC < 10) return 'Dry & crisp';
  if (dpC < 13) return 'Comfortable';
  if (dpC < 16) return 'Pleasant';
  if (dpC < 18) return 'Slightly sticky';
  if (dpC < 21) return 'Humid';
  if (dpC < 24) return 'Very humid';
  return 'Oppressive';
}
function aqiLabel(v) {
  if (v == null) return 'Unknown';
  if (v <= 20) return 'Good'; if (v <= 40) return 'Fair';
  if (v <= 60) return 'Moderate'; if (v <= 80) return 'Poor';
  if (v <= 100) return 'Very Poor'; return 'Extremely Poor';
}
function aqiColor(v) {
  if (v == null || v <= 20) return '#80DEEA';
  if (v <= 40) return '#FFD54F'; if (v <= 60) return '#FFB74D';
  if (v <= 80) return '#EF9A9A'; return '#CF6679';
}
function pollenLevel(val, type) {
  if (val == null || val < 0) return { label: 'No data', score: 0, pct: 0 };
  let thresholds;
  if (type === 'tree') thresholds = [15, 90, 1500];
  else if (type === 'weed') thresholds = [10, 50, 500];
  else thresholds = [10, 50, 200]; // grass
  const labels = ['Low', 'Moderate', 'High', 'Very High'];
  const idx = thresholds.findIndex(t => val < t);
  const score = idx === -1 ? 3 : idx;
  return { label: labels[score], score, pct: (score + 1) * 25 };
}
function pollenColor(score) {
  return ['#80DEEA', '#FFD54F', '#FFB74D', '#EF9A9A'][score] ?? '#80DEEA';
}

function cloudLabel(pct) {
  if (pct < 10) return 'Clear';
  if (pct < 30) return 'Mostly clear';
  if (pct < 55) return 'Partly cloudy';
  if (pct < 85) return 'Mostly cloudy';
  return 'Overcast';
}

// ── Pressure trend ─────────────────────────────────────────────────────────────
function pressureTrend(pressures) {
  if (!pressures?.length) return { arrow: '→', label: 'Steady', color: 'rgba(255,255,255,0.5)' };
  const vals = pressures.filter(p => p != null);
  if (vals.length < 2) return { arrow: '→', label: 'Steady', color: 'rgba(255,255,255,0.5)' };
  const diff = vals[vals.length - 1] - vals[0];
  if (diff > 1.5) return { arrow: '↑', label: 'Rising', color: '#80DEEA' };
  if (diff < -1.5) return { arrow: '↓', label: 'Falling', color: '#FFB74D' };
  return { arrow: '→', label: 'Steady', color: 'rgba(255,255,255,0.5)' };
}

// ── Moon phase (Julian Day maths) ───────────────────────────────────────────────
function moonPhase(date = new Date()) {
  const knownNew = new Date('2000-01-06T18:14:00Z');
  const synodic = 29.530588853;
  const days = (date - knownNew) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic / synodic;
  const idx = Math.round(phase * 8) % 8;
  const emojis = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  const names  = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous',
                  'Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  return { phase, emoji: emojis[idx], name: names[idx] };
}

// ── Best run day this week (skips today) ────────────────────────────────────────
function bestRunDay(daily, unit) {
  if (!daily?.time) return null;
  let best = { idx: -1, score: 0 };
  daily.time.forEach((_, i) => {
    if (i === 0) return;
    const avgTemp = (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2;
    const { score } = calcRunScore(
      avgTemp, 65, daily.wind_speed_10m_max[i],
      daily.precipitation_probability_max[i], daily.uv_index_max[i], unit
    );
    if (score > best.score) best = { idx: i, score };
  });
  if (best.idx === -1) return null;
  const d = new Date(daily.time[best.idx] + 'T12:00:00');
  return { day: DAY_NAMES[d.getDay()], score: best.score };
}

// ── Wind compass rose SVG ───────────────────────────────────────────────────────
function CompassRose({ deg, size = 72 }) {
  const r = size / 2;
  const cardinals = ['N','E','S','W'];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={r} cy={r} r={r * 0.84} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      {cardinals.map((d, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        return (
          <text key={d} x={r + Math.cos(a) * r * 0.58} y={r + Math.sin(a) * r * 0.58}
            textAnchor="middle" dominantBaseline="central"
            fontSize={size * 0.15} fill="rgba(255,255,255,0.3)"
            fontFamily="system-ui,sans-serif" fontWeight="700">{d}</text>
        );
      })}
      <g transform={`rotate(${deg}, ${r}, ${r})`}>
        <polygon points={`${r},${r * 0.18} ${r - r * 0.11},${r + r * 0.22} ${r},${r - r * 0.02} ${r + r * 0.11},${r + r * 0.22}`}
          fill="#4FC3F7"/>
        <polygon points={`${r},${r * 1.82} ${r - r * 0.07},${r - r * 0.22} ${r},${r * 1.02} ${r + r * 0.07},${r - r * 0.22}`}
          fill="rgba(255,255,255,0.2)"/>
      </g>
      <circle cx={r} cy={r} r={size * 0.065} fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Weather SVG icons (Material Design style) ──────────────────────────────────
function WxIcon({ code, size = 48, isDay = 1 }) {
  const { bg } = getWx(code);
  const partly = code === 1 || code === 2;

  // MD palette colours
  const Y  = '#FDD835'; // Amber / sun
  const CL = '#90A4AE'; // Blue Grey 300 / light cloud
  const CD = '#546E7A'; // Blue Grey 600 / dark cloud
  const RA = '#4FC3F7'; // Light Blue 300 / rain
  const SN = '#E3F2FD'; // Blue 50 / snow
  const LT = '#FFD740'; // Amber A200 / lightning
  const MN = '#C5CAE9'; // Indigo 100 / moon

  // Cloud path (fits 0 0 48 48 viewBox, bottom ~y30)
  const CP = 'M10,30 Q6,30 6,26 Q6,20 12,20 Q12,14 18,12 Q24,9 30,13 Q34,10 38,16 Q44,16 44,22 Q44,28 38,28 L10,28 Z';

  function rays(cx, cy, r, len, n, color) {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      return <line key={i} x1={cx+c*(r+3)} y1={cy+s*(r+3)} x2={cx+c*(r+3+len)} y2={cy+s*(r+3+len)} stroke={color} strokeWidth="2.5" strokeLinecap="round"/>;
    });
  }

  // Night icons
  if (!isDay && (bg === 'clear' || bg === 'cloudy' || partly)) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
        <circle cx="26" cy="22" r="13" fill={MN}/>
        <circle cx="33" cy="15" r="10" fill="#060818"/>
      </svg>
    );
  }

  if (bg === 'clear') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <circle cx="24" cy="24" r="10" fill={Y}/>
      {rays(24, 24, 10, 5, 8, Y)}
    </svg>
  );

  if (bg === 'cloudy' && partly) return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <circle cx="15" cy="17" r="8" fill={Y} opacity="0.95"/>
      {rays(15, 17, 8, 4, 8, Y)}
      <path d="M12,34 Q8,34 8,30 Q8,25 13,24 Q13,19 18,18 Q22,16 26,19 Q30,17 32,21 Q37,21 37,26 Q37,30 32,30 L12,30 Z" fill={CL}/>
    </svg>
  );

  if (bg === 'cloudy') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <path d={CP} fill={CL}/>
    </svg>
  );

  if (bg === 'fog') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <line x1="9"  y1="16" x2="39" y2="16" stroke={CL} strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="7"  y1="24" x2="41" y2="24" stroke={CL} strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="11" y1="32" x2="37" y2="32" stroke={CL} strokeWidth="3.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );

  if (bg === 'rain') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <path d={CP} fill={CD}/>
      <line x1="15" y1="34" x2="12" y2="43" stroke={RA} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="34" x2="21" y2="43" stroke={RA} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="33" y1="34" x2="30" y2="43" stroke={RA} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  if (bg === 'snow') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <path d={CP} fill={CL}/>
      {[14, 24, 34].map((x, i) => (
        <g key={i} transform={`translate(${x},40)`} stroke={SN} strokeWidth="2" strokeLinecap="round">
          <line x1="-4" y1="0" x2="4" y2="0"/>
          <line x1="0" y1="-4" x2="0" y2="4"/>
          <line x1="-3" y1="-3" x2="3" y2="3"/>
          <line x1="3" y1="-3" x2="-3" y2="3"/>
        </g>
      ))}
    </svg>
  );

  if (bg === 'storm') return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}>
      <path d={CP} fill={CD}/>
      <path d="M26,30 L19,42 L25,42 L18,54 L34,34 L27,34 Z" fill={LT}/>
    </svg>
  );

  return <svg width={size} height={size} viewBox="0 0 48 48" style={{ display:'block' }}><circle cx="24" cy="24" r="10" fill={Y}/></svg>;
}

// ── Tooltip component ──────────────────────────────────────────────────────────
function Tip({ children, content, width = 200 }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function show() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.top - 8, left: r.left + r.width / 2 });
    setVis(true);
  }

  return (
    <div ref={ref} className="tip-wrap" onMouseEnter={show} onMouseLeave={() => setVis(false)}>
      {children}
      {vis && createPortal(
        <div className="tip-popup" style={{ top: pos.top, left: pos.left, width }}>
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── API ────────────────────────────────────────────────────────────────────────
async function fetchWeather(lat, lon, unit) {
  const tUnit = unit === 'F' ? 'fahrenheit' : 'celsius';
  const wUnit = unit === 'F' ? 'mph' : 'kmh';
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,surface_pressure,uv_index,is_day,visibility,cloud_cover,dew_point_2m` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,cloud_cover,dew_point_2m,surface_pressure` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset` +
    `&temperature_unit=${tUnit}&wind_speed_unit=${wUnit}` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

async function fetchAirQuality(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,pm2_5,pm10,grass_pollen,birch_pollen,alder_pollen,ragweed_pollen` +
      `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()).current ?? null;
  } catch { return null; }
}

async function geocode(q) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&format=json`);
  return (await res.json()).results ?? [];
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const a = data.address ?? {};

    // NOTE: Nominatim uses a.city for UK administrative *districts* (e.g. "Broadland"),
    // not actual cities. Skip it and use more specific fields only.
    const direct = a.town || a.village || a.hamlet || a.isolated_dwelling || a.suburb;
    if (direct) return direct;

    // Find the settlement from display_name: it appears just before the district (a.city)
    // e.g. "Church Road, Lingwood, Broadland, Norfolk, England, UK" → "Lingwood"
    const district = a.city;
    if (district && data.display_name) {
      const parts = data.display_name.split(',').map(p => p.trim());
      const di = parts.findIndex(p => p === district);
      if (di >= 1) {
        const candidate = parts[di - 1];
        if (candidate && !/^\d/.test(candidate) && !/^[A-Z]{1,2}\d/.test(candidate)) {
          return candidate;
        }
      }
    }

    return a.county || a.state || 'Your Location';
  } catch { return 'Your Location'; }
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [unit, setUnit] = useState('C');
  const [location, setLocation] = useState({ lat: 52.6309, lon: 1.2974, name: 'Norwich' });
  const [weather, setWeather] = useState(null);
  const [aq, setAq] = useState(null);
  const [status, setStatus] = useState('locating');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tempHover, setTempHover] = useState(null);
  const [uvHover, setUvHover] = useState(null);
  const suggestTimer = useRef(null);
  const locationRef = useRef(location);
  const unitRef = useRef(unit);
  const [now, setNow] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [savedLocs, setSavedLocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('weather-saved') || '[]'); } catch { return []; }
  });

  const isSaved = location ? savedLocs.some(l => l.name === location.name) : false;
  function toggleSave() {
    if (!location) return;
    const exists = savedLocs.some(l => l.name === location.name);
    const updated = exists
      ? savedLocs.filter(l => l.name !== location.name)
      : [...savedLocs, { name: location.name, lat: location.lat, lon: location.lon }].slice(-5);
    setSavedLocs(updated);
    localStorage.setItem('weather-saved', JSON.stringify(updated));
  }

  // Sync refs so background callbacks always see current values
  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { unitRef.current = unit; }, [unit]);

  // Live clock — tick every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh data silently every 15 minutes
  useEffect(() => {
    const t = setInterval(silentRefresh, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // locateMe() available via button; default location is already set to Lingwood
  useEffect(() => { if (location) load(location.lat, location.lon, location.name); }, [location, unit]);

  function locateMe() {
    setStatus('locating'); setWeather(null);
    if (!navigator.geolocation) { setLocation({ lat: 52.6309, lon: 1.2974, name: 'Norwich' }); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, name });
      },
      () => setLocation({ lat: 52.6309, lon: 1.2974, name: 'Norwich' }),
      { timeout: 8000 }
    );
  }

  async function silentRefresh() {
    const { lat, lon, name } = locationRef.current;
    try {
      const [data, aqData] = await Promise.all([
        fetchWeather(lat, lon, unitRef.current),
        fetchAirQuality(lat, lon),
      ]);
      setWeather({ ...data, locationName: name });
      setAq(aqData);
      setLastUpdated(new Date());
    } catch {} // fail silently — don't interrupt the user
  }

  async function load(lat, lon, name) {
    setStatus('loading');
    try {
      const [data, aqData] = await Promise.all([
        fetchWeather(lat, lon, unit),
        fetchAirQuality(lat, lon),
      ]);
      setWeather({ ...data, locationName: name });
      setAq(aqData);
      setLastUpdated(new Date());
      setStatus('ready');
    } catch {
      setErrorMsg('Unable to fetch weather. Please try again.');
      setStatus('error');
    }
  }

  function onSearchChange(e) {
    const q = e.target.value; setSearchQ(q);
    clearTimeout(suggestTimer.current);
    if (q.length < 2) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => setSuggestions((await geocode(q)).slice(0, 5)), 350);
  }

  function pickSuggestion(r) {
    setLocation({ lat: r.latitude, lon: r.longitude, name: [r.name, r.admin1, r.country].filter(Boolean).join(', ') });
    setSearchQ(''); setSuggestions([]);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const c = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const wxInfo = c ? getWx(c.weather_code) : null;
  const isDay = c?.is_day ?? 1;
  const bg = c ? getBg(c.weather_code, isDay) : 'linear-gradient(160deg,#0a0a14,#12121f)';

  const nowHourIdx = (() => {
    if (!hourly) return 0;
    const idx = hourly.time.findIndex(t => new Date(t) > new Date()) - 1;
    return Math.max(0, idx);
  })();

  const hourlySlice = hourly
    ? hourly.time.slice(nowHourIdx, nowHourIdx + 25).map((t, i) => {
        const idx = nowHourIdx + i;
        const { score } = calcRunScore(
          hourly.temperature_2m[idx], hourly.relative_humidity_2m[idx],
          hourly.wind_speed_10m[idx], hourly.precipitation_probability[idx],
          hourly.uv_index[idx], unit
        );
        return {
          time: t, isNow: i === 0,
          temp: Math.round(hourly.temperature_2m[idx]),
          feelsLike: Math.round(hourly.apparent_temperature?.[idx] ?? hourly.temperature_2m[idx]),
          precipProb: hourly.precipitation_probability[idx],
          precip: hourly.precipitation[idx],
          wxCode: hourly.weather_code[idx],
          wind: Math.round(hourly.wind_speed_10m[idx]),
          humidity: hourly.relative_humidity_2m[idx],
          cloudCover: hourly.cloud_cover?.[idx],
          dewPoint: hourly.dew_point_2m?.[idx] != null ? Math.round(hourly.dew_point_2m[idx]) : null,
          uvIndex: hourly.uv_index?.[idx] ?? 0,
          pressure: hourly.surface_pressure?.[idx],
          runScore: score,
        };
      })
    : [];

  // Running score for now
  const runNow = c ? calcRunScore(
    c.temperature_2m, c.relative_humidity_2m,
    c.wind_speed_10m, c.precipitation ?? 0,
    c.uv_index ?? 0, unit
  ) : null;

  // Best run window today (start + end while score stays decent)
  const bestRunWindow = (() => {
    if (!hourlySlice.length) return null;
    let bestIdx = -1, bestScore = 0;
    hourlySlice.slice(0, 13).forEach((h, i) => {
      const hr = new Date(h.time).getHours();
      if (hr < 6 || hr > 21) return;
      if (h.runScore > bestScore) { bestScore = h.runScore; bestIdx = i; }
    });
    if (bestIdx === -1) return null;
    const threshold = Math.max(38, Math.round(bestScore * 0.78));
    let endIdx = bestIdx;
    for (let i = bestIdx + 1; i < Math.min(hourlySlice.length, bestIdx + 6); i++) {
      const hr = new Date(hourlySlice[i].time).getHours();
      if (hr > 21) break;
      if (hourlySlice[i].runScore >= threshold) endIdx = i;
      else break;
    }
    return { start: hourlySlice[bestIdx], end: hourlySlice[endIdx], score: bestScore };
  })();

  const tempC = c ? (unit === 'F' ? (c.temperature_2m - 32) * 5 / 9 : c.temperature_2m) : 15;

  // Pressure trend from next 6 hourly readings
  const pTrend = pressureTrend(hourly?.surface_pressure?.slice(nowHourIdx, nowHourIdx + 6));
  // Moon phase
  const moon = moonPhase();
  // Best run day this week
  const bestRunDaySugg = bestRunDay(daily, unit);

  // Daily temp range for bar
  const allTemps = daily ? [...daily.temperature_2m_max, ...daily.temperature_2m_min] : [0, 30];
  const tMin = Math.min(...allTemps), tRange = Math.max(...allTemps) - tMin || 1;

  // Precip summary — only reference future hours, never a time that has already passed
  const precipSummary = (() => {
    if (!hourlySlice.length) return 'No precipitation expected in the next 24 hours.';
    const now = new Date();
    const rainy = hourlySlice.filter(h => h.precipProb > 50 && new Date(h.time) > now);
    if (!rainy.length) return 'No precipitation expected in the next 24 hours.';
    const h = new Date(rainy[0].time).getHours();
    const label = h === 0 ? 'midnight' : h < 12 ? `${h}am` : h === 12 ? 'noon' : `${h - 12}pm`;
    return `Precipitation expected around ${label}.`;
  })();

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (status === 'locating' || (status === 'loading' && !weather)) {
    return (
      <div className="app" style={{ background: 'linear-gradient(160deg,#080c18,#0f1428)' }}>
        <div className="app-bg" />
        <div className="loading-screen">
          <div className="spinner" />
          <div className="load-label">{status === 'locating' ? 'Finding your location…' : 'Fetching weather…'}</div>
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="app" style={{ background: 'linear-gradient(160deg,#080c18,#0f1428)' }}>
        <div className="app-bg" />
        <div className="error-screen">
          <div className="error-msg">{errorMsg}</div>
          <button className="retry-btn" onClick={() => location && load(location.lat, location.lon, location.name)}>Try Again</button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`app app-bg--${wxInfo?.bg ?? 'clear'}`} style={{ background: bg }}>
      <div className="app-bg" />
      <div className="page-wrap">

      {/* ── Header ── */}
      <div className="header">
        <div style={{ position: 'relative', maxWidth: 440, width: '100%' }}>
          <form className="search-form" onSubmit={e => { e.preventDefault(); suggestions.length && pickSuggestion(suggestions[0]); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={searchQ} onChange={onSearchChange} placeholder="Search city…"
              onBlur={() => setTimeout(() => setSuggestions([]), 200)} />
            {searchQ && (
              <button type="button" className="icon-btn" onClick={() => { setSearchQ(''); setSuggestions([]); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </form>
          {suggestions.length > 0 && (
            <div className="suggest-drop">
              {suggestions.map((r, i) => (
                <div key={i} className="suggest-item" onMouseDown={() => pickSuggestion(r)}>
                  <span className="suggest-name">{r.name}</span>
                  <span className="suggest-sub">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {weather && (
          <button className="icon-btn save-btn" onClick={toggleSave}
            title={isSaved ? 'Remove from saved' : 'Save location'}
            style={{ color: isSaved ? '#FFD54F' : undefined }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
        )}
        <button className="icon-btn locate-btn" onClick={locateMe} title="Use my location">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7" opacity="0.25"/>
          </svg>
        </button>
        <div className="unit-toggle">
          <button className={`unit-btn${unit==='C'?' active':''}`} onClick={() => setUnit('C')}>°C</button>
          <button className={`unit-btn${unit==='F'?' active':''}`} onClick={() => setUnit('F')}>°F</button>
        </div>
      </div>

      {/* Saved locations chips */}
      {savedLocs.length > 0 && (
        <div className="saved-locs">
          {savedLocs.map((l, i) => (
            <div key={i} className={`saved-loc-chip${location?.name === l.name ? ' active' : ''}`}>
              <span onClick={() => setLocation(l)}>{l.name.split(',')[0]}</span>
              <button className="saved-loc-remove" title="Remove"
                onClick={e => {
                  e.stopPropagation();
                  const updated = savedLocs.filter((_, j) => j !== i);
                  setSavedLocs(updated);
                  localStorage.setItem('weather-saved', JSON.stringify(updated));
                }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      {c && daily && (
        <div className="hero">
          <div className="hero-location">
            <div className="location-name">{weather.locationName}</div>
            <div className="location-time">
              {now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
              {' · '}{now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
            </div>
            {lastUpdated && (
              <div className="location-updated">
                Updated {lastUpdated.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
              </div>
            )}
          </div>
          <div className="hero-body">
            <div className="hero-icon-temp">
              <WxIcon code={c.weather_code} size={120} isDay={isDay} />
              <div className="temperature-display">
                {Math.round(c.temperature_2m)}<span className="temperature-unit">°{unit}</span>
              </div>
            </div>
            <div className="hero-meta">
              <div className="condition-label">{wxInfo.label}</div>
              <div className="feels-like">Feels like {Math.round(c.apparent_temperature)}°{unit}</div>
              <div className="high-low">
                <span className="hi">H: {Math.round(daily.temperature_2m_max[0])}°</span>
                <span className="sep">·</span>
                <span className="lo">L: {Math.round(daily.temperature_2m_min[0])}°</span>
              </div>
              <div className="summary-text">{precipSummary}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="main-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="col-left">

          {/* Temperature curve */}
          {hourlySlice.length > 0 && (() => {
            const n = hourlySlice.length;
            const temps = hourlySlice.map(h => h.temp);
            const feels = hourlySlice.map(h => h.feelsLike);
            const allV = [...temps, ...feels];
            const vMin = Math.min(...allV) - 2;
            const vMax = Math.max(...allV) + 2;
            const vRange = vMax - vMin || 1;
            const W = 1000, H = 160;
            const toX = i => (i / (n - 1)) * W;
            const toY = v => H * 0.9 - ((v - vMin) / vRange) * H * 0.82;
            function buildCurve(vals) {
              return vals.map((v, i) => {
                if (i === 0) return `M${toX(i).toFixed(1)},${toY(v).toFixed(1)}`;
                const mx = ((toX(i - 1) + toX(i)) / 2).toFixed(1);
                return `C${mx},${toY(vals[i-1]).toFixed(1)} ${mx},${toY(v).toFixed(1)} ${toX(i).toFixed(1)},${toY(v).toFixed(1)}`;
              }).join(' ');
            }
            const tempPath = buildCurve(temps);
            const feelsPath = buildCurve(feels);
            return (
              <div className="section">
                <div className="card">
                  <div className="card-label">🌡 Temperature — Next 24 Hours</div>
                  <div className="temp-chart-wrap" style={{ position: 'relative' }}>
                    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="temp-svg">
                      <defs>
                        <linearGradient id="tcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFCC80" stopOpacity="0.2"/>
                          <stop offset="100%" stopColor="#FFCC80" stopOpacity="0.02"/>
                        </linearGradient>
                      </defs>
                      <path d={`${tempPath} L${W},${H} L0,${H} Z`} fill="url(#tcGrad)"/>
                      <line x1="0" y1="0" x2="0" y2={H} stroke="rgba(255,255,255,0.22)" strokeWidth="6" vectorEffect="non-scaling-stroke"/>
                      <path d={feelsPath} fill="none" stroke="#4FC3F7" strokeWidth="6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 8" opacity="0.7"/>
                      <path d={tempPath} fill="none" stroke="#FFCC80" strokeWidth="7" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {/* Hover columns — direct state, no Tip wrapper needed */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', display: 'flex' }}>
                      {hourlySlice.filter((_, i) => i % 3 === 0).map((h, di) => (
                        <div key={di} style={{ flex: 1, height: '100%', cursor: 'crosshair' }}
                          onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setTempHover({ x: r.left + r.width / 2, y: r.top, h }); }}
                          onMouseLeave={() => setTempHover(null)} />
                      ))}
                    </div>
                    {tempHover && createPortal(
                      <div className="tip-popup" style={{ top: tempHover.y, left: tempHover.x, width: 175 }}>
                        <div className="tip-content">
                          <div className="tip-row"><span>{fmtHour(tempHover.h.time, tempHover.h.isNow)}</span></div>
                          <div className="tip-row"><span>Temp</span><strong style={{ color: '#FFCC80' }}>{tempHover.h.temp}°{unit}</strong></div>
                          <div className="tip-row"><span>Feels like</span><strong style={{ color: '#4FC3F7' }}>{tempHover.h.feelsLike}°{unit}</strong></div>
                          <div className="tip-row"><span>Humidity</span><strong>{tempHover.h.humidity}%</strong></div>
                          {tempHover.h.precipProb > 0 && <div className="tip-row"><span>Rain chance</span><strong>{tempHover.h.precipProb}%</strong></div>}
                          {tempHover.h.cloudCover != null && <div className="tip-row"><span>Cloud</span><strong>{tempHover.h.cloudCover}%</strong></div>}
                        </div>
                      </div>,
                      document.body
                    )}
                    <div className="temp-chart-footer">
                      <div className="temp-time-labels">
                        {[0, 6, 12, 18, 24].map(i => <span key={i}>{i === 0 ? 'Now' : fmtHour(hourlySlice[i].time, false)}</span>)}
                      </div>
                      <div className="temp-chart-legend">
                        <span style={{ color: '#FFCC80' }}>— Actual</span>
                        <span style={{ color: '#4FC3F7' }}>– – Feels like</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Hourly */}
          {hourlySlice.length > 0 && (
            <div className="section">
              <div className="card card--hourly">
                <div className="card-label">🕐 Hourly Forecast</div>
                <div className="hourly-scroll">
                  {hourlySlice.map((h, i) => (
                    <div key={i} className={`hour-item${h.isNow ? ' now' : ''}`}>
                      <div className="hour-time">{fmtHour(h.time, h.isNow)}</div>
                      <div className="hour-icon"><WxIcon code={h.wxCode} size={26} isDay={new Date(h.time).getHours() >= 6 && new Date(h.time).getHours() < 21 ? 1 : 0} /></div>
                      <div className="hour-temp">{h.temp}°</div>
                      {h.precipProb > 10 && <div className="hour-precip-prob">💧{h.precipProb}%</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Air Quality & Pollen */}
          {aq && (
            <div className="section">
              <div className="card">
                <div className="card-label">🌿 Air Quality &amp; Pollen</div>
                <div className="aq-row">
                  {/* AQI circle */}
                  <div className="aq-circle" style={{ borderColor: aqiColor(aq.european_aqi) }}>
                    <div className="aq-num" style={{ color: aqiColor(aq.european_aqi) }}>
                      {aq.european_aqi != null ? Math.round(aq.european_aqi) : '–'}
                    </div>
                    <div className="aq-label" style={{ color: aqiColor(aq.european_aqi) }}>AQI</div>
                    <div className="aq-status" style={{ color: aqiColor(aq.european_aqi) }}>
                      {aqiLabel(aq.european_aqi)}
                    </div>
                  </div>

                  {/* Pollen factors */}
                  <div className="pollen-factors">
                    {[
                      { label: 'Grass', val: aq.grass_pollen, type: 'grass' },
                      { label: 'Tree', val: Math.max(aq.birch_pollen ?? 0, aq.alder_pollen ?? 0), type: 'tree' },
                      { label: 'Ragweed', val: aq.ragweed_pollen, type: 'weed' },
                    ].map(p => {
                      const lvl = pollenLevel(p.val, p.type);
                      return (
                        <Tip key={p.label} width={200} content={
                          <div className="tip-content">
                            <div className="tip-row"><span>{p.label} pollen</span><strong>{p.val != null ? `${Math.round(p.val)} grains/m³` : 'No data'}</strong></div>
                            <div className="tip-row"><span>Level</span><strong style={{ color: pollenColor(lvl.score) }}>{lvl.label}</strong></div>
                            <div className="tip-why">
                              {p.label === 'Grass' ? 'Affects most allergy sufferers. Peaks May–July.' :
                               p.label === 'Tree' ? 'Birch & alder. Peaks Feb–May.' :
                               'Ragweed. Peaks Aug–Oct. High impact on hay fever.'}
                            </div>
                          </div>
                        }>
                          <div className="pollen-factor">
                            <div className="pollen-factor-header">
                              <span className="pollen-factor-label">{p.label}</span>
                              <span className="pollen-factor-val" style={{ color: pollenColor(lvl.score) }}>{lvl.label}</span>
                            </div>
                            <div className="pollen-bar-track">
                              <div className="pollen-bar-fill" style={{ width: `${lvl.pct}%`, background: pollenColor(lvl.score) }} />
                            </div>
                          </div>
                        </Tip>
                      );
                    })}
                  </div>
                </div>

                {/* PM sub-row */}
                {(aq.pm2_5 != null || aq.pm10 != null) && (
                  <div className="aq-pm-row">
                    {aq.pm2_5 != null && <span>PM2.5 <strong>{Math.round(aq.pm2_5)} μg/m³</strong></span>}
                    {aq.pm10  != null && <span>PM10 <strong>{Math.round(aq.pm10)} μg/m³</strong></span>}
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>European Air Quality Index</span>
                  </div>
                )}

                {/* UV Index smooth area chart */}
                {(() => {
                  const uvHrs = hourlySlice.filter(h => { const hr = new Date(h.time).getHours(); return hr >= 6 && hr <= 20; });
                  if (!uvHrs.length) return null;
                  const peak = Math.max(...uvHrs.map(h => h.uvIndex ?? 0), 0.1);
                  const peakColor = peak >= 11 ? '#CE93D8' : peak >= 8 ? '#EF9A9A' : peak >= 6 ? '#FFB74D' : peak >= 3 ? '#FFD54F' : '#80DEEA';
                  const n = uvHrs.length;
                  const W = 1000, H = 200;
                  // Build smooth cubic bezier path
                  const xs = uvHrs.map((_, i) => (i / (n - 1)) * W);
                  const ys = uvHrs.map(h => H - ((h.uvIndex ?? 0) / peak) * H * 0.92);
                  const linePts = uvHrs.map((_, i) => {
                    if (i === 0) return `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
                    const cp1x = (xs[i - 1] + (xs[i] - xs[i - 1]) / 2).toFixed(1);
                    const cp2x = cp1x;
                    return `C${cp1x},${ys[i-1].toFixed(1)} ${cp2x},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`;
                  }).join(' ');
                  const areaPath = `${linePts} L${W},${H} L0,${H} Z`;
                  const tickHrs = uvHrs.filter(h => new Date(h.time).getHours() % 3 === 0);
                  return (
                    <div className="uv-chart-section">
                      <div className="uv-chart-label">
                        UV Index — Peak: <span style={{ color: peakColor }}>{peak.toFixed(1)} ({uvLabel(peak)})</span>
                      </div>
                      <div className="uv-svg-wrap" style={{ position: 'relative' }}>
                        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="uv-svg">
                          <defs>
                            <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={peakColor} stopOpacity="0.45"/>
                              <stop offset="100%" stopColor={peakColor} stopOpacity="0.03"/>
                            </linearGradient>
                          </defs>
                          <path d={areaPath} fill="url(#uvGrad)"/>
                          <path d={linePts} fill="none" stroke={peakColor} strokeWidth="8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {/* Hover columns — direct state, no Tip wrapper needed */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '28px', display: 'flex' }}>
                          {uvHrs.filter((_, i) => i % 2 === 0).map((h, di) => (
                            <div key={di} style={{ flex: 1, height: '100%', cursor: 'crosshair' }}
                              onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setUvHover({ x: r.left + r.width / 2, y: r.top, h, peakColor }); }}
                              onMouseLeave={() => setUvHover(null)} />
                          ))}
                        </div>
                        {uvHover && createPortal(
                          <div className="tip-popup" style={{ top: uvHover.y, left: uvHover.x, width: 170 }}>
                            <div className="tip-content">
                              <div className="tip-row"><span>{fmtHour(uvHover.h.time, false)}</span></div>
                              <div className="tip-row"><span>UV Index</span><strong style={{ color: uvHover.peakColor }}>{(uvHover.h.uvIndex ?? 0).toFixed(1)}</strong></div>
                              <div className="tip-row"><span>Risk</span><strong>{uvLabel(uvHover.h.uvIndex ?? 0)}</strong></div>
                              <div className="tip-row"><span>Sunscreen</span><strong>{(uvHover.h.uvIndex ?? 0) >= 3 ? 'SPF 30+ advised' : 'Not needed'}</strong></div>
                            </div>
                          </div>,
                          document.body
                        )}
                        <div className="uv-time-labels">
                          {tickHrs.map((h, i) => {
                            const hr = new Date(h.time).getHours();
                            return <span key={i}>{hr < 12 ? `${hr}am` : hr === 12 ? '12pm' : `${hr - 12}pm`}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="col-right">

          {/* Running Conditions */}
          {runNow && c && (
            <div className="section">
              <div className="card run-card">
                <div className="card-label">🏃 Running Conditions</div>

                {/* Score circle + factors */}
                <div className="run-score-row">
                  <div className="run-score-circle" style={{ borderColor: runColor(runNow.score) }}>
                    <div className="run-score-num" style={{ color: runColor(runNow.score) }}>{runNow.score}</div>
                    <div className="run-score-label" style={{ color: runColor(runNow.score) }}>{runLabel(runNow.score)}</div>
                  </div>

                  {/* Factor bars */}
                  <div className="run-factors">
                    {[
                      {
                        label: 'Temperature', icon: '🌡️', score: runNow.tScore,
                        value: `${Math.round(c.temperature_2m)}°${unit}`,
                        why: tempC >= 8 && tempC <= 15 ? 'Perfect — ideal running range' :
                             tempC > 15 && tempC <= 20 ? 'Slightly warm but comfortable' :
                             tempC > 20 && tempC <= 27 ? 'Warm — pace down & hydrate' :
                             tempC > 27 ? 'Hot — slow down, carry water' :
                             tempC >= 3 ? 'Cool — warm up well first' :
                             tempC >= 0 ? 'Cold — dress in warm layers' : 'Very cold — ice risk',
                        ideal: '8–15°C / 46–59°F',
                      },
                      {
                        label: 'Wind', icon: '💨', score: runNow.wScore,
                        value: `${Math.round(c.wind_speed_10m)} ${unit === 'F' ? 'mph' : 'km/h'} ${windDir(c.wind_direction_10m)}`,
                        why: c.wind_speed_10m <= (unit==='F'?6:10)  ? 'Calm — no impact on pace' :
                             c.wind_speed_10m <= (unit==='F'?12:20) ? 'Light breeze — barely noticeable' :
                             c.wind_speed_10m <= (unit==='F'?20:32) ? 'Moderate — slight resistance' :
                             c.wind_speed_10m <= (unit==='F'?30:48) ? 'Strong — noticeably tiring' : 'Very strong — tough going',
                        ideal: 'Below 20 km/h / 12 mph',
                      },
                      {
                        label: 'Rain', icon: '🌧️', score: runNow.pScore,
                        value: hourlySlice.length > 0 ? `${hourlySlice[0].precipProb}% chance` : `${(c.precipitation ?? 0).toFixed(1)} mm/h`,
                        why: runNow.pScore >= 90 ? 'Dry — ideal conditions' :
                             runNow.pScore >= 72 ? 'Very low chance of rain' :
                             runNow.pScore >= 42 ? 'Moderate risk — consider waterproof' :
                             runNow.pScore >= 18 ? 'Likely wet — dress for rain' : 'Heavy rain expected',
                        ideal: 'Under 10% probability',
                      },
                      {
                        label: 'Humidity', icon: '💧', score: runNow.hScore,
                        value: `${c.relative_humidity_2m}%`,
                        why: c.relative_humidity_2m <= 50 ? 'Low — comfortable, easy breathing' :
                             c.relative_humidity_2m <= 65 ? 'Moderate — fine for running' :
                             c.relative_humidity_2m <= 75 ? 'Humid — feels warmer than it is' :
                             c.relative_humidity_2m <= 85 ? 'Very humid — slow your pace' : 'Oppressive — take it very easy',
                        ideal: 'Below 65%',
                      },
                    ].map(f => (
                      <Tip key={f.label} width={230} content={
                        <div className="tip-content">
                          <div className="tip-row">
                            <span>Now</span>
                            <strong style={{ color: runColor(f.score) }}>{f.value}</strong>
                          </div>
                          <div className="tip-why">{f.why}</div>
                          <div className="tip-row">
                            <span>Ideal</span><strong>{f.ideal}</strong>
                          </div>
                          <div className="tip-row">
                            <span>Score</span><strong style={{ color: runColor(f.score) }}>{f.score}/100</strong>
                          </div>
                        </div>
                      }>
                        <div className="run-factor">
                          <div className="run-factor-header">
                            <span className="run-factor-label">{f.icon} {f.label}</span>
                            <span className="run-factor-val" style={{ color: runColor(f.score) }}>{f.score}</span>
                          </div>
                          <div className="run-factor-track">
                            <div className="run-factor-fill" style={{ width: `${f.score}%`, background: runColor(f.score) }} />
                          </div>
                        </div>
                      </Tip>
                    ))}
                  </div>
                </div>

                {/* Best window */}
                {bestRunWindow && (
                  <div className="run-best-time">
                    <span className="run-best-label">Best window today</span>
                    <span className="run-best-val" style={{ color: runColor(bestRunWindow.score) }}>
                      {fmtHour(bestRunWindow.start.time, bestRunWindow.start.isNow)}
                      {bestRunWindow.end.time !== bestRunWindow.start.time && ` – ${fmtHour(bestRunWindow.end.time, false)}`}
                      {' · '}{bestRunWindow.start.temp}° · {runLabel(bestRunWindow.score)}
                    </span>
                  </div>
                )}

                {/* Best day this week */}
                {bestRunDaySugg && (
                  <div className="run-best-time">
                    <span className="run-best-label">Best day this week</span>
                    <span className="run-best-val" style={{ color: runColor(bestRunDaySugg.score) }}>
                      {bestRunDaySugg.day} · {runLabel(bestRunDaySugg.score)} ({bestRunDaySugg.score})
                    </span>
                  </div>
                )}

                {/* Gear */}
                <div className="run-gear">
                  <div className="run-gear-label">👕 What to wear</div>
                  <div className="run-gear-text">{runGear(tempC)}</div>
                </div>

                {/* Tips */}
                <div className="run-tips">
                  {runNow.score >= 72 && <div className="run-tip good">Great day for a run — enjoy it!</div>}
                  {c.wind_speed_10m > (unit === 'F' ? 19 : 30) && <div className="run-tip warn">Strong headwinds — start into the wind, return with it.</div>}
                  {c.relative_humidity_2m > 80 && <div className="run-tip warn">High humidity — slow your pace and hydrate well.</div>}
                  {(c.uv_index ?? 0) > 6 && <div className="run-tip warn">High UV — apply sunscreen and run early or late.</div>}
                  {tempC > 24 && <div className="run-tip warn">Hot out — run early morning, carry water.</div>}
                  {tempC < 1 && <div className="run-tip warn">Near freezing — watch for ice and warm up indoors first.</div>}
                  {runNow.score < 38 && <div className="run-tip warn">Tough conditions — consider a shorter easier effort.</div>}
                </div>
              </div>
            </div>
          )}

          {/* Sunrise / Sunset */}
          {daily && (
            <div className="section">
              <div className="card">
                <div className="card-label">Sun — Sunrise &amp; Sunset</div>
                <div className="sun-row">
                  <div className="sun-item">
                    {/* Sunrise SVG icon */}
                    <svg width="44" height="44" viewBox="0 0 48 48" style={{ display:'block' }}>
                      <line x1="5" y1="30" x2="43" y2="30" stroke="#FFCC80" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10,30 A14,14,0,0,1,38,30Z" fill="#FDD835"/>
                      <line x1="24" y1="10" x2="24" y2="6"  stroke="#FDD835" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="36" y1="16" x2="39" y2="13" stroke="#FDD835" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="12" y1="16" x2="9"  y2="13" stroke="#FDD835" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="17" y1="40" x2="24" y2="34" stroke="#FFCC80" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="31" y1="40" x2="24" y2="34" stroke="#FFCC80" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <div className="sun-label">Sunrise</div>
                    <div className="sun-time">{fmtTime(daily.sunrise[0])}</div>
                  </div>
                  <div className="sun-daylight">
                    {(() => { const hrs = Math.round((new Date(daily.sunset[0]) - new Date(daily.sunrise[0])) / 3600000 * 10) / 10; return `${hrs}h daylight`; })()}
                    <div style={{ marginTop: 10, fontSize: 24, lineHeight: 1 }}>{moon.emoji}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4, textAlign: 'center', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{moon.name}</div>
                  </div>
                  <div className="sun-item">
                    {/* Sunset SVG icon */}
                    <svg width="44" height="44" viewBox="0 0 48 48" style={{ display:'block' }}>
                      <line x1="5" y1="26" x2="43" y2="26" stroke="#80DEEA" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M10,26 A14,14,0,0,1,38,26Z" fill="#FF8A65"/>
                      <line x1="24" y1="6"  x2="24" y2="10" stroke="#FF8A65" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="36" y1="13" x2="39" y2="16" stroke="#FF8A65" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="12" y1="13" x2="9"  y2="16" stroke="#FF8A65" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="17" y1="34" x2="24" y2="40" stroke="#80DEEA" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="31" y1="34" x2="24" y2="40" stroke="#80DEEA" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <div className="sun-label">Sunset</div>
                    <div className="sun-time">{fmtTime(daily.sunset[0])}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          {c && (
            <div className="section">
              <div className="details-grid">

                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Direction</span><strong>{windDir(c.wind_direction_10m)} ({Math.round(c.wind_direction_10m)}°)</strong></div>
                    <div className="tip-row"><span>Max today</span><strong>{Math.round(daily?.wind_speed_10m_max[0] ?? 0)} {unit==='F'?'mph':'km/h'}</strong></div>
                    <div className="tip-row"><span>For running</span><strong style={{color: runColor(runNow?.wScore??80)}}>{runNow?.wScore >= 80 ? 'Ideal' : runNow?.wScore >= 55 ? 'Manageable' : 'Challenging'}</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">💨 Wind</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CompassRose deg={c.wind_direction_10m} size={64} />
                      <div>
                        <div className="detail-value" style={{ fontSize: 30, lineHeight: 1 }}>{Math.round(c.wind_speed_10m)}<span className="detail-unit">{unit==='F'?'mph':'km/h'}</span></div>
                        <div className="detail-sub" style={{ marginTop: 5 }}>{windDir(c.wind_direction_10m)} · {c.wind_speed_10m < (unit==='F'?12:20) ? 'Light' : c.wind_speed_10m < (unit==='F'?25:40) ? 'Moderate' : 'Strong'}</div>
                      </div>
                    </div>
                  </div>
                </Tip>

                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Humidity</span><strong>{c.relative_humidity_2m}%</strong></div>
                    <div className="tip-row"><span>Comfort</span><strong>{c.relative_humidity_2m < 30 ? 'Dry — lips may chap' : c.relative_humidity_2m < 60 ? 'Comfortable' : c.relative_humidity_2m < 80 ? 'Humid — feels warmer' : 'Very humid — heavy air'}</strong></div>
                    <div className="tip-row"><span>Running</span><strong style={{color: runColor(runNow?.hScore??80)}}>{runNow?.hScore >= 80 ? 'Great' : runNow?.hScore >= 55 ? 'OK' : 'Tough'}</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">💧 Humidity</div>
                    <div className="detail-value">{c.relative_humidity_2m}<span className="detail-unit">%</span></div>
                    <div className="humidity-bar"><div className="humidity-fill" style={{ width: `${c.relative_humidity_2m}%` }} /></div>
                    <div className="detail-sub">{c.relative_humidity_2m < 30 ? 'Dry' : c.relative_humidity_2m < 60 ? 'Comfortable' : 'Humid'}</div>
                  </div>
                </Tip>

                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Index</span><strong>{Math.round(c.uv_index ?? 0)}</strong></div>
                    <div className="tip-row"><span>Risk</span><strong>{uvLabel(c.uv_index ?? 0)}</strong></div>
                    <div className="tip-row"><span>Sunscreen</span><strong>{(c.uv_index ?? 0) >= 3 ? 'SPF 30+ recommended' : 'Not needed'}</strong></div>
                    <div className="tip-row"><span>Max today</span><strong>{Math.round(daily?.uv_index_max[0] ?? 0)}</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">☀️ UV Index</div>
                    <div className="detail-value">{Math.round(c.uv_index ?? 0)}</div>
                    <div className="uv-bar"><div className="uv-fill" style={{ width: `${Math.min(100, ((c.uv_index??0)/12)*100)}%` }} /></div>
                    <div className="detail-sub">{uvLabel(c.uv_index ?? 0)}</div>
                  </div>
                </Tip>

                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Pressure</span><strong>{Math.round(c.surface_pressure)} hPa</strong></div>
                    <div className="tip-row"><span>Status</span><strong>{pressureLabel(c.surface_pressure)}</strong></div>
                    <div className="tip-row"><span>Normal</span><strong>1013 hPa</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">🔽 Pressure</div>
                    <div className="detail-value">{Math.round(c.surface_pressure)}<span className="detail-unit">hPa</span></div>
                    <div className="detail-sub">{pressureLabel(c.surface_pressure)}</div>
                    <div className="detail-sub" style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: pTrend.color }}>
                      {pTrend.arrow} {pTrend.label}
                    </div>
                  </div>
                </Tip>

                {c.visibility !== undefined && (
                  <Tip width={200} content={
                    <div className="tip-content">
                      <div className="tip-row"><span>Visibility</span><strong>{c.visibility >= 1000 ? `${Math.round(c.visibility/1000)} km` : `${Math.round(c.visibility)} m`}</strong></div>
                      <div className="tip-row"><span>Conditions</span><strong>{visLabel(c.visibility)}</strong></div>
                      <div className="tip-row"><span>For running</span><strong>{c.visibility < 1000 ? 'Wear hi-vis gear' : 'Fine'}</strong></div>
                    </div>
                  }>
                    <div className="detail-card">
                      <div className="detail-label">👁 Visibility</div>
                      <div className="detail-value">
                        {c.visibility >= 1000 ? Math.round(c.visibility/1000) : Math.round(c.visibility)}
                        <span className="detail-unit">{c.visibility >= 1000 ? 'km' : 'm'}</span>
                      </div>
                      <div className="detail-sub">{visLabel(c.visibility)}</div>
                    </div>
                  </Tip>
                )}

                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Today's rain</span><strong>{daily?.precipitation_sum[0].toFixed(1)} mm</strong></div>
                    <div className="tip-row"><span>Probability</span><strong>{daily?.precipitation_probability_max[0]}%</strong></div>
                    <div className="tip-row"><span>Currently</span><strong>{c.precipitation?.toFixed(1) ?? '0.0'} mm/h</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">🌧 Rain Today</div>
                    <div className="detail-value">{daily?.precipitation_sum[0].toFixed(1) ?? '–'}<span className="detail-unit">mm</span></div>
                    <div className="detail-sub">{daily?.precipitation_probability_max[0]}% chance</div>
                  </div>
                </Tip>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom section: 7-day (left) aligned with extra detail cards (right) ── */}
      {(daily || c) && (
        <div className="bottom-section">

          {/* 7-day forecast */}
          {daily && (
            <div className="card">
              <div className="card-label">📅 7-Day Forecast</div>
              <div className="daily-list">
                {daily.time.map((dateStr, i) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const name = i === 0 ? 'Today' : DAY_NAMES[d.getDay()];
                  const lo = Math.round(daily.temperature_2m_min[i]);
                  const hi = Math.round(daily.temperature_2m_max[i]);
                  const precip = daily.precipitation_probability_max[i];
                  const loFrac = (lo - tMin) / tRange;
                  const hiFrac = (hi - tMin) / tRange;
                  const isHovered = hoveredDay === i;
                  return (
                    <div key={dateStr} className={`day-row${isHovered ? ' hovered' : ''}`}
                      onMouseEnter={() => setHoveredDay(i)}
                      onMouseLeave={() => setHoveredDay(null)}>
                      <div className="day-name">{name}</div>
                      <div className="day-icon"><WxIcon code={daily.weather_code[i]} size={28} isDay={1} /></div>
                      <div className="day-precip">
                        {precip > 10 && <span>{precip}%</span>}
                        {daily.precipitation_sum[i] > 0.2 && <span className="day-precip-mm">{daily.precipitation_sum[i].toFixed(1)}mm</span>}
                      </div>
                      <div className="day-bar-track">
                        <div className="day-bar-fill" style={{ left: `${loFrac*100}%`, width: `${(hiFrac-loFrac)*100}%` }} />
                      </div>
                      <div className="day-lo">{lo}°</div>
                      <div className="day-hi">{hi}°</div>
                      {isHovered && (
                        <div className="day-hover-detail">
                          <span>🌧 {daily.precipitation_sum[i].toFixed(1)}mm</span>
                          <span>☀️ UV {Math.round(daily.uv_index_max[i])}</span>
                          <span>💨 {Math.round(daily.wind_speed_10m_max[i])}{unit==='F'?'mph':'km/h'}</span>
                          <span>🌅 {fmtTime(daily.sunrise[i])}</span>
                          <span>🌇 {fmtTime(daily.sunset[i])}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra detail cards — stretch to match 7-day height */}
          {c && (
            <div className="bottom-extra-cards">
              {c.cloud_cover !== undefined && (
                <Tip width={200} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Cloud cover</span><strong>{c.cloud_cover}%</strong></div>
                    <div className="tip-row"><span>Status</span><strong>{cloudLabel(c.cloud_cover)}</strong></div>
                    <div className="tip-row"><span>Effect</span><strong>{c.cloud_cover > 80 ? 'Blocks most UV' : c.cloud_cover > 40 ? 'Filters some UV' : 'Full UV exposure'}</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">☁️ Cloud Cover</div>
                    <div className="detail-value">{c.cloud_cover}<span className="detail-unit">%</span></div>
                    <div className="cloud-bar"><div className="cloud-fill" style={{ width: `${c.cloud_cover}%` }} /></div>
                    <div className="detail-sub">{cloudLabel(c.cloud_cover)}</div>
                  </div>
                </Tip>
              )}
              {c.dew_point_2m !== undefined && (
                <Tip width={220} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Dew point</span><strong>{Math.round(c.dew_point_2m)}°{unit}</strong></div>
                    <div className="tip-row"><span>Comfort</span><strong>{dewComfort(c.dew_point_2m, unit)}</strong></div>
                    <div className="tip-why">Dew point is the temp at which air becomes saturated. Higher = more moisture in the air, feels stickier.</div>
                    <div className="tip-row"><span>Ideal</span><strong>Below 13°C / 55°F</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">💦 Dew Point</div>
                    <div className="detail-value">{Math.round(c.dew_point_2m)}<span className="detail-unit">°{unit}</span></div>
                    <div className="detail-sub">{dewComfort(c.dew_point_2m, unit)}</div>
                  </div>
                </Tip>
              )}
              {c.wind_gusts_10m !== undefined && (
                <Tip width={210} content={
                  <div className="tip-content">
                    <div className="tip-row"><span>Current gusts</span><strong>{Math.round(c.wind_gusts_10m)} {unit==='F'?'mph':'km/h'}</strong></div>
                    <div className="tip-row"><span>Max gusts today</span><strong>{Math.round(daily?.wind_gusts_10m_max?.[0] ?? c.wind_gusts_10m)} {unit==='F'?'mph':'km/h'}</strong></div>
                    <div className="tip-row"><span>Sustained</span><strong>{Math.round(c.wind_speed_10m)} {unit==='F'?'mph':'km/h'}</strong></div>
                  </div>
                }>
                  <div className="detail-card">
                    <div className="detail-label">💨 Wind Gusts</div>
                    <div className="detail-value">{Math.round(c.wind_gusts_10m)}<span className="detail-unit">{unit==='F'?'mph':'km/h'}</span></div>
                    <div className="detail-sub">Sustained {Math.round(c.wind_speed_10m)} {unit==='F'?'mph':'km/h'}</div>
                  </div>
                </Tip>
              )}
            </div>
          )}
        </div>
      )}

      <div className="footer">Weather · Open-Meteo · Updated {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>{/* end page-wrap */}
    </div>
  );
}
