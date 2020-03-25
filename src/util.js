module.exports = {
  EMPTY_BUFFER: Buffer.alloc(0),

  // in order to check operate correct, hash code by string.
  CODE: {
    SET: Buffer.from('SET ').readInt32LE(),
    DEL: Buffer.from('DELE').readInt32LE(),
    BATCH: Buffer.from('BATC').readInt32LE(),
    CLEAR: Buffer.from('CLEA').readInt32LE(),

    GET: Buffer.from('GET ').readInt32LE(),
    LIST: Buffer.from('LIST').readInt32LE(),
    KEYS: Buffer.from('KEYS').readInt32LE(),
    VALUES: Buffer.from('VALU').readInt32LE(),
  },
};
