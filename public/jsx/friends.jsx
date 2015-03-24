var React = require('react');
var classNames = require('classnames');
var $ = require('jquery');
var _ = require('underscore');
var helper = require('../javascripts/helper');

require('bootstrap-slider');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      friends: [],
      selectedFriends: []
    };
  },
  componentDidMount: function() {
    this.loadFriendsFromServer();
    this.loadMeFromServer();

    this.initializeSlider();
  },
  loadFriendsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({
          friends: data
        });
        this.initializeTypeahead();
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  loadMeFromServer: function() {
    $.ajax({
      url: this.props.meURL,
      dataType: 'json',
      success: function(data) {
        var me = _.extend(data, {is_me: true});
        this.setState({me: me});
        this.includeSelf();
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.meURL, status, err.toString());
      }.bind(this)
    });
  },
  initializeSlider: function() {
    var self = this;
    $('.mileage-rate-slider').slider({
      min: 0,
      max: 1,
      step: 0.01,
      value: this.props.rate,
      tooltip: 'hide'
    }).on('change', function() {
      self.props.setRate(parseFloat($(this).slider('getValue')));
    }).on('slideStop', function() {
      self.props.setRate(parseFloat($(this).slider('getValue')));
    });
  },
  initializeTypeahead: function() {
    var tokens = this.state.friends.map(function(friend) {
      return friend.display_name;
    });

    $(this.refs.friendEmail.getDOMNode()).typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'friends',
      displayKey: 'value',
      source: helper.substringMatcher(tokens)
    }).on('typeahead:selected', function(e, friend) {
      $(this.refs.addFriend.getDOMNode()).trigger('click');
      $(this.refs.friendEmail.getDOMNode())
        .typeahead('val', '')
        .typeahead('close');
    }.bind(this));
  },
  getCostPerPerson: function() {
    var totalCost = helper.calculateTripCost(this.props.trip, this.props.rate);

    return totalCost / this.state.selectedFriends.length;
  },
  includeSelf: function() {
    if(this.refs.includeSelf.getDOMNode().checked) {
      this.state.selectedFriends.unshift(this.state.me);
    } else {
      this.state.selectedFriends.shift();
    }
    this.setState({selectedFriends: this.state.selectedFriends});
  },
  addFriend: function(e) {
    e.preventDefault();

    var friendName = $(this.refs.friendEmail.getDOMNode()).typeahead('val'),
        friend = _.findWhere(this.state.friends, {display_name: friendName});

    if(!friendName) {
      return alert('Enter a friend name');
    }

    if(!friend) {
      //must be an email or phone number
      if(friendName.indexOf('@') === -1 && friendName.replace(/\D/g,'') < 2000000) {
        return alert('Please enter a valid email or phone number');
      }

      friend = {
        display_name: friendName,
        profile_picture_url: 'https://s3.amazonaws.com/venmo/no-image.gif'
      };
    }

    this.state.selectedFriends.push(friend);
    this.setState({selectedFriends: this.state.selectedFriends});
  },
  removeFriend: function(friend) {
    this.setState({
      selectedFriends: _.reject(this.state.selectedFriends, function(f) {
        return f.display_name === friend.display_name;
      })
    });
  },
  friendList: function() {
    return this.state.selectedFriends.map(function(friend, idx) {
      return (
        <Friend friend={friend} getCostPerPerson={this.getCostPerPerson} removeFriend={this.removeFriend} key={idx} />
      );
    }.bind(this));
  },
  requestPayment: function() {
    var costPerPerson = this.getCostPerPerson(),
        friendsToCharge = _.reject(this.state.selectedFriends, function(friend) {
          return !!friend.is_me;
        });

    if(!friendsToCharge.length) {
      return alert('Select at least one friend to charge');
    }

    $(this.refs.requestPayment.getDOMNode()).prop('disabled', true);

    $.ajax({
      url: this.props.expenseURL,
      method: 'POST',
      data: {
        tripId: this.props.trip.id,
        friends: JSON.stringify(friendsToCharge),
        costPerPerson: costPerPerson,
        note: helper.formatNote(this.props.trip)
      },
      success: function(data) {
        //check if any individual expense requests failed
        var error = _.some(data, function(response) {
          return !!response.error;
        });

        if(!error) {
          this.props.showSuccessView(friendsToCharge.length);
        } else {
          friendsToCharge.forEach(function(friend, idx) {
            if(data[idx].error) {
              friend.result = 'Failed: ' + data[idx].error.message;
              friend.error = true;
            } else {
              friend.result = 'Venmo Request Succeeded';
              friend.error = false;
            }
          });
          this.setState({selectedFriends: this.state.selectedFriends});
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.expenseURL, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {
    return (
      <div className="hide">
        <h1 className="split-it-up">Split it up</h1>
        <form className="friend-email-container" onSubmit={this.addFriend}>
          <input className="friend-email typeahead" type="text" placeholder="Enter an email or phone no" ref="friendEmail" />
          <button className="btn btn-default btn-add-friend" type="submit" ref="addFriend">Add</button>
        </form>
        <div className="mileage-cost-container">
          <label className="allcaps-label">Cost Per Mile</label>
          <div className="mileage-rate">{helper.formatCost(this.props.rate)}</div>
          <div className="mileage-rate-slider-container">
            <span className="mileage-label">0</span>
            <input className="mileage-rate-slider" />
            <span className="mileage-label">1.00</span>
          </div>
        </div>
        <div className="split-people-container">
          <div className="split-list-controls">
            <label className="split-between-label allcaps-label">Split Between</label>
            <div className="include-self-container">
              <label>Include self?</label>
              <input className="include-self" type="checkbox" defaultChecked="true" ref="includeSelf" onChange={this.includeSelf} />
            </div>
          </div>
          <div className="split-list">{this.friendList()}</div>
          <div className="btn btn-orange center-block btn-request-payment" onClick={this.requestPayment} ref="requestPayment">Request Payment</div>
        </div>
      </div>
    );
  }
});


var Friend = React.createClass({
  removeFriend: function() {
    this.props.removeFriend(this.props.friend);
  },
  render: function() {
    return (
      <div className={classNames({
          friend: true,
          me: this.props.friend.is_me,
          failed: this.props.friend.error
        })}>
        <img src={this.props.friend.profile_picture_url} />
        <div className="friend-name">{this.props.friend.display_name}</div>
        <div className="friend-charge">{helper.formatCost(this.props.getCostPerPerson())}</div>
        <div className="friend-remove" onClick={this.removeFriend}>&times;</div>
        <div className="friend-result">{this.props.friend.result}</div>
      </div>
    );
  }
});
