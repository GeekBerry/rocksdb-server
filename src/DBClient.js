const { BufferClient, BufferStream } = require('../lib/buffer-socket');
const { CODE, EMPTY_BUFFER } = require('./constant');

class DBClient {
  constructor(options) {
    this.client = new BufferClient(options);
  }

  _writeFilter(code, {
    reverse,
    limit = -1,
    gt = EMPTY_BUFFER,
    gte = EMPTY_BUFFER,
    lte = EMPTY_BUFFER,
    lt = EMPTY_BUFFER,
  } = {}) {
    const stream = new BufferStream();

    stream.writeInt(code);
    stream.writeInt(reverse ? 1 : 0);
    stream.writeInt(limit);
    stream.writeBuffer(gt);
    stream.writeBuffer(gte);
    stream.writeBuffer(lte);
    stream.writeBuffer(lt);

    return stream;
  }

  // --------------------------------------------------------------------------
  async set(key, value) {
    const input = new BufferStream();
    input.writeInt(CODE.SET);
    input.writeBuffer(Buffer.from(key));
    input.writeBuffer(Buffer.from(value));

    await this.client.request(input.toBuffer());
  }

  async del(key) {
    const input = new BufferStream();
    input.writeInt(CODE.DEL);
    input.writeBuffer(Buffer.from(key));

    await this.client.request(input.toBuffer());
  }

  async batch(array) {
    const input = new BufferStream();
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

    await this.client.request(input.toBuffer());
  }

  async clear(filter) {
    const input = this._writeFilter(CODE.CLEAR, filter);
    await this.client.request(input.toBuffer());
  }

  // --------------------------------------------------------------------------
  async get(key) {
    const input = new BufferStream();
    input.writeInt(CODE.GET);
    input.writeBuffer(Buffer.from(key));

    const output = await this.client.request(input.toBuffer());
    return output.length ? output.readBuffer() : undefined;
  }

  async list(filter) {
    const input = this._writeFilter(CODE.LIST, filter);

    const output = await this.client.request(input.toBuffer());

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      const key = output.readBuffer();
      const value = output.readBuffer();
      array.push({ key, value });
    }
    return array;
  }

  async keys(filter) {
    const input = this._writeFilter(CODE.KEYS, filter);

    const output = await this.client.request(input.toBuffer());

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      array.push(output.readBuffer());
    }
    return array;
  }

  async values(filter) {
    const input = this._writeFilter(CODE.VALUES, filter);

    const output = await this.client.request(input.toBuffer());

    const length = output.readInt();
    const array = [];
    for (let i = 0; i < length; i += 1) {
      array.push(output.readBuffer());
    }
    return array;
  }

  // --------------------------------------------------------------------------
  async close() {
    await this.client.close();
  }
}

module.exports = DBClient;
