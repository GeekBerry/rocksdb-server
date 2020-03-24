const assert = require('assert');
const RocksDB = require('../lib/RocksDB');
const { BufferServer } = require('../lib/buffer-socket');
const { CODE } = require('./constant');

class Server {
  constructor(options) {
    this.database = new RocksDB(options);
    this.server = new BufferServer(options, this.middleware.bind(this));

    this.CODE_TO_METHOD = {
      [CODE.SET]: this.onSet.bind(this),
      [CODE.DEL]: this.onDel.bind(this),
      [CODE.BATCH]: this.onBatch.bind(this),
      [CODE.CLEAR]: this.onClear.bind(this),

      [CODE.GET]: this.onGet.bind(this),
      [CODE.LIST]: this.onList.bind(this),
      [CODE.KEYS]: this.onKeys.bind(this),
      [CODE.VALUES]: this.onValues.bind(this),
    };
  }

  _readFilter(stream) {
    return {
      reverse: stream.readInt(),
      limit: stream.readInt(),
      gt: stream.readBuffer(),
      gte: stream.readBuffer(),
      lte: stream.readBuffer(),
      lt: stream.readBuffer(),
    };
  }

  // ==========================================================================
  async middleware(input, output) {
    const code = input.readInt();

    const method = this.CODE_TO_METHOD[code];
    assert(method, `can not get method by code "${code}"`);

    await method(input, output);
  }

  async onSet(input) {
    const key = input.readBuffer();
    const value = input.readBuffer();

    await this.database.set(key, value);
  }

  async onDel(input) {
    const key = input.readBuffer();

    await this.database.del(key);
  }

  async onBatch(input) {
    const array = [];

    const length = input.readInt();
    for (let i = 0; i < length; i += 1) {
      const code = input.readInt();
      let key;
      let value;

      switch (code) {
        case CODE.SET:
          key = input.readBuffer();
          value = input.readBuffer();
          array.push({ type: 'put', key, value });
          break;

        case CODE.DEL:
          key = input.readBuffer();
          array.push({ type: 'del', key });
          break;

        default:
          throw new Error(`unexpected code="${code}"`);
      }
    }

    await this.database.batch(array);
  }

  async onClear(input) {
    const filter = this._readFilter(input);
    await this.database.clear(filter);
  }

  // --------------------------------------------------------------------------
  async onGet(input, output) {
    const key = input.readBuffer();

    const value = await this.database.get(key);
    if (value !== undefined) {
      output.writeBuffer(value);
    }
  }

  async onList(input, output) {
    const filter = this._readFilter(input);
    const array = await this.database.list(filter);

    output.writeInt(array.length);
    array.forEach(({ key, value }) => {
      output.writeBuffer(key);
      output.writeBuffer(value);
    });
  }

  async onKeys(input, output) {
    const filter = this._readFilter(input);
    const keys = await this.database.keys(filter);

    output.writeInt(keys.length);
    keys.forEach(key => {
      output.writeBuffer(key);
    });
  }

  async onValues(input, output) {
    const filter = this._readFilter(input);
    const values = await this.database.values(filter);

    output.writeInt(values.length);
    values.forEach(value => {
      output.writeBuffer(value);
    });
  }

  async close() {
    await this.server.close();
  }
}

module.exports = Server;
