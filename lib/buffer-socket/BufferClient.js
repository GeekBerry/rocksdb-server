const assert = require('assert');
const EventEmitter = require('events');
const ws = require('ws');
const BufferStream = require('./BufferStream');
const { CODE, randomInt32 } = require('./util');

class BufferClient extends ws {
  constructor({ host, port } = {}) {
    super(`ws://${host}:${port}`);

    this.events = new EventEmitter();
    this.on('message', (...args) => this.onMessage(...args));
  }

  // ping
  // pong
  // terminate

  opened() {
    switch (this.readyState) {
      case ws.CONNECTING:
        return new Promise(resolve => this.once('open', resolve));
      case ws.OPEN:
        return undefined;
      case ws.CLOSING:
        throw new Error('socket is closing');
      case ws.CLOSED:
        throw new Error('socket is closed');
      default:
        break;
    }
    return undefined;
  }

  close(code, data) {
    switch (this.readyState) {
      case ws.CONNECTING:
        return this.opened().finally(() => this.close(code, data));
      case ws.OPEN:
        super.close(code, data);
        return new Promise(resolve => this.once('close', resolve));
      case ws.CLOSING:
        return new Promise(resolve => this.once('close', resolve));
      case ws.CLOSED:
        return undefined;
      default:
        break;
    }
    return undefined;
  }

  onMessage(buffer) {
    // console.log('->', buffer);
    const stream = new BufferStream(buffer);
    const requestId = stream.readInt();
    this.events.emit(requestId, stream);
  }

  async send(buffer) {
    await this.opened();
    // console.log('<-', buffer);
    return new Promise(resolve => super.send(buffer, resolve));
  }

  async request(buffer) {
    assert(Buffer.isBuffer(buffer), `param must be Buffer, got "${buffer}"`);

    const requestId = randomInt32();
    const promise = new Promise((resolve, reject) => {
      this.events.once(requestId, (input) => {
        const code = input.readInt();
        if (code === CODE.SUCCESS) {
          resolve(input);
        } else {
          reject(new Error(`${input.toBuffer()}`));
        }
      });
    });

    const output = new BufferStream();
    output.writeInt(requestId);
    output.write(buffer);
    await this.send(output.toBuffer());

    return promise;
  }
}

module.exports = BufferClient;
