var React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div className="hide">
        <h1 className="success-header">Success</h1>
        <div className="success-image" />
        <div className="success-text">Payment has been requested<span className="friendCount"></span>.</div>
        <div className="btn btn-green center-block btn-show-trips" onClick={this.props.showTripView}>Again!</div>
      </div>
    );
  }
});
