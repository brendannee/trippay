var $ = jQuery = require('jquery'),
    _ = require('underscore'),
    moment = require('moment-timezone'),
    helper = require('./helper'),
    data = require('./data'),
    map = require('./map');

require('bootstrap');
require('bootstrap-slider');
require('typeahead.js');

// Set underscore template settings
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

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
};


data.fetchFriends(renderFriends);
data.fetchMe(renderMe);
data.fetchTrips(page, renderTrips);
data.fetchSettings(renderSettings);


$('#trip').on('click', '.next-trip, .prev-trip', function(e) {
  var tripId = $(e.target).data('tripId'),
      trip = _.findWhere(trips, {id: tripId});

  if(trip) {
    renderTrip(trip);
  }
});


$('.btn-select-trip').click(function() {
  selectedTrip = $('#trip').data('trip');

  if(!selectedTrip) {
    helper.showAlert('Please choose a trip');
  } else {
    helper.hideAlert();
    showFriendView();
  }
});


$('.btn-add-friend').click(function() {
  var friendName = $('.friend-email').typeahead('val'),
      friend = _.findWhere(friends, {display_name: friendName});

  if(!friendName) {
    return helper.showAlert('Enter a friend name');
  }

  helper.hideAlert();

  if(!friend) {
    friend = {
      display_name: friendName,
      profile_picture_url: 'https://s3.amazonaws.com/venmo/no-image.gif'
    };
  }

  $(friendTemplate(friend))
    .data('friend', friend)
    .appendTo('.split-list');

  calculateSplit();
});


$('.btn-request-payment').click(function() {
  var selectedFriends = getSelectedFriends(),
      costPerPerson = helper.calculateTripCost(selectedTrip, settings) / selectedFriends.length,
      friendsToCharge = _.reject(selectedFriends, function(friend) {
        return !!friend.is_me;
      });

  if(!friendsToCharge.length) {
    return helper.showAlert('Select at least one friend to charge');
  }

  $(this).prop('disabled', true);

  data.createExpense(selectedTrip, friendsToCharge, costPerPerson, function(data) {
    var error = _.some(data, function(response) {
      return !!response.error;
    });

    if(!error) {
      showSuccessView(friendsToCharge.length);
    } else {
      $('.split-list .friend').not('.me').each(function(idx) {
        if(data[idx].error) {
          $(this).addClass('failed');
          $('.friend-result', this).text('Failed: ' + data[idx].error.message);
        } else {
          $('.friend-result', this).text('Venmo Request Succeeded');
        }
      });
    }
  });
});


$('.btn-show-trips').click(function() {
  showTripView();
});


$('.include-self').change(function() {
  if($(this).is(':checked')) {
    $(friendTemplate(me))
      .data('friend', me)
      .addClass('me')
      .prependTo('.split-list');
  } else {
    $('.split-list .friend').first().remove();
  }
  calculateSplit();
});


$('.split-list').on('click', '.friend-remove', function() {
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
    .appendTo('.split-list');
}


function renderTrips(data) {
  if(!trips.length) {
    $('#loading').fadeOut('fast');

    if(data.length) {
      trips = trips.concat(data);
      renderTrip(_.first(trips));
    } else {
      return helper.showAlert('No Trips', 'error');
    }
  } else {
    if(data.length) {
      _.last(trips).prevTrip = _.first(data).id;
      _.first(data).nextTrip = _.last(trips).id;
      renderTrip(_.last(trips));
      trips = trips.concat(data);
    } else {
      $('.prev-trip')
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

  map.renderMap(trip);

  updateTripControls(trip);

  if(!trip.prevTrip) {
    data.fetchTrips(page, renderTrips);
  }
}


function updateCost(trip) {
  var tripCost = helper.calculateTripCost(trip, settings);
  $('#trip .cost-data').html(helper.formatCost(tripCost));
}


function updateTripControls(trip) {
  $('.next-trip')
    .toggleClass('disabled', !trip.nextTrip)
    .data('tripId', trip.nextTrip);
  $('.prev-trip')
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
  $('.mileage-rate').html(helper.formatCost(settings.rate));
  var trip = $('#trip').data('trip');
  if(trip) {
    updateCost(trip);
  }
}


function initializeSlider() {
  $('.mileage-rate-slider').slider({
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
    data.updateSettings(settings);
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

  $('.friend-email').typeahead({
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
    $('.friend-email')
      .typeahead('val', '')
      .typeahead('close');
  });
}


function getSelectedFriends() {
  return $.map($('.split-list .friend'), function(friend) {
    return $(friend).data('friend');
  });
}


function calculateSplit() {
  var selectedFriends = getSelectedFriends(),
      totalCost = helper.calculateTripCost(selectedTrip, settings),
      costPerPerson = totalCost / selectedFriends.length;

  $('.split-list .friend .friend-charge').html(helper.formatCost(costPerPerson));
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
