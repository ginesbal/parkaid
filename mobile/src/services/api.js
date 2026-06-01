import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';


// cache configuration
const CACHE_PREFIX = '@parkaid:';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const OFFLINE_TTL = 24 * 60 * 60 * 1000; // 24 hours for offline mode

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
  async setCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  }

  async getCache(key, maxAge = CACHE_TTL) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // return cached data if within TTL or offline
      if (age < maxAge || !this.isOnline) {
        console.log(`Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
        return data;
      }

      return null;
    } catch (error) {
      console.warn('Cache read failed:', error);
      return null;
    }
  }

  // network request with retry and fallback
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const cacheKey = this.getCacheKey(endpoint, options.params);

    // check cache first
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // deduplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this._performRequest(url, options, cacheKey, endpoint);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _performRequest(url, options, cacheKey, endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      console.log(`Fetching: ${url}`);

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      // cache successful response
      this.isOnline = true;
      await this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      clearTimeout(timeout);
      console.error('Request failed:', error);

      // mark as offline
      if (error.message === 'Network request failed' || error.name === 'AbortError') {
        this.isOnline = false;
      }

      // try to get stale cache data
      const staleCache = await this.getCache(cacheKey, OFFLINE_TTL);
      if (staleCache) {
        console.log('Using stale cache due to network error');
        return staleCache;
      }

      // return mock data for development
      if (__DEV__ && endpoint.includes('/nearby')) {
        return this.getMockData();
      }

      throw error;
    }
  }

  // mock data for development/testing
  getMockData() {
    return {
      success: true,
      data: [
        {
          id: 'mock-1',
          spot_type: 'on_street',
          address: '123 Main St SW (Mock Data - Check Connection)',
          coordinates: {
            type: 'Point',
            coordinates: [-114.0629, 51.0453]
          },
          distance: 150,
          walkingTime: 2,
          capacity: 5,
          available: 3,
          zone_info: {
            price_zone: '3',
            html_zone_rate: '<b>Mon-Fri 9AM-6PM</b><br>$2.00 per Hour<br><b>Sat-Sun</b><br>Free'
          }
        },
        {
          id: 'mock-2',
          spot_type: 'off_street',
          address: 'City Center Parkade (Mock)',
          coordinates: {
            type: 'Point',
            coordinates: [-114.0635, 51.0448]
          },
          distance: 300,
          walkingTime: 4,
          capacity: 50,
          available: 25,
          metadata: { lot_name: 'Mock Lot' }
        },
        {
          id: 'mock-3',
          spot_type: 'residential',
          address: '456 Residential Ave SW (Mock)',
          coordinates: {
            type: 'Point',
            coordinates: [-114.064, 51.0445]
          },
          distance: 200,
          walkingTime: 3,
          capacity: 2,
          available: 1,
          zone_info: { permit_zone: 'R' }
        }
      ]
    };
  }

  // API Methods
  async findNearbySpots(lat, lng, radius = 500, params = {}) {
    const queryParams = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      ...(params.type && params.type !== 'all' ? { type: params.type } : {}),
      ...(params.free ? { free: 'true' } : {})
    });

    return this.request(`/api/parking/nearby?${queryParams}`);
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
