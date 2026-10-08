/* MetroFlow planner. */
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { stations: [], byId: new Map(), fromId: null, toId: null };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lineClass = (line) => line && !line.includes('/') ? `line-chip line-${line}` : 'line-chip line-multi';

  function alert(message, kind = 'error') {
    const el = $('alert');
    el.className = `alert show alert-${kind}`;
    el.textContent = message;
  }

  function clearAlert() {
    $('alert').className = 'alert';
    $('alert').textContent = '';
  }

  function updateRouteDetailsLink(from, to, mode = 'distance') {
    const link = $('routeDetailsLink');
    if (!link || !from || !to) return;
    const params = new URLSearchParams({ from: String(from), to: String(to), mode });
    link.href = `route.html?${params.toString()}`;
  }

  function setStationInput(inputId, id) {
    const station = state.byId.get(id);
    if (station) $(inputId).value = station.name;
  }

  function resolveStation(inputId, selectedId) {
    if (selectedId) return selectedId;
    const value = $(inputId).value.trim().toLowerCase();
    const station = state.stations.find((s) => s.name.toLowerCase() === value);
    return station ? station.id : null;
  }

  function wireAutocomplete(inputId, suggestionId, setId) {
    const input = $(inputId);
    const box = $(suggestionId);
    let current = [];
    let selected = -1;

    const close = () => {
      box.innerHTML = '';
      box.style.display = 'none';
      selected = -1;
    };

    const choose = (index) => {
      const station = current[index];
      if (!station) return;
      input.value = station.name;
      setId(station.id);
      close();
    };

    input.addEventListener('input', () => {
      setId(null);
      const query = input.value.trim().toLowerCase();
      if (!query) return close();
      current = state.stations.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 8);
      if (!current.length) return close();
      box.innerHTML = current.map((s, i) =>
        `<button type="button" data-index="${i}"><span>${escapeHtml(s.name)}</span><span class="${lineClass(s.line)}">${escapeHtml(s.line)}</span></button>`
      ).join('');
      box.style.display = 'block';
      box.querySelectorAll('button').forEach((button) => {
        button.addEventListener('mousedown', (event) => {
          event.preventDefault();
          choose(Number(button.dataset.index));
        });
      });
    });

    input.addEventListener('keydown', (event) => {
      const items = box.querySelectorAll('button');
      if (!items.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        selected = event.key === 'ArrowDown'
          ? Math.min(selected + 1, items.length - 1)
          : Math.max(selected - 1, 0);
        items.forEach((button, i) => button.classList.toggle('hl', i === selected));
      } else if (event.key === 'Enter' && selected >= 0) {
        event.preventDefault();
        choose(selected);
      } else if (event.key === 'Escape') {
        close();
      }
    });

    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('change', () => {
      const value = input.value.trim().toLowerCase();
      const station = state.stations.find((s) => s.name.toLowerCase() === value);
      setId(station ? station.id : null);
    });
  }

  function renderRoute(route) {
    const details = route.stationDetails || [];
    const legs = route.legs || [];
    const modeLabel = route.mode === 'time' ? 'Fastest route' : 'Shortest route';

    let html = `<div class="route-heading"><div><strong>${escapeHtml(route.source)}</strong> <span>→</span> <strong>${escapeHtml(route.destination)}</strong></div><span class="route-mode">${modeLabel}</span></div>`;
    html += `<div class="stats">
      <div class="stat"><div class="k">Distance</div><div class="v">${route.distance} km</div></div>
      <div class="stat"><div class="k">Travel time</div><div class="v">${route.travelTime} min</div></div>
      <div class="stat"><div class="k">Fare</div><div class="v">₹${route.fare}</div></div>
      <div class="stat"><div class="k">Stops</div><div class="v">${route.stops}</div></div>
    </div>`;

    if (route.transfers?.length) {
      html += '<div class="transfer-list">' + route.transfers.map((t) => `<div class="transfer"><strong>Transfer at ${escapeHtml(t.station)}</strong><span>${escapeHtml(t.from)} → ${escapeHtml(t.to)}</span></div>`).join('') + '</div>';
    }

    html += '<ol class="timeline">';
    details.forEach((station, i) => {
      const last = i === details.length - 1;
      const leg = last ? null : legs[i];
      html += `<li><div class="rail"><div class="dot${i === 0 ? ' start' : ''}${last ? ' end' : ''}"></div>${last ? '' : '<div class="stem"></div>'}</div>`;
      html += `<div class="stop-card"><div class="stop-name">${escapeHtml(station.name)} <span class="${lineClass(station.line)}">${escapeHtml(station.line || '')}</span></div>`;
      html += leg ? `<div class="leg-meta">${leg.distance} km · ${leg.time} min to ${escapeHtml(leg.toName)}</div>` : '<div class="leg-meta">Destination</div>';
      html += '</div></li>';
    });
    html += '</ol>';

    if (details.length > 1) {
      for (let i = 1; i < details.length; i++) {
        const previous = details[i - 1].line || '';
        const current = details[i].line || '';
        if (previous && current && previous !== current && (previous.includes('/') || current.includes('/'))) {
          // Transfer details are also exposed in the route card when an interchange is reached.
        }
      }
    }

    html += `<div class="route-foot">${route.cached ? 'Served from route cache.' : 'Route calculated by the C++ engine.'} · Demo fare model</div>`;
    $('resultBody').innerHTML = html;
    $('resultEmpty').style.display = 'none';
  }

  async function findRoute() {
    clearAlert();
    const source = resolveStation('fromInput', state.fromId);
    const destination = resolveStation('toInput', state.toId);
    const mode = $('routeMode').value;
    state.fromId = source;
    state.toId = destination;

    if (!source || !destination) {
      alert('Please select both stations.');
      return;
    }

    const button = $('findBtn');
    button.disabled = true;
    button.textContent = 'Finding route…';
    $('resultEmpty').style.display = 'none';
    $('resultBody').innerHTML = '<div class="skeleton"></div>';

    try {
      const route = await api.route(source, destination, mode);
      renderRoute(route);
      window.MetroMap?.highlight(route.path || []);
      const url = new URL(location.href);
      url.searchParams.set('from', source);
      url.searchParams.set('to', destination);
      url.searchParams.set('mode', mode);
      history.replaceState(null, '', url.toString());
      updateRouteDetailsLink(source, destination, mode);
    } catch (error) {
      $('resultBody').innerHTML = '';
      $('resultEmpty').style.display = 'block';
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Find Route';
    }
  }

  async function loadNearby() {
    const id = Number($('nearbyStation').value);
    const hops = Number($('nearbyHops').value);
    if (!id) return alert('Select a station first.', 'info');
    $('nearbyList').innerHTML = '<div class="skeleton"></div>';
    try {
      const result = await api.nearby(id, hops);
      $('nearbyList').innerHTML = result.nearbyStations.length
        ? result.nearbyStations.map((station) => `<div class="nearby-item"><span><strong>${escapeHtml(station.name)}</strong> <span class="${lineClass(station.line)}">${escapeHtml(station.line)}</span></span><span>${station.hops} hop${station.hops === 1 ? '' : 's'}</span></div>`).join('')
        : '<div class="alert show alert-info">No stations within that range.</div>';
    } catch (error) {
      $('nearbyList').innerHTML = `<div class="alert show alert-error">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderLines() {
    const lines = new Map();
    state.stations.forEach((station) => {
      const line = station.line.split('/')[0];
      if (!lines.has(line)) lines.set(line, []);
      lines.get(line).push(station);
    });

    $('linesList').innerHTML = [...lines.entries()].map(([line, stations]) => {
      const interchanges = stations.filter((s) => s.line.includes('/')).map((s) => s.name);
      return `<div class="line-row"><div><span class="${lineClass(line)}">${line} Line</span><span class="line-count">${stations.length} stations</span></div><div class="line-stations">${stations.map((s) => escapeHtml(s.name)).join(' → ')}</div>${interchanges.length ? `<div class="interchanges">Interchange: ${interchanges.map(escapeHtml).join(', ')}</div>` : ''}</div>`;
    }).join('');

    $('nearbyStation').innerHTML = state.stations.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    const center = state.stations.find((s) => s.name === 'City Center');
    if (center) $('nearbyStation').value = String(center.id);
  }

  async function init() {
    try {
      const health = await api.health();
      $('engineStatus').textContent = `${health.stations} stations · engine online`;
    } catch {
      $('engineStatus').textContent = 'Route service offline';
      $('engineStatus').classList.add('bad');
    }

    try {
      const result = await api.stations();
      state.stations = result.stations || [];
      state.byId = new Map(state.stations.map((s) => [s.id, s]));
      wireAutocomplete('fromInput', 'fromSuggest', (id) => { state.fromId = id; });
      wireAutocomplete('toInput', 'toSuggest', (id) => { state.toId = id; });
      renderLines();
      await window.MetroMap.init(state.stations);

      const params = new URLSearchParams(location.search);
      const from = Number(params.get('from'));
      const to = Number(params.get('to'));
      const mode = params.get('mode');
      if (Number.isInteger(from) && Number.isInteger(to) && from > 0 && to > 0) {
        setStationInput('fromInput', from);
        setStationInput('toInput', to);
        state.fromId = from;
        state.toId = to;
        if (mode === 'time') $('routeMode').value = 'time';
        updateRouteDetailsLink(from, to, mode === 'time' ? 'time' : 'distance');
        findRoute();
      }
    } catch (error) {
      alert(error.message);
    }

    $('findBtn').addEventListener('click', findRoute);
    $('swapBtn').addEventListener('click', () => {
      const from = $('fromInput').value;
      $('fromInput').value = $('toInput').value;
      $('toInput').value = from;
      [state.fromId, state.toId] = [state.toId, state.fromId];
    });
    $('nearbyBtn').addEventListener('click', loadNearby);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && document.activeElement?.tagName === 'INPUT') findRoute();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
