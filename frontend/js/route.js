/* Shareable route details page. */
(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lineClass = (line) => line && !line.includes('/') ? `line-chip line-${line}` : 'line-chip line-multi';

  async function load() {
    const params = new URLSearchParams(location.search);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const from = Number(fromParam);
    const to = Number(toParam);
    const mode = params.get('mode') === 'time' ? 'time' : 'distance';

    // Number(null) becomes 0, so check that the query parameters actually exist
    // before calling the API. This prevents a direct visit to /route.html from
    // becoming an API request for station id 0.
    if (!fromParam || !toParam || !Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) {
      $('routeSummary').textContent = 'Choose a route from the planner first.';
      $('resultEmpty').style.display = 'block';
      return;
    }

    try {
      // Validate the URL against the deployed station list before calling the route engine.
      const stationResult = await api.stations();
      const validIds = new Set((stationResult.stations || []).map((s) => Number(s.id)));
      if (!validIds.has(from) || !validIds.has(to)) {
        $('routeSummary').textContent = 'This route is no longer available.';
        $('alert').className = 'alert show alert-error';
        $('alert').textContent = 'The station IDs in this link are not valid for the current MetroFlow network.';
        $('resultEmpty').style.display = 'block';
        $('resultEmpty').innerHTML = 'Please return to the <a href="index.html">planner</a> and choose the stations again.';
        return;
      }

      const health = await api.health();
      $('engineStatus').textContent = `${health.stations} stations · engine online`;
      const route = await api.route(from, to, mode);
      $('routeSummary').textContent = `${route.source} → ${route.destination} · ${route.distance} km · ${route.travelTime} min · ₹${route.fare}`;

      let html = `<div class="stats"><div class="stat"><div class="k">Distance</div><div class="v">${route.distance} km</div></div><div class="stat"><div class="k">Travel time</div><div class="v">${route.travelTime} min</div></div><div class="stat"><div class="k">Fare</div><div class="v">₹${route.fare}</div></div><div class="stat"><div class="k">Stops</div><div class="v">${route.stops}</div></div></div>`;
      if (route.transfers?.length) {
        html += '<div class="transfer-list">' + route.transfers.map((t) => `<div class="transfer"><strong>Transfer at ${escapeHtml(t.station)}</strong><span>${escapeHtml(t.from)} → ${escapeHtml(t.to)}</span></div>`).join('') + '</div>';
      }
      html += '<ol class="timeline">';
      (route.stationDetails || []).forEach((station, i, details) => {
        const leg = route.legs?.[i];
        const last = i === details.length - 1;
        html += `<li><div class="rail"><div class="dot${i === 0 ? ' start' : ''}${last ? ' end' : ''}"></div>${last ? '' : '<div class="stem"></div>'}</div><div class="stop-card"><div class="stop-name">${escapeHtml(station.name)} <span class="${lineClass(station.line)}">${escapeHtml(station.line || '')}</span></div>${leg ? `<div class="leg-meta">${leg.distance} km · ${leg.time} min to ${escapeHtml(leg.toName)}</div>` : '<div class="leg-meta">Destination</div>'}</div></li>`;
      });
      html += `</ol><div class="route-foot">${route.cached ? 'Served from route cache.' : 'Calculated by the C++ engine.'} · ${mode === 'time' ? 'Fastest route' : 'Shortest route'}</div>`;
      $('resultBody').innerHTML = html;
    } catch (error) {
      $('routeSummary').textContent = 'Could not load this route.';
      $('alert').className = 'alert show alert-error';
      $('alert').textContent = error.message;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
