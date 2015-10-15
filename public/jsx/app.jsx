var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var helper = require('../javascripts/helper');
var Trips = require('../jsx/trips.jsx');
var Friends = require('../jsx/friends.jsx');
var Success = require('../jsx/success.jsx');
window.jQuery = $;

require('bootstrap-sass');
require('bootstrap-slider');
require('typeahead.js');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rate: 0.57,
      selectedTrip: {},
      friendCount: 0
    };

    this.selectTrip = (trip) => {
      this.setState({selectedTrip: trip});
      this.showFriendsView();
    };

    this.setRate = (rate) => {
      this.setState({rate: rate});
      this.saveSettingsToServer({rate: rate});
    };

    this.showTripView = () => {
      $(ReactDOM.findDOMNode(this.refs.friends)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.success)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.trips)).removeClass('hide').slideDown();
    };

    this.showFriendsView = () => {
      $(ReactDOM.findDOMNode(this.refs.trips)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.success)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.friends)).removeClass('hide').slideDown();
    };

    this.showSuccessView = (friendCount) => {
      this.setState({friendCount: friendCount});
      $(ReactDOM.findDOMNode(this.refs.trips)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.friends)).slideUp();
      $(ReactDOM.findDOMNode(this.refs.success)).removeClass('hide').slideDown();
    };
  }

  componentDidMount() {
    this.loadSettingsFromServer();
  }

  loadSettingsFromServer() {
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
  }

  saveSettingsToServer(settings) {
    $.ajax({
      url: this.props.settingsURL,
      method: 'PUT',
      data: settings,
      error: function(xhr, status, err) {
        console.error(this.props.settingsURL, status, err.toString());
      }.bind(this)
    });
  }

  render() {
    return (
      <div>
        <Trips url="/api/trips" rate={this.state.rate} selectTrip={this.selectTrip} ref="trips" />
        <Friends url="/api/friends" meURL="/api/me" expenseURL="/api/expenses" rate={this.state.rate} trip={this.state.selectedTrip} setRate={this.setRate} showSuccessView={this.showSuccessView} ref="friends" />
        <Success showTripView={this.showTripView} friendCount={this.state.friendCount} ref="success" />
      </div>
    );
  }
}

ReactDOM.render(
  <App settingsURL='/api/settings' />,
  document.getElementById('app')
);
