const { DBServer, DBClient } = require('../src');
const { EMPTY_BUFFER } = require('../src/constant');

let server;
let client;

beforeAll(async () => {
  server = new DBServer({ host: '127.0.0.1', port: 6081, location: './testDBServerData' });
  client = new DBClient({ host: '127.0.0.1', port: 6081 });

  await server.database.clear();
});

test('set get del', async () => {
  let ret;

  ret = await client.get('key');
  expect(ret).toEqual(undefined);

  ret = await client.set('key', '');
  expect(ret).toEqual(undefined);

  ret = await client.get('key');
  expect(ret).toEqual(EMPTY_BUFFER);

  ret = await client.set('key', 'v1');
  expect(ret).toEqual(undefined);

  ret = await client.get('key');
  expect(ret).toEqual(Buffer.from('v1'));

  ret = await client.set(Buffer.from('key'), Buffer.from('v2'));
  expect(ret).toEqual(undefined);

  ret = await client.get('key');
  expect(ret).toEqual(Buffer.from('v2'));

  ret = await client.del('key');
  expect(ret).toEqual(undefined);

  ret = await client.get('key');
  expect(ret).toEqual(undefined);
});

test('batch list', async () => {
  let ret;

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
    { key: Buffer.from('key1'), value: Buffer.from('value1') },
    { key: Buffer.from('key3'), value: Buffer.from('value3') },
    { key: Buffer.from('key4'), value: Buffer.from('value4') },
    { key: Buffer.from('key5'), value: Buffer.from('value5') },
  ]);

  ret = await client.list({ reverse: true });
  expect(ret).toEqual([
    { key: Buffer.from('key5'), value: Buffer.from('value5') },
    { key: Buffer.from('key4'), value: Buffer.from('value4') },
    { key: Buffer.from('key3'), value: Buffer.from('value3') },
    { key: Buffer.from('key1'), value: Buffer.from('value1') },
  ]);

  ret = await client.list({ limit: 2 });
  expect(ret).toEqual([
    { key: Buffer.from('key1'), value: Buffer.from('value1') },
    { key: Buffer.from('key3'), value: Buffer.from('value3') },
  ]);

  ret = await client.list({ gte: Buffer.from('key1'), lte: Buffer.from('key4') });
  expect(ret).toEqual([
    { key: Buffer.from('key1'), value: Buffer.from('value1') },
    { key: Buffer.from('key3'), value: Buffer.from('value3') },
    { key: Buffer.from('key4'), value: Buffer.from('value4') },
  ]);

  ret = await client.list({ gt: Buffer.from('key1'), lt: Buffer.from('key4') });
  expect(ret).toEqual([
    { key: Buffer.from('key3'), value: Buffer.from('value3') },
  ]);

  ret = await client.clear({ gt: Buffer.from('key1'), lt: Buffer.from('key4') });
  expect(ret).toEqual(undefined);

  ret = await client.list();
  expect(ret).toEqual([
    { key: Buffer.from('key1'), value: Buffer.from('value1') },
    { key: Buffer.from('key4'), value: Buffer.from('value4') },
    { key: Buffer.from('key5'), value: Buffer.from('value5') },
  ]);

  expect(await client.keys()).toEqual([Buffer.from('key1'), Buffer.from('key4'), Buffer.from('key5')]);
  expect(await client.values()).toEqual([Buffer.from('value1'), Buffer.from('value4'), Buffer.from('value5')]);
});

afterAll(async () => {
  await server.close();
  // await client.close(); once server close, all client should be close

  await server.database.destroy();
});
