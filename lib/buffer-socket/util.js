const crypto = require('crypto');

const ERROR_ID = 0;

function randomId() {
  let id = ERROR_ID;
  while (id === ERROR_ID) {
    id = crypto.randomBytes(4).readInt32LE();
  }
  return id;
}

module.exports = {
  ERROR_ID,
  randomId,
};
