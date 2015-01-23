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
    page = 1,
    friends = [],
    selectedTrip,
    map;

var settings = {
  rate: 0.57
};

history.pushState({page: 'trips'}, 'trips');

window.onpopstate = function(event) {
  if(event.state) {
    if(event.state.page === 'friends') {
      showFriendView();
    } else if(event.state.page === 'trips' || event.state.page === 'success') {
      showTripView();
    }
  }
}


fetchFriends(renderFriends);
fetchMe(renderMe);
fetchTrips(page, renderTrips);
fetchSettings(renderSettings);


$('#trip').on('click', '.nextTrip, .prevTrip', function(e) {
  var tripId = $(e.target).data('tripId'),
      trip = _.findWhere(trips, {id: tripId});

  if(trip) {
    renderTrip(trip);
  }
});


$('.btn-select-trip').click(function() {
  selectedTrip = $('#trip').data('trip');

  if(!selectedTrip) {
    showAlert('Please choose a trip');
  } else {
    hideAlert();
    showFriendView();
  }
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
    var error = _.some(data, function(response) {
      return !!response.error;
    });

    if(!error) {
      showSuccessView(friendsToCharge.length);
    } else {
      $('.splitList .friend').not('.me').each(function(idx) {
        if(data[idx].error) {
          $(this).addClass('failed');
          $('.friendResult', this).text('Failed: ' + data[idx].error.message);
        } else {
          $('.friendResult', this).text('Venmo Request Succeeded');
        }
      });
    }
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
  if(!trips.length) {
    $('#loading').fadeOut('fast');

    if(data.length) {
      trips = trips.concat(data);
      renderTrip(_.first(trips));
    } else {
      return showAlert('No Trips', 'error');
    }
  } else {
    if(data.length) {
      _.last(trips).prevTrip = _.first(data).id;
      _.first(data).nextTrip = _.last(trips).id;
      renderTrip(_.last(trips));
      trips = trips.concat(data);
    } else {
      $('.prevTrip')
        .removeClass('spinning')
        .addClass('disabled');
    }
  }

  if(data.length) {
    page += 1;
  } else {
    page = undefined;
  }
}


function renderTrip(trip) {
  $('#trip')
    .html(tripTemplate(trip))
    .data('trip', trip);

  updateCost(trip);

  renderMap(trip);

  updateTripControls(trip);

  if(!trip.prevTrip) {
    fetchTrips(page, renderTrips);
  }
}


function updateCost(trip) {
  var tripCost = calculateTripCost(trip);
  $('#trip .costData').html(formatCost(tripCost));
}


function renderMap(trip) {
  var map = L.mapbox.map('map', 'automatic.idonii25', {attributionControl: false, zoomControl: false})
      start = [trip.start_location.lat, trip.start_location.lon],
      end = [trip.end_location.lat, trip.end_location.lon];

  if (trip.path) {
    var polyline = L.Polyline.fromEncoded(trip.path, {color: '#08b1d5', opacity: 0.9});

    map.fitBounds(polyline.getBounds()).zoomOut();

    polyline.addTo(map);
  } else {
    map.fitBounds([start, end]);
  }

  var startIcon = L.icon({
    iconUrl: '/images/marker_start.png',
    iconSize: [70, 64],
    iconAnchor: [35, 50],
    popupAnchor: [0,-44],
    shadowUrl: '/images/marker_shadow.png',
    shadowSize: [70, 64],
    shadowAnchor: [35, 50]
  });

  var endIcon = L.icon({
    iconUrl: '/images/marker_end.png',
    iconSize: [70, 64],
    iconAnchor: [35, 50],
    popupAnchor: [0,-44],
    shadowUrl: '/images/marker_shadow.png',
    shadowSize: [70, 64],
    shadowAnchor: [35, 50]
  });

  L.marker(start, {title: 'Start Location', icon: startIcon})
    .bindPopup(trip.startAddressFormatted + '<br>' + trip.startAddressCityState + ' ' + trip.startDateTime)
    .addTo(map);

  L.marker(end, {title: 'End Location', icon: endIcon})
    .bindPopup(trip.endAddressFormatted + '<br>' + trip.endAddressCityState + ' ' + trip.endDateTime)
    .addTo(map);
}


function updateTripControls(trip) {
  $('.nextTrip')
    .toggleClass('disabled', !trip.nextTrip)
    .data('tripId', trip.nextTrip);
  $('.prevTrip')
    .toggleClass('spinner', !trip.prevTrip)
    .data('tripId', trip.prevTrip);
}


function renderSettings(data) {
  if(data && data.rate) {
    settings = data;
    settings.rate = parseFloat(settings.rate);
  }
  updateRate();
}


function updateRate() {
  $('.mileageRate').html(formatCost(settings.rate));
  var trip = $('#trip').data('trip');
  if(trip) {
    updateCost(trip);
  }
}


function initializeSlider() {
  $('.mileageRateSlider').slider({
    min: 0,
    max: 1,
    step: 0.01,
    value: settings.rate,
    tooltip: 'hide'
  }).on('change', function() {
    settings.rate = parseFloat($(this).slider('getValue'));
    updateRate();
    calculateSplit();
  }).on('slideStop', function() {
    settings.rate = $(this).slider('getValue');
    updateSettings(settings);
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
    $('.friendEmail')
      .typeahead('val', '')
      .typeahead('close');
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
  $('#selectTrip').removeClass('hide').slideDown();
  history.pushState({page: 'trips'}, 'trips');
}


function showFriendView() {
  $('#selectTrip, #success').slideUp();
  $('#selectFriends').removeClass('hide').slideDown();
  history.pushState({page: 'friends'}, 'friends');

  initializeSlider();
  calculateSplit();
}


function showSuccessView(friendCount) {
  $('#selectFriends, #selectTrip').slideUp();
  $('#success').removeClass('hide').slideDown();
  $('.friendCount').text(' from ' + friendCount + ' friend' + ((friendCount > 1) ? 's' : ''));
  history.pushState({page: 'success'}, 'success');
}
