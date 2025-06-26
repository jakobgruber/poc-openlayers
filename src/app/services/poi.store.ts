import {computed, inject} from '@angular/core';
import {signalStore, withState, withHooks, withMethods, patchState, withComputed} from '@ngrx/signals';
import {Poi, PoiCategory} from '../models/poi.model';
import {PoiService} from './poi.service';

interface PoiStoreState {
  poiList: Poi[];
  selectedCategory: PoiCategory;
}

const initialState: PoiStoreState = {
  poiList: [],
  selectedCategory: 'all',
}

export const PoiStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    filteredPoiList: computed(() => {
      if (store.selectedCategory() === 'all') {
        return store.poiList();
      }

      return store.poiList().filter(poi => poi.category === store.selectedCategory());
    })
  })),
  withMethods((store) => ({
    setPoiList(poiList: Poi[]) {
      patchState(store, { poiList });
    },
    setSelectedCategory(category: PoiCategory) {
      patchState(store, { selectedCategory: category });
    },
  })),
  withHooks({
    onInit(store) {
      const poiService = inject(PoiService);
      poiService.getPois().subscribe((poiList) => {
        store.setPoiList(poiList);
      });
    },
  }),
);
