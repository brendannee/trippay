// Set underscore template settings
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};


// Setup mapbox
L.mapbox.accessToken = 'pk.eyJ1IjoiYXV0b21hdGljIiwiYSI6IldFaGdQa2MifQ.Q-jIc0EjcdTTft6zJVLw-A';


var tripTemplate = _.template($('#tripTemplate').html()),
    trips = [],
    friends = [],
    map;

// user settings
var mileageRate = 0.56;

fetchFriends(renderFriends);
fetchTrips(renderTrips);
renderSettings();


$('#trip').on('click', '.nextTrip, .prevTrip', function(e) {
  var tripId = $(e.target).data('tripId'),
      trip = _.findWhere(trips, {_id: tripId});

  if(trip) {
    renderTrip(trip);
  }
});


$('.btn-select-trip').click(function() {
  $('#selectTrip').slideUp();
  $('#selectFriends').removeClass('hide');

  $('.mileageRateSlider').slider({
    min: 0,
    max: 1,
    step: 0.01,
    formater: formatCost,
    value: mileageRate,
    tooltip: 'show'
  }).on('change', function() {
    mileageRate = $(this).slider('getValue');
    renderSettings();
  });

  var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
      var matches, substrRegex;

      // an array that will be populated with substring matches
      matches = [];

      // regex used to determine if a string contains the substring `q`
      substrRegex = new RegExp(q, 'i');

      // iterate through the pool of strings and for any string that
      // contains the substring `q`, add it to the `matches` array
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          matches.push({ value: str });
        }
      });

      cb(matches);
    };
  };

  function getTokens() {
    var tokens = [];
    friends.forEach(function(friend) {
      tokens.push(friend.display_name);
    });
    return tokens;
  }

  $('.friendEmail').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'friends',
    displayKey: 'value',
    source: substringMatcher(getTokens())
  });

});


function renderFriends(data) {
  friends = data;
  console.log(friends);
}


function renderTrips(data) {
  trips = data;
  if(trips.length) {
    renderTrip(trips[0]);
  } else {
    showAlert('No Trips', 'error');
  }
}


function renderTrip(trip) {

  $('#trip')
    .html(tripTemplate(trip))
    .data('trip', trip);

  updateCost(trip);

  renderMap(trip);

  updateTripControls(trip);
}


function updateCost(trip) {
  var tripCost = calculateTripCost(trip);
  $('#trip .costData').html(formatCost(tripCost));
}


function renderMap(trip) {
  var map = L.mapbox.map('map', 'automatic.idonii25')
      start = [trip.StartLocation.Lat, trip.StartLocation.Lng],
      end = [trip.LastKnownLocation.Lat, trip.LastKnownLocation.Lng];

  map.fitBounds([start, end]);

  var startIcon = L.icon({
    iconUrl: '/images/marker_start.png',
    iconSize: [70, 64],
    iconAnchor: [35, 64],
    popupAnchor: [0,-41],
    shadowUrl: '/images/marker_shadow.png',
    shadowSize: [70, 64],
    shadowAnchor: [35, 64]
  });

  var endIcon = L.icon({
    iconUrl: '/images/marker_end.png',
    iconSize: [70, 64],
    iconAnchor: [35, 64],
    popupAnchor: [0,-41],
    shadowUrl: '/images/marker_shadow.png',
    shadowSize: [70, 64],
    shadowAnchor: [35, 64]
  });

  L.marker(start, {title: 'Start Location', icon: startIcon})
    .bindPopup(trip.StartAddressFormatted + '<br>' + trip.StartCityState + trip.StartDateTime)
    .addTo(map);

  L.marker(end, {title: 'End Location', icon: endIcon})
    .bindPopup(trip.StartAddressFormatted + '<br>' + trip.StartCityState + trip.StartDateTime)
    .addTo(map);
}

function updateTripControls(trip) {
  $('.nextTrip')
    .toggleClass('disabled', !trip.NextTrip)
    .data('tripId', trip.NextTrip);
  $('.prevTrip')
    .toggleClass('disabled', !trip.PrevTrip)
    .data('tripId', trip.PrevTrip);
}


function renderSettings() {
  $('.mileageRate').html(mileageRate);
}
