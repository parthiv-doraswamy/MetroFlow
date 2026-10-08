// Small in-memory LRU cache for repeated route searches.
class RouteCache {
  constructor(limit = 50) {
    this.limit = limit;
    this.items = new Map();
  }

  get(key) {
    if (!this.items.has(key)) return undefined;
    const value = this.items.get(key);
    this.items.delete(key);
    this.items.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.items.has(key)) this.items.delete(key);
    this.items.set(key, value);
    while (this.items.size > this.limit) {
      const oldest = this.items.keys().next().value;
      this.items.delete(oldest);
    }
  }

  clear() {
    this.items.clear();
  }

  get size() {
    return this.items.size;
  }
}

module.exports = RouteCache;
