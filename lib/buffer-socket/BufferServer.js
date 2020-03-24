const ws = require('ws');
const BufferStream = require('./BufferStream');
const { REQUEST_ID_LENGTH, CODE } = require('./util');

/*
- Package structure:

request:
|    4 bytes    |  N bytes ...
    requestId         data

response:
|    4 bytes    |    4 bytes    |    N bytes ...
    requestId      CODE.SUCCESS       data

error:
|    4 bytes    |    4 bytes    |    N bytes ...
    requestId       CODE.ERROR     error message
 */

class BufferServer extends ws.Server {
  constructor(options, middleware) {
    super(options);

    this.on('connection', (...args) => this.onConnection(...args));
    this.on('error', (...args) => this.onError(...args));
    this.middleware = middleware;
  }

  onConnection(webSocket) {
    // webSocket.on('ping', () => {
    //   console.log('ping');
    // });
    //
    // webSocket.on('pong', () => {
    //   console.log('pong');
    // });
    //
    // webSocket.on('close', () => {
    //   console.log('close');
    // });

    webSocket.on('message', async (input) => {
      // console.log('->', input);
      const output = await this.onSocketMessage(input);
      // console.log('<-', output);
      await webSocket.send(output);
    });
  }

  onError(error) {
    throw error;
  }

  async onSocketMessage(buffer) {
    const inputStream = new BufferStream(buffer);
    const requestId = inputStream.read(REQUEST_ID_LENGTH);

    const outputStream = new BufferStream();
    outputStream.write(requestId);
    outputStream.writeInt(CODE.SUCCESS);

    const errorStream = new BufferStream();
    errorStream.write(requestId);
    errorStream.writeInt(CODE.ERROR);

    try {
      await this.middleware(inputStream, outputStream);
      return outputStream.toBuffer();
    } catch (e) {
      errorStream.write(Buffer.from(e.message));
      return errorStream.toBuffer();
    }
  }
}

module.exports = BufferServer;
