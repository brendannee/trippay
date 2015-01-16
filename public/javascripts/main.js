// Set underscore template settings
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};


// Setup mapbox
L.mapbox.accessToken = 'pk.eyJ1IjoiYXV0b21hdGljIiwiYSI6IldFaGdQa2MifQ.Q-jIc0EjcdTTft6zJVLw-A';


var tripTemplate = _.template($('#tripTemplate').html()),
    friendTemplate = _.template($('#friendTemplate').html()),
    me = {},
    trips = [],
    friends = [],
    selectedTrip,
    map;

// user settings
var mileageRate = 0.57;

history.pushState({page: 'trips'}, 'trips');

window.onpopstate = function (event) {
  if(event.state) {
    if(event.state.page === 'friends') {
      showFriendView();
    } else if(event.state.page === 'success') {
      showSuccessView();
    } else if(event.state.page === 'trips') {
      showTripView();
    }
  }
}

if(squareMap()) {
  $('body').addClass('squareMap');
}

fetchFriends(renderFriends);
fetchMe(renderMe);
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
  selectedTrip = $('#trip').data('trip');

  showFriendView();
});


$('.btn-add-friend').click(function() {
  var friendName = $('.friendEmail').typeahead('val'),
      friend = _.findWhere(friends, {display_name: friendName});

  if(!friendName) {
    return showAlert('Enter a friend name');
  }

  hideAlert();

  if(!friend) {
    friend = {
      display_name: friendName,
      profile_picture_url: 'https://s3.amazonaws.com/venmo/no-image.gif'
    }
  }

  $(friendTemplate(friend))
    .data('friend', friend)
    .appendTo('.splitList');

  calculateSplit();
});


$('.btn-request-payment').click(function() {
  var selectedFriends = getSelectedFriends(),
      costPerPerson = calculateTripCost(selectedTrip) / selectedFriends.length,
      friendsToCharge = _.reject(selectedFriends, function(friend) {
        return !!friend.is_me;
      });

  if(!friendsToCharge.length) {
    return showAlert('Select at least one friend to charge');
  }

  $(this).prop('disabled', true);

  createExpense(selectedTrip, friendsToCharge, costPerPerson, function(data) {
    $(this).prop('disabled', false);
    //TODO: handle failure
    showSuccessView(friendsToCharge.length);
  });
});


$('.btn-show-trips').click(function() {
  showTripView();
});


$('.includeSelf').change(function() {
  if($(this).is(':checked')) {
    $(friendTemplate(me))
      .data('friend', me)
      .addClass('me')
      .prependTo('.splitList');
  } else {
    $('.splitList .friend').first().remove();
  }
  calculateSplit();
});


$('.splitList').on('click', '.friendRemove', function() {
  $(this).parents('.friend').remove();
  calculateSplit();
});


function renderFriends(data) {
  friends = data;
  initializeTypeahead();
}


function renderMe(data) {
  me = _.extend(data, {is_me: true});

  $(friendTemplate(me))
    .data('friend', me)
    .addClass('me')
    .appendTo('.splitList');
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
  var map = L.mapbox.map('map', 'automatic.idonii25', {attributionControl: false, zoomControl: false})
      start = [trip.StartLocation.Lat, trip.StartLocation.Lng],
      end = [trip.LastKnownLocation.Lat, trip.LastKnownLocation.Lng];

  if(start[0] !== "NaN" && start[1] !== "NaN" && end[0] !== "NaN" && end[1] !== "NaN") {
    map.fitBounds([start, end], {padding: [20, 20]});

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
  $('.mileageRate').html(formatCost(mileageRate));
}


function initializeSlider() {
  $('.mileageRateSlider').slider({
    min: 0,
    max: 1,
    step: 0.01,
    value: mileageRate,
    tooltip: 'hide'
  }).on('change', function() {
    mileageRate = $(this).slider('getValue');
    renderSettings();
    calculateSplit();
  });
}


function initializeTypeahead() {
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
  }).on('typeahead:selected', function(e, friend) {
    $('.btn-add-friend').trigger('click');
    $('.friendEmail').typeahead('val', '');
  });
}


function getSelectedFriends() {
  return $.map($('.splitList .friend'), function(friend) {
    return $(friend).data('friend');
  });
}


function calculateSplit() {
  var selectedFriends = getSelectedFriends(),
      totalCost = calculateTripCost(selectedTrip),
      costPerPerson = totalCost / selectedFriends.length;

  $('.splitList .friend .friendCharge').html(formatCost(costPerPerson));
}


function showTripView() {
  $('#success, #selectFriends').slideUp();
  $('#selectTrip').removeClass('hide').show();
  history.pushState({page: 'trips'}, 'trips');
}


function showFriendView() {
  $('#selectTrip, #success').slideUp();
  $('#selectFriends').removeClass('hide').show();
  history.pushState({page: 'friends'}, 'friends');

  initializeSlider();
  calculateSplit();
}


function showSuccessView(friendCount) {
  $('#selectFriends, #selectTrip').slideUp();
  $('#success').removeClass('hide').show();
  $('.friendCount').text(' from ' + friendCount + ' friend' + ((friendCount > 1) ? 's' : ''));
  history.pushState({page: 'success'}, 'success');
}


function squareMap() {
  var ua = navigator.userAgent.toLowerCase();
  if(ua.indexOf('android webview browser') != -1) {
    return true;
  } else if(ua.indexOf('safari') != -1) {
    return (ua.indexOf('chrome') === -1);
  } else {
    return false;
  }
}
