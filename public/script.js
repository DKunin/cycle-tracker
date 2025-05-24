/* handles */
const qs   = sel => document.querySelector(sel);
const tEl  = qs('#time');
const dEl  = qs('#distance');
const sEl  = qs('#speed');
const btnS = qs('#start');
const btnP = qs('#stop');

/* runtime */
let watchId = null, timerId = null, wakeLock = null, fallbackVid = null;
let startMs = 0, previous = null, total = 0;

/* helpers */
const rad = deg => deg * Math.PI / 180;
function haversine(a, b) {
  const R=6371e3,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon),
        p1=rad(a.lat),p2=rad(b.lat),
        h = Math.sin(dLat/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

/* wake-lock */
async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => console.log('WakeLock released'));
    } else {
      // Safari/old iOS ≤ 15: 1-px looping video keeps display alive
      fallbackVid = document.createElement('video');
      fallbackVid.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDFpc29tAAAA...'; // 0.1 s silent black frame
      fallbackVid.loop = true; fallbackVid.playsInline = true; fallbackVid.muted = true; fallbackVid.style.display='none';
      document.body.appendChild(fallbackVid); await fallbackVid.play();
    }
  } catch(e) { console.warn('WakeLock error', e); }
}
async function releaseWakeLock() {
  if (wakeLock) { await wakeLock.release(); wakeLock = null; }
  if (fallbackVid) { fallbackVid.pause(); fallbackVid.remove(); fallbackVid = null; }
}

/* UI updaters */
function updateClock() {
  const secs = Math.floor((Date.now() - startMs) / 1000);
  tEl.textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
}
function updatePosition(pos) {
  const {latitude:lat, longitude:lon, speed:spd} = pos.coords, ts=pos.timestamp;
  if (previous) {
    total += haversine(previous,{lat,lon});
    dEl.textContent = (total/1000).toFixed(2);
  }
  let v = spd ?? (previous ? haversine(previous,{lat,lon})/((ts-previous.t)/1e3) : 0);
  sEl.textContent = v ? (v*3.6).toFixed(1) : '0.0';
  previous = {lat,lon,t:ts};
}
function geoErr(err){ alert(err.message); }

/* ctrl */
async function start() {
  if (!navigator.geolocation) { alert('Geolocation not supported'); return; }

  startMs = Date.now(); total = 0; previous = null;
  timerId = setInterval(updateClock,1_000);
  watchId = navigator.geolocation.watchPosition(updatePosition,geoErr,
            {enableHighAccuracy:true, maximumAge:10_000, timeout:15_000});
  btnS.disabled=true; btnP.disabled=false;

  await acquireWakeLock();

  // try to enter full-screen (it will silently fail on iOS Safari)
  if (document.documentElement.requestFullscreen) {
    try { await document.documentElement.requestFullscreen(); } catch{}
  }
}
async function stop() {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerId);
  btnS.disabled=false; btnP.disabled=true;
  await releaseWakeLock();
  if (document.fullscreenElement) document.exitFullscreen?.();
}

btnS.addEventListener('click', start, {passive:true});
btnP.addEventListener('click', stop,  {passive:true});
