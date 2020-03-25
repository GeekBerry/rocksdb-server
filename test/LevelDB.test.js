const LevelDB = require('@geekberry/leveldb');
const { Server, Client } = require('../src');

let server;
let client;

beforeAll(async () => {
  const database = new LevelDB({ location: './DB_LEVEL' });

  server = new Server({ host: '127.0.0.1', port: 6081, database });
  client = new Client({ host: '127.0.0.1', port: 6081, asBuffer: false });

  await server.database.clear();
});

test('set get del', async () => {
  expect(await client.get('key')).toEqual(undefined);

  expect(await client.set('key', 'value')).toEqual(undefined);

  expect(await client.get('key')).toEqual('value');

  expect(await client.del('key')).toEqual(undefined);

  expect(await client.get('key')).toEqual(undefined);
});

test('batch list', async () => {
  let ret;

  ret = await client.list();
  expect(ret).toEqual([]);

  ret = await client.batch([
    { type: 'put', key: Buffer.from('key1'), value: Buffer.from('value1') },
    { type: 'put', key: 'key2', value: 'value2' },
    { type: 'put', key: 'key3', value: 'value3' },
    { type: 'del', key: Buffer.from('key2') },
    { type: 'put', key: 'key4', value: 'value4' },
    { type: 'put', key: 'key5', value: 'value5' },
  ]);
  expect(ret).toEqual(undefined);

  ret = await client.list();
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
    { key: 'key4', value: 'value4' },
    { key: 'key5', value: 'value5' },
  ]);

  ret = await client.list({ reverse: true });
  expect(ret).toEqual([
    { key: 'key5', value: 'value5' },
    { key: 'key4', value: 'value4' },
    { key: 'key3', value: 'value3' },
    { key: 'key1', value: 'value1' },
  ]);

  ret = await client.list({ limit: 2 });
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
  ]);

  ret = await client.list({ gte: 'key1', lte: 'key4' });
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
    { key: 'key4', value: 'value4' },
  ]);

  ret = await client.list({ gt: 'key1', lt: 'key4' });
  expect(ret).toEqual([
    { key: 'key3', value: 'value3' },
  ]);

  ret = await client.clear({ gt: 'key1', lt: 'key4' });
  expect(ret).toEqual(undefined);

  ret = await client.list();
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key4', value: 'value4' },
    { key: 'key5', value: 'value5' },
  ]);

  expect(await client.keys()).toEqual(['key1', 'key4', 'key5']);
  expect(await client.values()).toEqual(['value1', 'value4', 'value5']);
});

test('all', async () => {
  await Promise.all([
    client.set('A', 'apple'),
    client.set('B', 'boy'),
    client.set('C', 'cat'),
    client.set('D', 'dog'),
    client.set('E', 'empty'),
  ]);

  const values = await Promise.all([
    client.get('A'),
    client.get('B'),
    client.get('C'),
    client.get('D'),
    client.get('E'),
  ]);

  expect(values).toEqual(['apple', 'boy', 'cat', 'dog', 'empty']);
});

afterAll(async () => {
  await server.close();
  // await client.close(); once server close, all client should be close

  // await server.database.destroy();
});
