var React = require('react');
var $ = jQuery = require('jquery');
var helper = require('../javascripts/helper');
var Trips = require('../jsx/trips.jsx');
var Friends = require('../jsx/friends.jsx');
var Success = require('../jsx/success.jsx');

require('bootstrap-sass');
require('bootstrap-slider');
require('typeahead.js');


var App = React.createClass({
  getInitialState: function() {
    return {
      rate: 0.57,
      selectedTrip: {}
    };
  },
  componentDidMount: function() {
    this.loadSettingsFromServer();
  },
  loadSettingsFromServer: function() {
    $.ajax({
      url: this.props.settingsURL,
      dataType: 'json',
      success: function(data) {
        if(data && data.rate) {
          this.setState({rate: parseFloat(data.rate)});
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.settingsURL, status, err.toString());
      }.bind(this)
    });
  },
  selectTrip: function(trip) {
    this.setState({selectedTrip: trip});
    this.showFriendsView();
  },
  setRate: function(rate) {
    this.setState({rate: rate});
  },
  showTripView: function() {
    $(this.refs.friends.getDOMNode()).slideUp();
    $(this.refs.success.getDOMNode()).slideUp();
    $(this.refs.trips.getDOMNode()).removeClass('hide').slideDown();
    history.pushState({page: 'trips'}, 'trips');
  },
  showFriendsView: function() {
    $(this.refs.trips.getDOMNode()).slideUp();
    $(this.refs.success.getDOMNode()).slideUp();
    $(this.refs.friends.getDOMNode()).removeClass('hide').slideDown();
    history.pushState({page: 'friends'}, 'friends');
  },
  showSuccessView: function(friendCount) {
    $(this.refs.trips.getDOMNode()).slideUp();
    $(this.refs.friends.getDOMNode()).slideUp();
    $(this.refs.success.getDOMNode()).removeClass('hide').slideDown();
    history.pushState({page: 'success'}, 'success');
  },
  render: function() {
    return (
      <div>
        <Trips url="/api/trips" rate={this.state.rate} selectTrip={this.selectTrip} ref="trips" />
        <Friends url="/api/friends" meURL="/api/me" expenseURL="/api/expenses" rate={this.state.rate} trip={this.state.selectedTrip} setRate={this.setRate} showSuccessView={this.showSuccessView} ref="friends" />
        <Success showTripView={this.showTripView} ref="success" />
      </div>
    );
  }
});

React.render(
  <App settingsURL='/api/settings' />,
  document.getElementById('app')
);
