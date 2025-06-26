import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
  viewChildren,
  ElementRef,
  afterNextRender
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
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Text from 'ol/style/Text';
import {PoiStore} from '../../../../services/poi.store';
import {Poi, PoiCategory} from '../../../../models/poi.model';
import {Overlay} from 'ol';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styles: `
    .map {
      height: 70vh;
      width: 100%;
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
      z-index: 1000;
    }
    .tooltip.visible {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class MapComponent implements OnInit {
  selectedCategory = computed<PoiCategory>(() => this.store.selectedCategory());
  private filteredPoiList = computed<Poi[]>(() => this.store.filteredPoiList());
  private map!: Map;
  private vectorSource = new VectorSource();
  private clusterSource = new Cluster({ source: this.vectorSource, distance: 40 });
  private vectorLayer = new VectorLayer({ source: this.clusterSource });

  private tooltipOverlay!: Overlay;
  private tooltipElements = viewChildren('tooltip', { read: ElementRef<HTMLDivElement> });

  private store = inject(PoiStore);

  constructor() {
    // Setup tooltip after render to ensure DOM is ready
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
    const features = this.filteredPoiList()
      .map((poi) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([poi.longitude, poi.latitude])),
          name: poi.name,
          category: poi.category,
        });
        feature.setStyle(this.getStyle(poi.category));
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
    const tooltipElement = this.tooltipElements()?.[0]?.nativeElement;
    if (!tooltipElement) {
      console.error('Tooltip element not found');
      return;
    }
    this.tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
    });
    this.map.addOverlay(this.tooltipOverlay);
  }

  private setupHoverInteraction() {
    this.map.on('pointermove', (event) => {
      const pixel = this.map.getEventPixel(event.originalEvent);
      const feature = this.map.forEachFeatureAtPixel(pixel, (f) => f);
      const tooltipElement = this.tooltipElements()?.[0]?.nativeElement;

      if (feature && tooltipElement) {
        const properties = feature.getProperties();
        const name = properties['name'] as string;
        const category = properties['category'] as Poi['category'];
        if (name && category) {
          tooltipElement.textContent = `${category}: ${name}`;
          tooltipElement.classList.add('visible');
          this.tooltipOverlay.setPosition(event.coordinate);
        } else {
          tooltipElement.classList.remove('visible');
        }
      } else if (tooltipElement) {
        tooltipElement.classList.remove('visible');
      }
    });
  }


  private getStyle(category: string): Style {
    const colors: Record<string, string> = {
      pizzeria: 'red',
      tourist_attraction: 'blue',
      ice_cream: 'green',
    };
    return new Style({
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: colors[category] }),
      }),
      text: new Text({
        text: category.charAt(0).toUpperCase(),
        fill: new Fill({ color: 'white' }),
        offsetY: -15,
      }),
    });
  }
}
