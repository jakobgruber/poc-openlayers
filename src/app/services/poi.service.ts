import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Poi } from '../models/poi.model';

@Injectable({ providedIn: 'root' })
export class PoiService {
  private mockPois: Poi[] = [
    // Pizzerias
    { id: 'p1', name: 'Pizza Napoli', category: 'pizzeria', latitude: 48.2082, longitude: 16.3738 },
    { id: 'p2', name: 'Pizzeria Bella', category: 'pizzeria', latitude: 48.2000, longitude: 16.3600 },
    { id: 'p3', name: 'Pizza Roma', category: 'pizzeria', latitude: 48.2150, longitude: 16.3800 },
    { id: 'p4', name: 'Pizzeria Venezia', category: 'pizzeria', latitude: 48.1950, longitude: 16.3500 },
    { id: 'p5', name: 'Pizza Sicilia', category: 'pizzeria', latitude: 48.2200, longitude: 16.3900 },
    // Tourist Attractions
    { id: 't1', name: 'Schönbrunn Palace', category: 'tourist_attraction', latitude: 48.1845, longitude: 16.3119 },
    { id: 't2', name: 'St. Stephen\'s Cathedral', category: 'tourist_attraction', latitude: 48.2085, longitude: 16.3735 },
    { id: 't3', name: 'Belvedere Palace', category: 'tourist_attraction', latitude: 48.1915, longitude: 16.3808 },
    { id: 't4', name: 'Hofburg Palace', category: 'tourist_attraction', latitude: 48.2075, longitude: 16.3653 },
    { id: 't5', name: 'Prater Park', category: 'tourist_attraction', latitude: 48.2167, longitude: 16.4050 },
    // Ice Cream Shops
    { id: 'i1', name: 'Gelato Venezia', category: 'ice_cream', latitude: 48.2100, longitude: 16.3700 },
    { id: 'i2', name: 'Eis Salon', category: 'ice_cream', latitude: 48.2050, longitude: 16.3750 },
    { id: 'i3', name: 'Gelateria Italia', category: 'ice_cream', latitude: 48.2000, longitude: 16.3650 },
    { id: 'i4', name: 'Eis Paradies', category: 'ice_cream', latitude: 48.2150, longitude: 16.3850 },
    { id: 'i5', name: 'Gelato Fresco', category: 'ice_cream', latitude: 48.1950, longitude: 16.3550 },
  ];

  getPois(): Observable<Poi[]> {
    return of(this.mockPois);
  }
}
