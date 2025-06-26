import { Routes } from '@angular/router';
import {MapComponent} from './features/map/components/map/map.component';

export const routes: Routes = [
  { path: 'map', component: MapComponent },
  { path: '', redirectTo: '/map', pathMatch: 'full' },
];
