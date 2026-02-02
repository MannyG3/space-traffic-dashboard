// app.js - connects to backend and renders satellites on Cesium globe
// (Ion token provided by you)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZmEzMDJiYy05Zjk5LTRhOTgtYWQzNy0wZmMyMDFhNGM3MTciLCJpZCI6MzM1OTQyLCJpYXQiOjE3NTYzMTgxNDV9.mtRXYB2I8MYJjAiRrwE2IA6YAE_hQPITspKSXgADEpM';

// Show loading indicator while Cesium initializes
const loadingEl = document.getElementById('loading');
if (loadingEl) loadingEl.style.display = 'block';

const viewer = new Cesium.Viewer('cesiumContainer', {
  shouldAnimate: true,
  timeline: true,
  animation: true,
  infoBox: false,
  selectionIndicator: false
});
viewer.scene.globe.enableLighting = true;
viewer.scene.globe.depthTestAgainstTerrain = false;

// Hide loading once Cesium is ready
viewer.cesiumWidget.creditContainer.style.display = "none";
if (loadingEl) loadingEl.style.display = 'none';

const LEO_COLOR = Cesium.Color.fromCssColorString("#ffcc00");
const GEO_COLOR = Cesium.Color.fromCssColorString("#ff4d4f");

const satEntities = {};
let selectedEntity = null;
let mute = false;

// ---------- UI ----------
const elTotal   = document.getElementById('count-total');
const elLEO     = document.getElementById('count-leo');
const elGEO     = document.getElementById('count-geo');
const elAlerts  = document.getElementById('count-alerts');
const alertsFeed = document.getElementById('alerts-feed');
const satInfo    = document.getElementById('sat-info');
const btnMute    = document.getElementById('btn-mute');
btnMute.onclick = () => { mute = !mute; btnMute.innerText = mute ? "Unmute" : "Mute"; };
document.getElementById('btn-center').onclick = () => viewer.camera.flyHome(1.2);

// ---------- Alerts sound ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function buzz() {
  if (mute) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(880, audioCtx.currentTime);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.7);
}

// ---------- Helpers ----------
function createDotImage(color, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, 2*Math.PI);
  ctx.fillStyle = color.toCssColorString();
  ctx.fill();
  return canvas.toDataURL();
}
function colorFor(sat) { return sat.category === 'LEO' ? LEO_COLOR : GEO_COLOR; }
function n(v, d=0){ const x = Number(v); return Number.isFinite(x) ? x : d; }

function pruneStaleEntities(nowSec, ttlSec = 600) { // 10 minutes
  Object.keys(satEntities).forEach(id => {
    const ent = satEntities[id];
    const sat = ent?.properties?.getValue ? ent.properties.getValue(Cesium.JulianDate.now()) : ent?.properties;
    const last = sat?.last_update ?? 0;
    if (nowSec - last > ttlSec) {
      if (selectedEntity && selectedEntity.id === ent.id) {
        selectedEntity = null;
        renderSelectedInfo(null);
      }
      viewer.entities.remove(ent);
      delete satEntities[id];
    }
  });
}

// ---------- Data fetching (WebSocket with polling fallback) ----------
let ws = null;
let reconnectDelay = 1000;
let usePolling = false;
let pollingInterval = null;

// Polling fallback for environments without WebSocket support (e.g., Vercel)
async function pollSnapshot() {
  try {
    const response = await fetch('/api/snapshot');
    if (response.ok) {
      const data = await response.json();
      handleSnapshot(data);
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.style.display = 'none';
    }
  } catch (e) {
    console.error("Polling error:", e);
  }
}

function startPolling() {
  if (pollingInterval) return;
  console.log("Starting polling mode");
  usePolling = true;
  pollSnapshot(); // Initial fetch
  pollingInterval = setInterval(pollSnapshot, 2000); // Poll every 2 seconds
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  usePolling = false;
}

function connectWS() {
  if (usePolling) return; // Don't try WebSocket if polling is active
  
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  try {
    ws = new WebSocket(`${proto}://${location.host}/ws/stream`);
  } catch (e) {
    console.log("WebSocket not supported, using polling");
    startPolling();
    return;
  }

  ws.onopen = () => {
    console.log("WS connected");
    reconnectDelay = 1000;
    stopPolling(); // Stop polling if WebSocket connects
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'snapshot') {
        handleSnapshot(msg.data);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
      }
    } catch (e) {
      console.error("WS parse error", e);
    }
  };

  ws.onerror = (e) => {
    console.warn("WS error", e);
  };

  ws.onclose = () => {
    console.log("WS closed");
    if (reconnectDelay > 5000) {
      // After several failed attempts, switch to polling
      console.log("Switching to polling mode");
      startPolling();
    } else {
      setTimeout(connectWS, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 10000);
    }
  };
}

// Start connection
connectWS();
// Also start polling immediately as fallback (will stop if WS connects)
setTimeout(() => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    startPolling();
  }
}, 3000);

