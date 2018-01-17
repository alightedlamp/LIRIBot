require('dotenv').config();

const fs = require('fs');
const request = require('request');
const open = require('open');
const keys = require('./config/keys');

const config = {
  logFile: './resources/log.txt',
  commandFile: './resources/command.txt',
  hotwordsFile: './config/monique.pmdl',
  twitterUserId: '950063649590259712',
  voice: 'Victoria'
};

// Configure speach recognition
const Sonus = require('sonus');
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient({
  projectID: 'monique-191504',
  keyFilename: './config/keyfile.json'
});
const hotwords = [{ file: config.hotwordsFile, hotword: 'monique' }];
const sonus = Sonus.init({ hotwords }, speechClient);

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

// Use say for text to speech
const say = require('say');

// Set up third-party services
const Spotify = require('node-spotify-api');
const Twitter = require('twitter');
const spotify = new Spotify(keys.spotify);
const twitterClient = new Twitter(keys.twitter);

// Monique lives here. Public functions are exposed in the returned object literal
const Monique = (function() {
  const logEvent = function(text) {
    fs.appendFile(config.logFile, text, function(err) {
      if (err) {
        console.log('Error retrieving log file, session will not be logged');
      }
    });
  };

  // Read the random file which contains commands to run, for some reason
  const readCommandFile = function(callback) {
    fs.readFile(config.commandFile, 'utf8', function(err, commandfile) {
      if (err) {
        callback(
          new Error(
            'Error retrieving command file, "do-what-it-says" command will not function'
          )
        );
      } else {
        callback(null, commandfile.split(','));
      }
    });
  };

  // Handle command output
  const handleOutput = function(output) {
    console.log(output);
    if (!Array.isArray(output)) {
      output = output.replace(/\n+/g, '; ');
    }
    Monique.log(`${new Date()}: Response: ${output}`);
  };

  const sayPhrase = function(phrase, voice) {
    say.speak(phrase, voice, err => {
      console.log('Action not spoken');
      Monique.log(`${new Date()}: Error: action not spoken`);
    });
  };

  return {
    log: function(text) {
      logEvent(`${text}\n`);
    },

    start: function() {
      console.log('Hello, how can I help?');
      Sonus.start(sonus);
      // Logs when hotword is recognized
      sonus.on('hotword', (index, keyword) => console.log(`!${keyword}`));
      // Logs the final text result
      sonus.on('final-result', result => console.log(result));
    },

    help: function() {
      console.log(
        "'start': enables voice commands\n'my-tweets': outputs my last 10 tweeks\n'spotify-this-song': opens url to first track in browser and outputs 10 search results\n'movie-this': outputs information for the requested movie\n'do-what-it-says': executes the command in the 'command.txt' file\n'play-techno': hear the computer beatbox\n'tell-me-a-joke': hear a bad joke"
      );
    },

    // Outputs social media stats
    'my-tweets': function() {
      sayPhrase('Here are your tweets', config.voice);
      twitterClient
        .get('/statuses/user_timeline', {
          user_id: config.twitterUserId,
          count: 10
        })
        .then(tweets => {
          handleOutput(
            Object.keys(tweets)
              .map((tweet, i) => `${tweets[i].created_at}: ${tweets[i].text}\n`)
              .join('')
          );
        })
        .catch(err => console.log(err));
    },

    // Get information about the chosen track name
    'spotify-this-song': function(song) {
      if (!song && !process.argv[3]) {
        song = 'All the Small Things';
      } else if (process.argv[3]) {
        song = process.argv[3];
      }
      sayPhrase(
        `Here are some tracks from spotify that match ${song}`,
        config.voice
      );
      spotify
        .search({ type: 'track', query: song, limit: 10 })
        .then(response => {
          const items = response.tracks.items;

          // Output response info to console
          handleOutput(
            Object.keys(items)
              .map(song => {
                return `Artists: ${items[song].artists.map(
                  artist => artist.name
                )}\nAlbum: ${items[song].album.name}\nTitle: ${
                  items[song].name
                }\nPreview URL: ${items[song].preview_url}\n\n`;
              })
              .join('')
          );

          // Open the first song in user's browser
          open(items[0].external_urls.spotify);
        })
        .catch(err => console.log(err));
    },

    // Get information about the chosen movie name
    'movie-this': function() {
      let movieName = process.argv[3];
      if (!movieName) {
        movieName = 'Mr Nobody';
      }
      sayPhrase(`Here is information about ${movieName}`, config.voice);
      request(
        `http://www.omdbapi.com/?t=${movieName}&y=&plot=short&apikey=trilogy`,
        function(err, response, body) {
          if (!err && response.statusCode === 200) {
            const movieData = JSON.parse(body);
            handleOutput(
              `Title: ${movieData.Title}\nYear Released: ${
                movieData.Year
              }\nIMDB Rating: ${
                movieData.imdbRating
              }\nRotten Tomatoes Rating: ${
                movieData.Ratings[1].Value
              }\nCountry: ${movieData.Country}\nLanguage: ${
                movieData.Language
              }\nPlot: ${movieData.Plot}\nActors: ${movieData.Actors}`
            );
          }
        }
      );
    },

    // Executes a command from the command file
    'do-what-it-says': function() {
      readCommandFile(function(err, content) {
        if (err) {
          console.log(err);
        } else {
          Monique[content[0]](content[1]);
        }
      });
    },

    // Makes the computer voice try to make techno
    'play-techno': function() {
      sayPhrase(
        'Oonce oonce oonce oonce, chicka chicka, oonce oonce, doodoo da doo doo, doodoo da doo doo, oonce oonce oonce oonce',
        config.voice
      );
    },

    // Tells a bad joke from the I Can Haz Dad Joke API
    'tell-me-a-joke': function() {
      const options = {
        url: 'https://icanhazdadjoke.com/',
        headers: {
          Accept: 'application/json'
        }
      };
      request(options, function(err, response, data) {
        if (err) {
          console.log('Error retrieving joke');
        } else if (!err && response.statusCode === 200) {
          const joke = JSON.parse(data).joke;
          console.log(joke);
          say.speak(joke, 'Victoria');
        }
      });
    }
  };
})();

const command = process.argv[2];
const run = function() {
  Monique.log(`${new Date()}: Running command '${process.argv[2]}'`);
  Monique[command]();
};
Monique.hasOwnProperty(command) ? run() : console.log('Invalid command');
