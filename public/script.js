/* DOM handles */
const tEl = document.getElementById("time");
const dEl = document.getElementById("distance");
const sEl = document.getElementById("speed");
const btnS = document.getElementById("start");
const btnP = document.getElementById("stop");

/* runtime state */
let watchId = null;
let timerId = null;
let startMs = 0;
let previous = null; // { lat, lon, t }
let total = 0; // metres

/* helpers */
const rad = (deg) => (deg * Math.PI) / 180;

function haversine(a, b) {
  const R = 6371e3; // earth radius in m
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* UI updaters */
function updateClock() {
  const secs = Math.floor((Date.now() - startMs) / 1000);
  tEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function updatePosition(pos) {
  const { latitude: lat, longitude: lon, speed: spd } = pos.coords;
  const ts = pos.timestamp;

  if (previous) {
    total += haversine(previous, { lat, lon });
    dEl.textContent = (total / 1000).toFixed(2);
  }

  let v = spd; // m /s from device
  if (v == null && previous) {
    const dt = (ts - previous.t) / 1000;
    if (dt > 0) v = haversine(previous, { lat, lon }) / dt;
  }
  sEl.textContent = v ? (v * 3.6).toFixed(1) : "0.0";

  previous = { lat, lon, t: ts };
}

function geoError(err) {
  alert(err.message);
}

/* control */
function start() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  startMs = Date.now();
  timerId = setInterval(updateClock, 1000);
  watchId = navigator.geolocation.watchPosition(updatePosition, geoError, {
    enableHighAccuracy: true,
  });

  btnS.disabled = true;
  btnP.disabled = false;
}

function stop() {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerId);

  btnS.disabled = false;
  btnP.disabled = true;
}

btnS.addEventListener("click", start);
btnP.addEventListener("click", stop);
