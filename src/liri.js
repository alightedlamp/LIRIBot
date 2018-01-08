require('dotenv').config();

const fs = require('fs');
const request = require('request');
const keys = require('./config/keys');

const Spotify = require('node-spotify-api');
const Twitter = require('twitter');
const spotify = new Spotify(keys.spotify);
const client = new Twitter(keys.twitter);

const config = {
  logFile: './txt/log.txt',
  commandFile: './txt/command.txt',
  twitterUserId: '950063649590259712'
};

// Liri lives here. Public functions are exposed in the returned object literal
const Liri = (function() {
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
          'Error retrieving command file, "do-what-it-says" command will not function'
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
      output = output.replace(/[\n\r]+/g, '; ');
    }
    Liri.log(`${new Date()}: Response: ${output}`);
  };

  return {
    log: function(text) {
      logEvent(`${text}\n`);
    },
    'my-tweets': function() {
      client
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
    'spotify-this-song': function(song) {
      if (!song && !process.argv[3]) {
        song = 'All the Small Things';
      } else if (process.argv[3]) {
        song = process.argv[3];
      }
      spotify
        .search({ type: 'track', query: song, limit: 10 })
        .then(response => {
          const items = response.tracks.items;
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
        })
        .catch(err => console.log(err));
    },
    'movie-this': function() {
      let movieName = process.argv[3];
      if (!movieName) {
        movieName = 'Mr Nobody';
      }
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
    'do-what-it-says': function() {
      readCommandFile(function(err, content) {
        if (err) {
          console.log(err);
        } else {
          Liri[content[0]](content[1]);
        }
      });
    }
  };
})();

const command = process.argv[2];
const run = function() {
  Liri.log(`${new Date()}: Running command '${process.argv[2]}'`);
  Liri[command]();
};
Liri.hasOwnProperty(command) ? run() : 'Invalid command';
