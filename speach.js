const config = require('./config.js');

// Configure speach recognition
const Sonus = require('sonus');
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient({
  projectID: 'monique-191504',
  keyFilename: './config/keyfile.json'
});
const hotwords = [{ file: config.hotwordsFile, hotword: 'monique' }];
Sonus.init({ hotwords }, speechClient);

// Feed Monique commands to Sonus
const commands = {
  '(my) tweets': function() {
    console.log('Voice command: my tweets');
    Monique['my-tweets']();
  },
  'spotify (this) :song': function(song) {
    console.log('Voice command: spotify this song');
    Monique['spotify-this-song'](song);
  },
  'movie (this) :movie': function(movie) {
    console.log('Voice command: movie this');
    Monique['movie-this'](movie);
  },
  'play techno': function() {
    console.log('Voice command: play techno');
    Monique['play-techno']();
  },
  'tell me a joke': function() {
    console.log('Voice command: tell me a joke');
    Monique['tell-me-a-joke']();
  }
};
Sonus.annyang.addCommands(commands);
