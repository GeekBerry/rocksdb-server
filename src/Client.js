const { Client: BufferClient, Stream } = require('@geekberry/buffer-socket');
const { CODE, EMPTY_BUFFER } = require('./util');

class Client {
  /**
   * @param options {object}
   * @param [options.asBuffer=true] {boolean}
   * @param rest.host {string}
   * @param rest.port {number}
   */
  constructor({ asBuffer = true, ...rest }) {
    this.client = new BufferClient(rest);

    this.asBuffer = asBuffer;
  }

  _writeFilter(code, {
    reverse,
    limit = -1,
    gt = EMPTY_BUFFER,
    gte = EMPTY_BUFFER,
    lte = EMPTY_BUFFER,
    lt = EMPTY_BUFFER,
  } = {}) {
    const stream = new Stream();

    stream.writeInt(code);
    stream.writeInt(reverse ? 1 : 0);
    stream.writeInt(limit);
    stream.writeBuffer(Buffer.from(gt));
    stream.writeBuffer(Buffer.from(gte));
    stream.writeBuffer(Buffer.from(lte));
    stream.writeBuffer(Buffer.from(lt));

    return stream;
  }

  // --------------------------------------------------------------------------
  async set(key, value) {
    const input = new Stream();
    input.writeInt(CODE.SET);
    input.writeBuffer(Buffer.from(key));
    input.writeBuffer(Buffer.from(value));

    await this.client.request(input);
  }

  async del(key) {
    const input = new Stream();
    input.writeInt(CODE.DEL);
    input.writeBuffer(Buffer.from(key));

    await this.client.request(input);
  }

  async batch(array) {
    const input = new Stream();
    input.writeInt(CODE.BATCH);
    input.writeInt(array.length);

    array.forEach(({ type, key, value }) => {
      switch (type) {
        case 'put':
          input.writeInt(CODE.SET);
          input.writeBuffer(Buffer.from(key));
          input.writeBuffer(Buffer.from(value));
          break;

        case 'del':
          input.writeInt(CODE.DEL);
          input.writeBuffer(Buffer.from(key));
          break;

        default:
          throw new Error(`unexpected type="${type}"`);
      }
    });

    await this.client.request(input);
  }

  async clear(filter) {
    const input = this._writeFilter(CODE.CLEAR, filter);
    await this.client.request(input);
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const input = new Stream();
    input.writeInt(CODE.GET);
    input.writeBuffer(Buffer.from(key));

    const output = await this.client.request(input);

    let value = output.length ? output.readBuffer() : undefined;
    if (!this.asBuffer) {
      value = (value === undefined) ? undefined : value.toString();
    }

    return value;
  }

  async list(filter) {
    const input = this._writeFilter(CODE.LIST, filter);

    const output = await this.client.request(input);

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      let key = output.readBuffer();
      let value = output.readBuffer();
      if (!this.asBuffer) {
        key = key.toString();
        value = value.toString();
      }

      array.push({ key, value });
    }
    return array;
  }

  async keys(filter) {
    const input = this._writeFilter(CODE.KEYS, filter);

    const output = await this.client.request(input);

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      let key = output.readBuffer();
      if (!this.asBuffer) {
        key = key.toString();
      }

      array.push(key);
    }
    return array;
  }

  async values(filter) {
    const input = this._writeFilter(CODE.VALUES, filter);

    const output = await this.client.request(input);

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      let value = output.readBuffer();
      if (!this.asBuffer) {
        value = value.toString();
      }

      array.push(value);
    }
    return array;
  }

  // --------------------------------------------------------------------------
  async close() {
    await this.client.close();
  }
}

module.exports = Client;
