export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  latitude: number;
  longitude: number;
}

export type PoiCategory = 'all' | 'pizzeria' | 'tourist_attraction' | 'ice_cream';
