var _ = require('underscore'),
    polyline = require('polyline');

require('mapbox.js');

// Setup mapbox
L.mapbox.accessToken = 'pk.eyJ1IjoiYXV0b21hdGljIiwiYSI6IldFaGdQa2MifQ.Q-jIc0EjcdTTft6zJVLw-A';


exports.renderMap = function(trip) {
  var map = L.mapbox.map('map', 'automatic.idonii25', {attributionControl: false, zoomControl: false}),
      start = [trip.start_location.lat, trip.start_location.lon],
      end = [trip.end_location.lat, trip.end_location.lon],
      lineStyle = {color: '#08b1d5', opacity: 0.9},
      iconStyle = {
          iconSize: [70, 64],
          iconAnchor: [35, 50],
          popupAnchor: [0,-44],
          shadowUrl: '/images/marker_shadow.png',
          shadowSize: [70, 64],
          shadowAnchor: [35, 50]
      },
      startIcon = L.icon(_.extend(iconStyle, {iconUrl: '/images/marker_start.png'})),
      endIcon = L.icon(_.extend(iconStyle, {iconUrl: '/images/marker_end.png'}));

  if(trip.path) {
    line = L.polyline(polyline.decode(trip.path), lineStyle);
  } else {
    line = L.polyline([start, end], lineStyle);
  }

  line.addTo(map);

  map.fitBounds(line.getBounds(), {padding: [10, 10]});

  L.marker(start, {title: 'Start Location', icon: startIcon})
    .bindPopup(trip.startAddressFormatted + '<br>' + trip.startAddressCityState + ' ' + trip.startDateTime)
    .addTo(map);

  L.marker(end, {title: 'End Location', icon: endIcon})
    .bindPopup(trip.endAddressFormatted + '<br>' + trip.endAddressCityState + ' ' + trip.endDateTime)
    .addTo(map);
};
