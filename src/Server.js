const assert = require('assert');
const { Server: BufferServer } = require('@geekberry/buffer-socket');
const { CODE } = require('./util');

class Server {
  /**
   * @param options {object}
   * @param options.database {object}
   * @param options.readOnly {boolean}
   * @param rest.host {string}
   * @param rest.port {number}
   */
  constructor({ database, readOnly, ...rest }) {
    assert(database, 'database must be instance of LevelDB'); // TODO LevelDB interface
    this.database = database;
    this.server = new BufferServer(rest, this.middleware.bind(this));

    this.CODE_TO_METHOD = {
      [CODE.SET]: readOnly ? this.onReadOnly.bind(this) : this.onSet.bind(this),
      [CODE.DEL]: readOnly ? this.onReadOnly.bind(this) : this.onDel.bind(this),
      [CODE.BATCH]: readOnly ? this.onReadOnly.bind(this) : this.onBatch.bind(this),
      [CODE.CLEAR]: readOnly ? this.onReadOnly.bind(this) : this.onClear.bind(this),

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

  // --------------------------------------------------------------------------
  onReadOnly() {
    throw new Error('server is read only');
  }

  // --------------------------------------------------------------------------
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
      switch (code) {
        case CODE.SET:
          array.push({ type: 'put', key: input.readBuffer(), value: input.readBuffer() });
          break;

        case CODE.DEL:
          array.push({ type: 'del', key: input.readBuffer() });
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
      output.writeBuffer(Buffer.from(value));
    }
  }

  async onList(input, output) {
    const filter = this._readFilter(input);
    const array = await this.database.list(filter);

    output.writeInt(array.length);
    array.forEach(({ key, value }) => {
      output.writeBuffer(Buffer.from(key));
      output.writeBuffer(Buffer.from(value));
    });
  }

  async onKeys(input, output) {
    const filter = this._readFilter(input);
    const keys = await this.database.keys(filter);

    output.writeInt(keys.length);
    keys.forEach(key => {
      output.writeBuffer(Buffer.from(key));
    });
  }

  async onValues(input, output) {
    const filter = this._readFilter(input);
    const values = await this.database.values(filter);

    output.writeInt(values.length);
    values.forEach(value => {
      output.writeBuffer(Buffer.from(value));
    });
  }

  // --------------------------------------------------------------------------
  async close() {
    await this.server.close();
    await this.database.close();
  }
}

module.exports = Server;
