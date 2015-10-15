var React = require('react');

module.exports = class Success extends React.Component {
  constructor(props) {
    super(props);
  }

  pluralize(word, quantity) {
    if(quantity === 1) {
      return word;
    } else {
      return word + 's';
    }
  }

  render() {
    return (
      <div className="hide">
        <h1 className="success-header">Success</h1>
        <div className="success-image" />
        <div className="success-text">Expect a payment from {this.props.friendCount} {this.pluralize('friend', this.props.friendCount)} soon.</div>
        <div className="btn btn-green center-block btn-show-trips" onClick={this.props.showTripView}>Again!</div>
      </div>
    );
  }
};