// ---------- Entity management ----------
function updateOrCreateSat(sat) {
  const id = "sat-" + sat.satid;
  const lat = n(sat.satlat, null);
  const lon = n(sat.satlng, null);
  const altKm = n(sat.satalt, 0);

  if (lat == null || lon == null) return;
  const pos = Cesium.Cartesian3.fromDegrees(lon, lat, altKm * 1000);

  let ent = satEntities[id];
  const color = colorFor(sat);

  if (!ent) {
    ent = viewer.entities.add({
      id,
      name: sat.satname || String(sat.satid),
      position: pos,
      billboard: {
        image: createDotImage(color, 8),
        verticalOrigin: Cesium.VerticalOrigin.CENTER
      },
      label: {
        text: sat.satname || String(sat.satid),
        font: '12px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(10,0),
        show: false
      },
      properties: sat
    });
    satEntities[id] = ent;
    ent.description = `Satellite ${sat.satname || sat.satid}`;
  } else {
    ent.position = pos;
    ent.properties = sat;
    ent.billboard.image = createDotImage(color, 8);
    ent.name = sat.satname || String(sat.satid);
    ent.label.text = ent.name;
  }
}

// ---------- Snapshot handling ----------
function handleSnapshot(data) {
  const sats = data.sats || [];

  elTotal.innerText  = data.counts?.total ?? 0;
  elLEO.innerText    = data.counts?.leo ?? 0;
  elGEO.innerText    = data.counts?.geo ?? 0;
  elAlerts.innerText = data.counts?.alerts ?? 0;

  alertsFeed.innerHTML = '';
  if ((data.alerts || []).length > 0) buzz();
  (data.alerts || []).forEach(a => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
      <div>
        <div class="sat-name">${a.a} ↔ ${a.b}</div>
        <div class="sat-meta">${Number(a.dist_km).toFixed(2)} km</div>
      </div>
      <div><button class="btn" onclick="zoomToPair('${a.a.replace(/'/g,"\\'")}','${a.b.replace(/'/g,"\\'")}')">Zoom</button></div>
    `;
    alertsFeed.appendChild(div);
  });

  sats.forEach(updateOrCreateSat);
  pruneStaleEntities(Math.floor(Date.now()/1000));
}

// ---------- Zoom helpers ----------
window.zoomToPair = function(nameA, nameB) {
  let entA=null, entB=null;
  for (const k in satEntities) {
    const e = satEntities[k];
    if (e.name === nameA) entA = e;
    if (e.name === nameB) entB = e;
  }
  if (entA && entB) {
    const t = Cesium.JulianDate.now();
    const pA = entA.position.getValue(t);
    const pB = entB.position.getValue(t);
    if (pA && pB) {
      const mid = Cesium.Cartesian3.midpoint(pA, pB, new Cesium.Cartesian3());
      viewer.camera.flyTo({ destination: mid, duration: 1.2 });
    }
  }
};

function zoomToEntity(ent) {
  const t = Cesium.JulianDate.now();
  const p = ent.position.getValue(t);
  if (p) viewer.camera.flyTo({ destination: p, duration: 1.0 });
}

// ---------- Selection (click & hover) ----------
function renderSelectedInfo(sat) {
  if (!sat) {
    satInfo.innerHTML = "Click a satellite on the globe to view details.";
    return;
  }
  const lat = n(sat.satlat, null);
  const lon = n(sat.satlng, null);
  const alt = n(sat.satalt, null);
  const last = sat.last_update ? new Date(sat.last_update * 1000).toISOString() : "–";

  satInfo.innerHTML = `
    <div style="font-weight:700">${sat.satname || sat.satid}</div>
    <div class="sat-meta">Category: ${sat.category || "–"}</div>
    <div class="sat-meta">Position: ${lat==null||lon==null ? "–" : `${Math.abs(lat).toFixed(2)}° ${lat>=0?"N":"S"}, ${Math.abs(lon).toFixed(2)}° ${lon>=0?"E":"W"}`}</div>
    <div class="sat-meta">Altitude: ${alt!=null ? alt.toFixed(1) : "–"} km</div>
    <div class="sat-meta">Last update: ${last}</div>
    <div style="margin-top:10px; display:flex; gap:8px;">
      <button class="btn" id="btn-zoom-sel">Zoom</button>
      <button class="btn" id="btn-copy-id">Copy ID</button>
    </div>
  `;
  document.getElementById('btn-zoom-sel').onclick = () => { if (selectedEntity) zoomToEntity(selectedEntity); };
  document.getElementById('btn-copy-id').onclick = async () => {
    try {
      await navigator.clipboard.writeText(String(sat.satid));
      const b = document.getElementById('btn-copy-id');
      b.innerText = "Copied!"; setTimeout(()=> b.innerText = "Copy ID", 800);
    } catch {}
  };
}

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(function(click){
  const picked = viewer.scene.pick(click.position);
  if (Cesium.defined(picked) && picked.id) {
    if (selectedEntity && selectedEntity !== picked.id) {
      selectedEntity.label.show = false;
    }
    selectedEntity = picked.id;
    if (selectedEntity.label) selectedEntity.label.show = true;

    const bag = selectedEntity.properties;
    const sat = bag && typeof bag.getValue === 'function' ? bag.getValue(Cesium.JulianDate.now()) : bag;
    renderSelectedInfo(sat || null);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

handler.setInputAction(function(movement) {
  const picked = viewer.scene.pick(movement.endPosition);
  for (const k in satEntities) {
    const e = satEntities[k];
    if (!e) continue;
    if (selectedEntity && e.id === selectedEntity.id) {
      e.label.show = true; // keep selected visible
    } else {
      e.label.show = (picked && picked.id && picked.id.id === e.id);
    }
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// Initial camera pose
viewer.camera.flyHome(0);
