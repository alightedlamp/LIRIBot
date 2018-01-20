require('dotenv').config();
const keys = require('./config/keys');

// Set up third-party services
const Spotify = require('node-spotify-api');
const Twitter = require('twitter');
const spotify = new Spotify(keys.spotify);
const twitterClient = new Twitter(keys.twitter);
