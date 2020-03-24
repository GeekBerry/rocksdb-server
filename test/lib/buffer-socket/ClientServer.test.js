const { BufferServer, BufferClient } = require('../../../lib/buffer-socket');

let server;

beforeAll(() => {
  function reverseBuffer(input, output) {
    if (input.length) {
      output.write(input.toBuffer().reverse());
    } else {
      throw new Error('input is empty');
    }
  }

  server = new BufferServer({ host: '127.0.0.1', port: 6080 }, reverseBuffer);
});

test('request', async () => {
  const client = new BufferClient({ host: '127.0.0.1', port: 6080 });

  const stream = await client.request(Buffer.from('1234'));
  expect(stream.toBuffer().toString()).toEqual('4321');

  await expect(client.request(Buffer.from(''))).rejects.toThrow('input is empty');

  await client.close();
});

afterAll(() => {
  server.close();
});
