import Ember from 'ember';
import layout from '../templates/components/g-map-polygon';
import GMapComponent from './g-map';
import compact from '../utils/compact';

const { isEmpty, isPresent, observer, computed, run, assert, typeOf } = Ember;

const allowedPolygonOptions = Ember.A(['fillColor', 'fillOpacity', 'strokeColor', 'strokeWeight', 'strokeOpacity', 'zIndex', 'geodesic', 'clickable', 'draggable', 'editable', 'visible']);

const GMapPolygonComponent = Ember.Component.extend({
  layout: layout,
  classNames: ['g-map-polygon'],

  map: computed.alias('mapContext.map'),

  init() {
    this._super(arguments);
    this.infowindow = null;
    this.set('coordinates', Ember.A());
    if (isEmpty(this.get('group'))) {
      this.set('group', null);
    }

    const mapContext = this.get('mapContext');
    assert('Must be inside {{#g-map}} component with context set', mapContext instanceof GMapComponent);

    mapContext.registerPolygon(this);
  },

  didInsertElement() {
    this._super();
    if (isEmpty(this.get('polygon'))) {
      const options = compact(this.getProperties(allowedPolygonOptions));
      const polygon = new google.maps.Polygon(options);

      const deleteMenu = new DeleteMenu();

      google.maps.event.addListener(polygon, 'rightclick', (e) => {
        // Check if click was on a vertex control point
        if (e.vertex === undefined) {
          return;
        }
        deleteMenu.open(this, this.get('mapContext.map'), polygon.getPath(), e.vertex);
      });

      this.set('polygon', polygon);
    }

    this.setMap();
    this.setPath();
    this.updatePolygonOptions();
    this.setOnClick();
    this.setOnDrag();
    this.setOnMouseUp();
    this.setOnChange();
  },

  willDestroyElement() {
    this.unsetPolygonFromMap();
    this.get('mapContext').unregisterPolygon(this);
  },

  registerCoordinate(coordinate) {
    this.get('coordinates').addObject(coordinate);
  },

  unregisterCoordinate(coordinate) {
    this.get('coordinates').removeObject(coordinate);
    this.setPath();
  },

  unsetPolygonFromMap() {
    const polygon = this.get('polygon');
    if (isPresent(polygon)) {
      polygon.setMap(null);
    }
  },

  mapWasSet: observer('map', function() {
    run.once(this, 'setMap');
  }),

  setMap() {
    const map = this.get('map');
    const polygon = this.get('polygon');

    if (isPresent(polygon) && isPresent(map)) {
      polygon.setMap(map);
    }
  },

  setPath() {
    const polygon = this.get('polygon');
    const coordinates = this.get('coordinates');

    if (isPresent(polygon) && isPresent(coordinates)) {
      let coordArray = Ember.A(this.get('coordinates').mapBy('coordinate')).compact();
      polygon.setPath(coordArray);
    }
  },

  polygonOptionsChanged: observer(...allowedPolygonOptions, function() {
    run.once(this, 'updatePolygonOptions');
  }),

  updatePolygonOptions() {
    const polygon = this.get('polygon');
    const options = compact(this.getProperties(allowedPolygonOptions));

    if (isPresent(polygon) && isPresent(Object.keys(options))) {
      polygon.setOptions(options);
    }
  },

  setOnClick() {
    const polygon = this.get('polygon');
    if (isPresent(polygon)) {
      polygon.addListener('click', (e) => this.sendOnClick(e));
    }
  },

  sendOnClick(e) {
    const { onClick } = this.attrs;
    const polygon = this.get('polygon');

    if (typeOf(onClick) === 'function') {
      onClick(e, polygon);
    } else {
      this.sendAction('onClick', e, polygon);
    }
  },

  setOnMouseUp() {
    const polygon = this.get('polygon');
    if (isPresent(polygon)) {
      polygon.addListener('mouseup', (e) => this.sendOnMouseUp(e));
    }
  },

  sendOnMouseUp(e) {
    const { onMouseUp } = this.attrs;
    const polygon = this.get('polygon');

    if (typeOf(onMouseUp) === 'function') {
      onMouseUp(e, polygon);
    } else {
      this.sendAction('onMouseUp', e, polygon);
    }

    // mouse events maybe make changes
    this.sendOnChange();
  },

  setOnChange() {
    const polygon = this.get('polygon');
    if (isPresent(polygon)) {
      polygon.addListener('changed', (e) => this.sendOnChange(e));
    }
  },

  sendOnChange() {
    const { onChange } = this.attrs;
    const polygon = this.get('polygon');

    if (typeOf(onChange) === 'function') {
      onChange(polygon.getPath());
    } else {
      this.sendAction('onChange', polygon.getPath());
    }
  },

  setOnDrag() {
    const polygon = this.get('polygon');
    if (isPresent(polygon)) {
      polygon.addListener('dragend', (e) => this.sendOnDrag(e));
    }
  },

  sendOnDrag(e) {
    const { onDrag } = this.attrs;
    const polygon = this.get('polygon');

    if (typeOf(onDrag) === 'function') {
      onDrag(e, polygon);
    } else {
      this.sendAction('onDrag', e, polygon);
    }
  }
});

GMapPolygonComponent.reopenClass({
  positionalParams: ['mapContext']
});

export default GMapPolygonComponent;
