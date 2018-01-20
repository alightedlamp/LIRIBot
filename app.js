const Monique = require('./monique.js');

const command = process.argv[2];
const run = function() {
  Monique.log(`${new Date()}: Running command '${process.argv[2]}'`);
  Monique[command]();
};
Monique.hasOwnProperty(command) ? run() : console.log('Invalid command');
