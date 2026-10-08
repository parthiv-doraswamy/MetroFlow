/* MetroFlow — polished schematic metro map rendered from the C++ network. */
window.MetroMap = (() => {
  const COLORS = {
    Blue: '#2563eb',
    Green: '#059669',
    Red: '#dc2626',
    Yellow: '#d97706'
  };

  const NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 1000;
  const VIEW_H = 560;
  let stations = [];
  let edges = [];
  let highlighted = new Set();
  let highlightedPath = [];
  let coords = new Map();
  let zoom = 1;
  let center = { x: VIEW_W / 2, y: VIEW_H / 2 };

  // Visual-only fallback topology for cases where the network endpoint is unavailable.
  // Routing itself still comes from the C++ graph engine.
  const FALLBACK_EDGES = [
    [1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],
    [10,11],[11,12],[12,5],[5,13],[13,14],[14,15],[15,16],
    [17,18],[18,19],[19,3],[3,20],[20,21],[21,22],[22,23],
    [24,25],[25,26],[26,13],[13,27],[27,28],[28,29],[29,30],
    [4,19],[6,20],[12,26],[7,28],[14,28]
  ].map(([from, to]) => ({ from, to }));

  async function ensureEdges() {
    if (edges.length) return;
    try {
      const n = await api.network();
      const remoteEdges = Array.isArray(n.edges) ? n.edges : [];
      if (remoteEdges.length) {
        edges = remoteEdges;
        return;
      }
    } catch (error) {
      console.warn('MetroFlow network API unavailable; using visual fallback topology.', error);
    }
    edges = FALLBACK_EDGES.slice();
    const status = document.getElementById('mapStatus');
    if (status) status.textContent = 'Metro network · offline fallback';
  }

  function lineColor(line) {
    const primary = String(line || '').split('/')[0];
    return COLORS[primary] || '#64748b';
  }

  function lineNames(line) {
    return String(line || '').split('/').map((x) => x.trim()).filter(Boolean);
  }

  function edgeLine(a, b) {
    const aLines = lineNames(a?.line);
    const bLines = lineNames(b?.line);
    const shared = aLines.find((line) => bLines.includes(line));
    return shared || aLines[0] || bLines[0] || 'Blue';
  }

  function project(list) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    list.forEach((s) => {
      minLat = Math.min(minLat, Number(s.lat));
      maxLat = Math.max(maxLat, Number(s.lat));
      minLng = Math.min(minLng, Number(s.lng));
      maxLng = Math.max(maxLng, Number(s.lng));
    });

    const P = 78;
    coords = new Map(list.map((s) => {
      const x = P + ((Number(s.lng) - minLng) / Math.max(1e-9, maxLng - minLng)) * (VIEW_W - 2 * P);
      const y = VIEW_H - P - ((Number(s.lat) - minLat) / Math.max(1e-9, maxLat - minLat)) * (VIEW_H - 2 * P);
      return [s.id, { x, y }];
    }));

    center = { x: VIEW_W / 2, y: VIEW_H / 2 };
  }

  function edgeKey(a, b) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  function routeSegments(path) {
    const set = new Set();
    for (let i = 0; i + 1 < path.length; i++) {
      set.add(edgeKey(path[i], path[i + 1]));
    }
    return set;
  }

  function el(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function setViewBox(svg) {
    const width = VIEW_W / zoom;
    const height = VIEW_H / zoom;
    const x = center.x - width / 2;
    const y = center.y - height / 2;
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  }

  function createDefs(svg) {
    const defs = el('defs');

    const shadow = el('filter', { id: 'stationShadow', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    shadow.appendChild(el('feDropShadow', { dx: '0', dy: '2', stdDeviation: '2', 'flood-color': '#0f172a', 'flood-opacity': '0.14' }));
    defs.appendChild(shadow);

    const glow = el('filter', { id: 'routeGlow', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    glow.appendChild(el('feGaussianBlur', { stdDeviation: '3' }));
    defs.appendChild(glow);

    svg.appendChild(defs);
  }

  function renderBackground(svg) {
    svg.appendChild(el('rect', {
      x: 0, y: 0, width: VIEW_W, height: VIEW_H,
      rx: 18, fill: '#f8fafc'
    }));

    const grid = el('g', { opacity: '0.35' });
    for (let x = 20; x < VIEW_W; x += 40) {
      grid.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: VIEW_H, stroke: '#e2e8f0', 'stroke-width': 1 }));
    }
    for (let y = 20; y < VIEW_H; y += 40) {
      grid.appendChild(el('line', { x1: 0, y1: y, x2: VIEW_W, y2: y, stroke: '#e2e8f0', 'stroke-width': 1 }));
    }
    svg.appendChild(grid);
  }

  function renderEdges(svg, byId) {
    const base = el('g');
    const activeLayer = el('g');

    edges.forEach((e) => {
      const a = coords.get(Number(e.from)), b = coords.get(Number(e.to));
      const from = byId.get(Number(e.from)), to = byId.get(Number(e.to));
      if (!a || !b || !from || !to) return;

      const key = edgeKey(e.from, e.to);
      const active = highlighted.has(key);
      const color = lineColor(edgeLine(from, to));

      // White casing gives the schematic lines a polished transit-map appearance.
      base.appendChild(el('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: '#ffffff', 'stroke-width': active ? 14 : 11,
        'stroke-linecap': 'round', opacity: active || !highlighted.size ? 1 : 0.45
      }));

      base.appendChild(el('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: color, 'stroke-width': active ? 7 : 5,
        'stroke-linecap': 'round', opacity: active || !highlighted.size ? 0.95 : 0.22
      }));

      if (active) {
        activeLayer.appendChild(el('line', {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke: '#ffffff', 'stroke-width': 2.5,
          'stroke-linecap': 'round', opacity: 0.75
        }));
      }
    });

    svg.appendChild(base);
    svg.appendChild(activeLayer);
  }

  function addStationLabel(g, station, p, active, important) {
    const text = String(station.name);
    const labelWidth = Math.max(58, text.length * (important ? 6.8 : 6.1) + 18);
    const x = p.x + 13;
    const y = p.y - 12;

    const label = el('g', { opacity: active ? 1 : 0.42 });
    label.appendChild(el('rect', {
      x, y: y - 12, width: labelWidth, height: 22, rx: 8,
      fill: '#ffffff', stroke: important ? '#cbd5e1' : '#e2e8f0', 'stroke-width': 1,
      filter: 'url(#stationShadow)'
    }));
    const t = el('text', {
      x: x + 9, y: y + 3,
      fill: '#0f172a', 'font-size': important ? 12.5 : 11,
      'font-weight': important ? 750 : 600,
      'font-family': 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    });
    t.textContent = text;
    label.appendChild(t);
    g.appendChild(label);
  }

  function renderStations(svg, byId) {
    const onRoute = new Set(highlightedPath);
    const first = highlightedPath[0];
    const last = highlightedPath[highlightedPath.length - 1];

    stations.forEach((s) => {
      const p = coords.get(s.id);
      if (!p) return;
      const isInter = lineNames(s.line).length > 1;
      const isEndpoint = s.id === first || s.id === last;
      const active = highlighted.size === 0 || onRoute.has(s.id);
      const g = el('g', { opacity: active ? 1 : 0.42, cursor: 'default' });

      const title = el('title');
      title.textContent = `${s.name} · ${s.line} Line`;
      g.appendChild(title);

      if (isEndpoint) {
        g.appendChild(el('circle', {
          cx: p.x, cy: p.y, r: 14,
          fill: s.id === first ? '#0f766e' : '#dc2626', opacity: 0.14
        }));
      }

      if (isInter) {
        g.appendChild(el('circle', {
          cx: p.x, cy: p.y, r: 11,
          fill: '#fff', stroke: '#0f172a', 'stroke-width': 2.5,
          filter: 'url(#stationShadow)'
        }));
        g.appendChild(el('circle', {
          cx: p.x, cy: p.y, r: 5,
          fill: highlightedPath.includes(s.id) ? '#0f766e' : '#fff',
          stroke: lineColor(s.line), 'stroke-width': 3
        }));
      } else {
        g.appendChild(el('circle', {
          cx: p.x, cy: p.y,
          r: onRoute.has(s.id) ? 8 : 6,
          fill: onRoute.has(s.id) ? '#fff' : lineColor(s.line),
          stroke: onRoute.has(s.id) ? '#0f766e' : '#fff',
          'stroke-width': onRoute.has(s.id) ? 4 : 2,
          filter: 'url(#stationShadow)'
        }));
      }

      // Keep labels focused on the active route and interchanges to avoid a wall of text.
      if (active || isInter || isEndpoint) {
        addStationLabel(g, s, p, active, isInter || isEndpoint);
      }

      svg.appendChild(g);
    });
  }

  function renderOverlay(svg) {
    const badge = el('g');
    badge.appendChild(el('rect', { x: 24, y: 22, width: highlighted.size ? 174 : 155, height: 34, rx: 17, fill: '#ffffff', stroke: '#e2e8f0' }));
    const dot = el('circle', { cx: 42, cy: 39, r: 5, fill: highlighted.size ? '#0f766e' : '#94a3b8' });
    badge.appendChild(dot);
    const text = el('text', {
      x: 54, y: 44, fill: '#334155', 'font-size': 12.5, 'font-weight': 700,
      'font-family': 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    });
    text.textContent = highlighted.size ? 'Selected route' : 'Metro network';
    badge.appendChild(text);
    svg.appendChild(badge);
  }

  function render() {
    const svg = document.getElementById('network');
    if (!svg || !stations.length) return;

    project(stations);
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 1000 560');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.touchAction = 'none';

    createDefs(svg);
    renderBackground(svg);
    const byId = new Map(stations.map((s) => [Number(s.id), s]));
    renderEdges(svg, byId);
    renderStations(svg, byId);
    renderOverlay(svg);
    setViewBox(svg);

    const legend = document.getElementById('mapLegend');
    if (legend) {
      legend.innerHTML = Object.entries(COLORS).map(([name, color]) =>
        `<span><i class="legend-line" style="background:${color}"></i>${esc(name)} Line</span>`
      ).join('') +
      '<span><i class="legend-station interchange"></i>Interchange</span>' +
      (highlighted.size ? '<span><i class="legend-line active"></i>Selected route</span>' : '');
    }
  }

  function zoomBy(delta) {
    zoom = Math.max(1, Math.min(2.4, zoom + delta));
    const svg = document.getElementById('network');
    if (svg) setViewBox(svg);
  }

  function resetView() {
    zoom = 1;
    center = { x: VIEW_W / 2, y: VIEW_H / 2 };
    const svg = document.getElementById('network');
    if (svg) setViewBox(svg);
  }

  function attachControls() {
    document.getElementById('mapZoomIn')?.addEventListener('click', () => zoomBy(0.25));
    document.getElementById('mapZoomOut')?.addEventListener('click', () => zoomBy(-0.25));
    document.getElementById('mapReset')?.addEventListener('click', resetView);
  }

  async function init(stationList, edgeList) {
    stations = Array.isArray(stationList) ? stationList : [];
    if (Array.isArray(edgeList)) {
      edges = edgeList;
      attachControls();
      render();
      return;
    }

    // Render the station layer immediately so a slow/failed network request
    // never leaves the map as a completely blank panel.
    attachControls();
    render();
    const loaded = await ensureEdges();
    if (loaded) render();
  }

  function highlight(path) {
    highlightedPath = Array.isArray(path) ? path.map(Number) : [];
    highlighted = routeSegments(highlightedPath);
    const status = document.getElementById('mapStatus');
    if (status) status.textContent = highlightedPath.length ? `${highlightedPath.length - 1} segment route` : 'Network overview';
    render();
  }

  return { init, highlight, resetView };
})();
