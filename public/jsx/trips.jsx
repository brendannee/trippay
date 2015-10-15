var React = require('react');
var classNames = require('classnames');
var $ = require('jquery');
var _ = require('underscore');
var helper = require('../javascripts/helper');
var map = require('../javascripts/map');

module.exports = class Trips extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 1,
      trips: []
    };

    this.renderTrip = (tripID) => {
      this.setState({
        currentTrip: _.findWhere(this.state.trips, {id: tripID})
      });

      if(!this.state.currentTrip.prevTrip) {
        //load more trips
        this.loadTripsFromServer();
      }
    };

    this.selectTrip = () => {
      if(!this.state.currentTrip) {
        return alert('Please choose a trip');
      }
      this.props.selectTrip(this.state.currentTrip);
    };
  }

  componentDidMount() {
    this.loadTripsFromServer();
  }

  loadTripsFromServer() {
    if(this.shouldLoad()) {
      this.setState({loading: true});
      $.ajax({
        url: this.props.url + '?page=' + this.state.page,
        dataType: 'json',
        success: function(data) {
          var currentTrips = this.state.trips;
          if(this.state.trips.length && data.length) {
            _.last(currentTrips).prevTrip = _.first(data).id;
            _.first(data).nextTrip = _.last(currentTrips).id;
          }

          var trips = currentTrips.concat(data.map(helper.formatTrip));
          var page = (data.length) ? this.state.page + 1 : undefined;

          this.setState({
            page: page,
            trips: trips,
            currentTrip: this.state.currentTrip || _.first(trips),
            loading: false
          });
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
          this.setState({loading: false});
        }.bind(this)
      });
    }
  }

  shouldLoad() {
    return this.state.loading !== true && this.state.page;
  }

  getLoading() {
    if(this.state.loading !== false) {
      return (
        <div className="loading">
          <div>Loading...</div>
          <div className="spinner"></div>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <h1 className="select-a-trip">Select a Trip</h1>
        <Trip trip={this.state.currentTrip} rate={this.props.rate} renderTrip={this.renderTrip} />
        <div className="btn btn-green center-block btn-select-trip" onClick={this.selectTrip}>Ok</div>
        {this.getLoading()}
      </div>
    );
  }
};


class Trip extends React.Component {
  constructor(props) {
    super(props);

    this.prevTrip = () => {
      this.props.renderTrip(this.props.trip.prevTrip);
    };

    this.nextTrip = () => {
      this.props.renderTrip(this.props.trip.nextTrip);
    };
  }

  componentDidUpdate() {
    if(this.props.trip) {
      map.updateMap(this.props.trip);
    }
  }

  render() {
    if(!this.props.trip) {
      return (<div className="trip"></div>);
    }
    return (
      <div className="trip">
        <div className="map-container">
          <div className={classNames('prev-trip', {hidden: !this.props.trip.prevTrip})} onClick={this.prevTrip}>&#9664;</div>
          <div className="map-overlay"></div>
          <div id="map" className="map"></div>
          <div className={classNames('next-trip', {hidden: !this.props.trip.nextTrip})} onClick={this.nextTrip}>&#9654;</div>
        </div>
        <div className="trip-data">
          <div className="top-data">
            <div className="from">
              <label className="allcaps-label">From</label>
              <div className="from-address bold-text">{this.props.trip.startAddressFormatted}</div>
              <div className="from-city light-text">{this.props.trip.startAddressCityState}</div>
            </div>
            <div className="to">
              <label className="allcaps-label">To</label>
              <div className="to-address bold-text">{this.props.trip.endAddressFormatted}</div>
              <div className="to-city light-text">{this.props.trip.endAddressCityState}</div>
            </div>
          </div>
          <div className="bottom-data">
            <div className="cost">
              <label className="allcaps-label">Cost</label>
              <div className="cost-data">{helper.formatCost(helper.calculateTripCost(this.props.trip, this.props.rate))}</div>
            </div>
            <div className="when">
              <label className="allcaps-label">When</label>
              <div className="whenDate bold-text">{this.props.trip.startDate}</div>
              <div className="whenTime light-text">{this.props.trip.startTimeFormatted}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
