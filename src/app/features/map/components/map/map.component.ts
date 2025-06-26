import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
  viewChildren,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Text from 'ol/style/Text';
import { Overlay } from 'ol';
import { PoiStore } from '../../../../services/poi.store';
import { Poi, PoiCategory } from '../../../../models/poi.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styles: `
    .map {
      height: 70vh;
      width: 100%;
      position: relative; /* Ensure map is a positioning context */
    }
    .tooltip {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
      pointer-events: none;
      display: none;
      z-index: 10000;
      opacity: 1;
      width: 300px;
    }
    .tooltip.visible {
      display: block !important; /* Force display */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  selectedCategory = computed<PoiCategory>(() => this.store.selectedCategory());
  private filteredPoiList = computed<Poi[]>(() => this.store.filteredPoiList());
  private map!: Map;
  private vectorSource = new VectorSource();
  private clusterSource = new Cluster({ source: this.vectorSource, distance: 40 });
  private vectorLayer = new VectorLayer({
    source: this.clusterSource,
    style: (feature) => this.getClusterStyle(feature),
  });
  private tooltipOverlay!: Overlay;
  private tooltipElements = viewChildren<ElementRef<HTMLDivElement>>('tooltip');
  private styleCache: Record<string, Style> = {};

  private store = inject(PoiStore);

  constructor() {
    afterNextRender(() => {
      this.setupTooltip();
    });
  }

  ngOnInit() {
    this.initMap();
    this.updateMarkers();
    this.setupHoverInteraction();
  }

  updateMarkers(category: PoiCategory = 'all') {
    this.store.setSelectedCategory(category);
    this.vectorSource.clear();
    const features = this.filteredPoiList().map((poi) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([poi.longitude, poi.latitude])),
        name: poi.name,
        category: poi.category,
      });
      return feature;
    });
    this.vectorSource.addFeatures(features);
  }

  private initMap() {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),
        this.vectorLayer,
      ],
      view: new View({
        center: fromLonLat([16.3738, 48.2082]), // Vienna center
        zoom: 12,
      }),
    });
  }

  private setupTooltip() {
    const tooltipElement = this.tooltipElements()[0]?.nativeElement;
    if (!tooltipElement) {
      console.error('Tooltip element not found');
      return;
    }
    this.tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      autoPan: false,
      stopEvent: false, // Allow events to pass through
    });
    this.map.addOverlay(this.tooltipOverlay);
  }

  private setupHoverInteraction() {
    this.map.on('pointermove', (event) => {
      const pixel = this.map.getEventPixel(event.originalEvent);
      const feature = this.map.forEachFeatureAtPixel(pixel, (f) => f, {
        hitTolerance: 5,
      });
      const tooltipElement = this.tooltipElements()[0]?.nativeElement;

      if (feature && tooltipElement) {
        const features: Feature[] = 'get' in feature && feature.get('features') ? feature.get('features') : [feature];
        const isCluster = features.length > 1;

        if (isCluster) {
          const categories = features
            .filter((f: Feature) => 'get' in f && f.get('category'))
            .map((f: Feature) => f.get('category') as string);
          const uniqueCategories = [...new Set(categories)];
          tooltipElement.textContent = uniqueCategories.length
            ? `${features.length} POIs (${uniqueCategories.join(', ')})`
            : `${features.length} POIs (unknown categories)`;
        } else {
          const singleFeature = features[0];
          if (!('get' in singleFeature)) {
            console.warn('RenderFeature detected in tooltip:', singleFeature);
            tooltipElement.classList.remove('visible');
            return;
          }
          const name = singleFeature.get('name') as string;
          const category = singleFeature.get('category') as Poi['category'];
          if (name && category) {
            tooltipElement.textContent = `${category}: ${name}`;
          } else {
            console.warn('Invalid tooltip data:', { name, category });
            tooltipElement.classList.remove('visible');
            return;
          }
        }

        tooltipElement.classList.add('visible');
        this.tooltipOverlay.setPosition(event.coordinate);
      } else if (tooltipElement) {
        tooltipElement.classList.remove('visible');
      }
    });
  }

  private getClusterStyle(feature: FeatureLike): Style {
    const features = 'get' in feature && feature.get('features') ? feature.get('features') : [feature];
    const isCluster = features.length > 1;

    if (isCluster) {
      return new Style({
        image: new CircleStyle({
          radius: 15,
          fill: new Fill({ color: 'rgba(0, 0, 0, 0.5)' }),
        }),
        text: new Text({
          text: features.length.toString(),
          fill: new Fill({ color: 'white' }),
        }),
      });
    }

    const singleFeature = features[0];
    if (!('get' in singleFeature)) {
      console.warn('RenderFeature detected, no category available:', singleFeature);
      return this.getStyle('unknown');
    }

    const category = singleFeature.get('category') as string || 'unknown';
    if (!category || category === 'unknown') {
      console.warn('Category not found for feature:', singleFeature);
    }

    return this.getStyle(category);
  }

  private getStyle(category: string): Style {
    if (this.styleCache[category]) {
      return this.styleCache[category];
    }

    const colors: Record<string, string> = {
      pizzeria: 'red',
      tourist_attraction: 'blue',
      ice_cream: 'green',
    };
    const color = colors[category] || 'gray';

    const style = new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color }),
      }),
      text: new Text({
        text: category.charAt(0).toUpperCase(),
        fill: new Fill({ color: 'white' }),
        offsetY: -15,
      }),
    });

    this.styleCache[category] = style;
    return style;
  }
}
