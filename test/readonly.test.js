const LevelDB = require('@geekberry/leveldb');
const { Server, Client } = require('../src');

let server;
let client;

beforeAll(async () => {
  const database = new LevelDB({ location: './DB_LEVEL_READ_ONLY' });
  await database.set('key', 'value');

  server = new Server({ host: '127.0.0.1', port: 6083, database, readOnly: true });
  client = new Client({ host: '127.0.0.1', port: 6083, asBuffer: false });
});

test('readOnly', async () => {
  expect(await client.get('key')).toEqual('value');

  await expect(client.set('key', 'new')).rejects.toThrow('read only');
  expect(await client.get('key')).toEqual('value');

  await expect(client.del('key')).rejects.toThrow('read only');
  expect(await client.get('key')).toEqual('value');

  await expect(client.clear()).rejects.toThrow('read only');
  expect(await client.get('key')).toEqual('value');

  await expect(client.batch([{ type: 'put', key: 'key', value: 'new' }])).rejects.toThrow('read only');
  expect(await client.get('key')).toEqual('value');
});

afterAll(async () => {
  await server.close();
  // await client.close(); once server close, all client should be close

  // await server.database.destroy();
});
