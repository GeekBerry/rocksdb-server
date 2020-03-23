const ws = require('ws');
const BufferStream = require('./BufferStream');
const { ERROR_ID } = require('./util');

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

    webSocket.on('message', async (inputBuffer) => {
      // console.log('->', inputBuffer);

      let outputBuffer;
      try {
        const inputStream = new BufferStream(inputBuffer);
        const requestId = inputStream.readInt();

        const outputStream = new BufferStream();
        outputStream.writeInt(requestId);

        await this.middleware(inputStream, outputStream);

        outputBuffer = outputStream.toBuffer();
      } catch (e) {
        const errorStream = new BufferStream();
        errorStream.writeInt(ERROR_ID);

        errorStream.writeBuffer(Buffer.from(e.message));

        outputBuffer = errorStream.toBuffer();
      }

      // console.log('<-', outputBuffer);
      await webSocket.send(outputBuffer);
    });
  }

  onError(error) {
    throw error;
  }
}

module.exports = BufferServer;
