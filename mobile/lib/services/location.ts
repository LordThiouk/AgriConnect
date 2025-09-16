export class LocationService {
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error('Géolocalisation non supportée');
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch (error) {
      console.error('[LocationService.getCurrentLocation] error:', error);
      return null;
    }
  }

  static manualFallback(lat?: number, lon?: number): { latitude: number; longitude: number } | null {
    if (typeof lat === 'number' && typeof lon === 'number') {
      return { latitude: lat, longitude: lon };
    }
    return null;
  }
}
