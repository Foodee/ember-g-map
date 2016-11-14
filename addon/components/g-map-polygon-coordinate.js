import Ember from 'ember';
import layout from '../templates/components/g-map-polygon-coordinate';
import GMapPolygonComponent from './g-map-polygon';

const { isEmpty, isPresent, observer, computed, run, assert } = Ember;

const GMapPolygonCoordinateComponent = Ember.Component.extend({
  layout: layout,
  classNames: ['g-map-polygon-coordinate'],

  polygon: computed.alias('polygonContext.polygon'),

  init() {
    this._super(arguments);

    const polygonContext = this.get('polygonContext');
    assert('Must be inside {{#g-map-polygon}} component with context set',
      polygonContext instanceof GMapPolygonComponent);

    polygonContext.registerCoordinate(this);
  },

  didInsertElement() {
    this._super();
    if (isEmpty(this.get('coordinate'))) {
      const coordinate = new google.maps.LatLng();
      this.set('coordinate', coordinate);
    }
    this.setPosition();
  },

  willDestroyElement() {
    this.get('polygonContext').unregisterCoordinate(this);
  },

  coordsChanged: observer('lat', 'lng', function() {
    run.once(this, 'setPosition');
  }),

  setPosition() {
    const polygonContext = this.get('polygonContext');
    const lat = this.get('lat');
    const lng = this.get('lng');

    if (isPresent(polygonContext) && isPresent(lat) && isPresent(lng)) {
      const coordinate = new google.maps.LatLng(lat, lng);
      this.set('coordinate', coordinate);
      polygonContext.setPath();
    }
  }
});

GMapPolygonCoordinateComponent.reopenClass({
  positionalParams: ['polygonContext']
});

export default GMapPolygonCoordinateComponent;
