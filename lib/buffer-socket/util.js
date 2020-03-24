const crypto = require('crypto');

function randomInt32() {
  return crypto.randomBytes(4).readInt32LE();
}

module.exports = {
  CODE: {
    SUCCESS: 0,
    ERROR: 1,
  },

  randomInt32,
};
