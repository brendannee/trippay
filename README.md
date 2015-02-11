# Trip Pay

TripPay is an app the lets drivers split the cost of trips between passengers.

It was built as part of the [BMW Hack The Drive](http://www.hackthedrive.com/) hackathon on Jan 9-11th 2015 by [Brendan Nee](https://github.com/brendannee), [Blossom Woo](https://github.com/blossomwoo) and [Duncan Carroll](https://github.com/duncancarroll)

## Screenshots

### Sign In
<img src="https://cloud.githubusercontent.com/assets/96217/6141923/fc6c68b2-b161-11e4-988e-e45adb0b89f4.png" alt="Sign In" width="300">

### Select a trip
<img src="https://cloud.githubusercontent.com/assets/96217/6141925/fc6df358-b161-11e4-9689-63bbb4cc9e16.png" alt="Select a trip" width="300">

### Add friends
<img src="https://cloud.githubusercontent.com/assets/96217/6141926/fc6e2954-b161-11e4-896e-b2c04a071e10.png" alt="Add friends" width="300">

### Choose rate
<img src="https://cloud.githubusercontent.com/assets/96217/6141924/fc6dc91e-b161-11e4-8859-bbb5e0ac7d6b.png" alt="Choose rate" width="300">

### Success
<img src="https://cloud.githubusercontent.com/assets/96217/6141927/fc709b08-b161-11e4-942c-3602a8db30ed.png" alt="Success" width="300">


## Setup

Install node.js and gulp

    brew install node

    npm install gulp -g

## Install Dependencies

    npm install


Copy `config-sample.json` to `config.json` and add your config settings.

## running

Make sure mongo is running

    mongod

Run the server

    gulp develop

Open `http://localhost:3000` in your browser

## debugging

    DEBUG=trippay gulp develop
