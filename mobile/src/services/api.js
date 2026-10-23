import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';


// cache configuration
const CACHE_PREFIX = '@parkaid:';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const OFFLINE_TTL = 24 * 60 * 60 * 1000; // 24 hours for offline mode

// A failed request, by what went wrong, so screens can say it plainly:
// 'offline' (no connection), 'timeout' (no answer in time) or 'server'
// (the service answered with an error). See utils/loadStatus.
export class ApiError extends Error {
  constructor(kind, message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

const REQUEST_TIMEOUT = 8000;

class ParkingAPI {
  constructor() {
    this.isOnline = true;
    this.pendingRequests = new Map();
  }

  // generate cache key
  getCacheKey(endpoint, params) {
    return `${CACHE_PREFIX}${endpoint}_${JSON.stringify(params)}`;
  }

  // cache management
  async setCache(key, data, timestamp = Date.now()) {
    try {
      const cacheData = {
        data,
        timestamp,
        version: '1.0'
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  // { data, timestamp } when a copy younger than maxAge is stored, else null.
  async getCache(key, maxAge = CACHE_TTL) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;
      return age < maxAge ? entry : null;
    } catch (error) {
      console.warn('Cache read failed:', error);
      return null;
    }
  }

  // Responses carry when their data was saved (`savedAt`, ms), and, when it
  // is an older copy shown because the network failed, why (`staleBecause`).
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const cacheKey = this.getCacheKey(endpoint, options.params);

    // check cache first
    // `fresh` skips the 5-minute cache (pull to refresh, Retry). A stale copy
    // is still the fallback if the network fails.
    if (!options.fresh) {
      const cached = await this.getCache(cacheKey, this.isOnline ? CACHE_TTL : OFFLINE_TTL);
      if (cached) {
        return {
          ...cached.data,
          savedAt: cached.timestamp,
          staleBecause: this.isOnline ? null : 'offline',
        };
      }
    }

    // deduplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this._performRequest(url, options, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _performRequest(url, options, cacheKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      console.log(`Fetching: ${url}`);

      let response;
      try {
        response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });
      } catch (error) {
        // fetch only rejects when nothing came back: no connection, or our abort.
        throw error.name === 'AbortError'
          ? new ApiError('timeout', 'The request timed out')
          : new ApiError('offline', error.message || 'Network request failed');
      }

      if (!response.ok) {
        throw new ApiError('server', `HTTP ${response.status}`, response.status);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new ApiError('server', 'The response was not JSON', response.status);
      }

      if (!data.success) {
        throw new ApiError('server', data.error || 'Request failed', response.status);
      }

      // cache successful response
      this.isOnline = true;
      const savedAt = Date.now();
      await this.setCache(cacheKey, data, savedAt);

      return { ...data, savedAt, staleBecause: null };
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError('server', error.message);
      console.warn('Request failed:', failure.kind, failure.message);

      if (failure.kind === 'offline' || failure.kind === 'timeout') {
        this.isOnline = false;
      }

      // An older copy, saying how old and why, beats an error.
      const staleCache = await this.getCache(cacheKey, OFFLINE_TTL);
      if (staleCache) {
        return { ...staleCache.data, savedAt: staleCache.timestamp, staleBecause: failure.kind };
      }

      throw failure;
    } finally {
      clearTimeout(timeout);
    }
  }

  // API Methods
  async findNearbySpots(lat, lng, radius = 500, params = {}, { fresh = false } = {}) {
    const queryParams = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      ...(params.type && params.type !== 'all' ? { type: params.type } : {}),
      ...(params.free ? { free: 'true' } : {})
    });

    return this.request(`/api/parking/nearby?${queryParams}`, { fresh });
  }

  // utilities
  clearCache() {
    return AsyncStorage.getAllKeys().then(keys => {
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      return AsyncStorage.multiRemove(cacheKeys);
    });
  }

  getConnectionStatus() {
    return this.isOnline;
  }
}

export const parkingAPI = new ParkingAPI();
