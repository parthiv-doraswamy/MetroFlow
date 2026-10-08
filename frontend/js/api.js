/* Small fetch wrapper for the MetroFlow API. */
const api = (() => {
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
    } catch {
      throw new Error('Unable to connect to the route service.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'Something went wrong.');
    return data;
  }

  return {
    health: () => request('/api/health'),
    stations: () => request('/api/stations'),
    nearby: (id, hops = 2) => request(`/api/stations/${id}/nearby?hops=${hops}`),
    route: (source, destination, mode = 'distance') => request('/api/route', {
      method: 'POST',
      body: JSON.stringify({ source, destination, mode }),
    }),
    network: () => request('/api/network'),
  };
})();
