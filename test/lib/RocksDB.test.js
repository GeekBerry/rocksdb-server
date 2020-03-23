const RocksDB = require('../../lib/RocksDB');

const rocksDB = new RocksDB({
  location: './testRocksDBData',
  asBuffer: false,
});

// ----------------------------------------------------------------------------
beforeAll(async () => {
  await rocksDB.clear();
});

test('set get del', async () => {
  expect(await rocksDB.get('key')).toEqual(undefined);

  expect(await rocksDB.set('key', 'value')).toEqual(undefined);

  expect(await rocksDB.get('key')).toEqual('value');

  expect(await rocksDB.del('key')).toEqual(undefined);

  expect(await rocksDB.get('key')).toEqual(undefined);
});

test('batch list', async () => {
  let ret;

  ret = await rocksDB.batch([
    { type: 'put', key: Buffer.from('key1'), value: Buffer.from('value1') },
    { type: 'put', key: 'key2', value: 'value2' },
    { type: 'put', key: 'key3', value: 'value3' },
    { type: 'del', key: Buffer.from('key2') },
    { type: 'put', key: 'key4', value: 'value4' },
    { type: 'put', key: 'key5', value: 'value5' },
  ]);
  expect(ret).toEqual(undefined);

  ret = await rocksDB.list();
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
    { key: 'key4', value: 'value4' },
    { key: 'key5', value: 'value5' },
  ]);

  ret = await rocksDB.list({ reverse: true });
  expect(ret).toEqual([
    { key: 'key5', value: 'value5' },
    { key: 'key4', value: 'value4' },
    { key: 'key3', value: 'value3' },
    { key: 'key1', value: 'value1' },
  ]);

  ret = await rocksDB.list({ limit: 2 });
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
  ]);

  ret = await rocksDB.list({ gte: 'key1', lte: 'key4' });
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key3', value: 'value3' },
    { key: 'key4', value: 'value4' },
  ]);

  ret = await rocksDB.list({ gt: 'key1', lt: 'key4' });
  expect(ret).toEqual([
    { key: 'key3', value: 'value3' },
  ]);

  ret = await rocksDB.clear({ gt: 'key1', lt: 'key4' });
  expect(ret).toEqual(undefined);

  ret = await rocksDB.list();
  expect(ret).toEqual([
    { key: 'key1', value: 'value1' },
    { key: 'key4', value: 'value4' },
    { key: 'key5', value: 'value5' },
  ]);

  expect(await rocksDB.keys()).toEqual(['key1', 'key4', 'key5']);
  expect(await rocksDB.values()).toEqual(['value1', 'value4', 'value5']);
});

afterAll(async () => {
  await rocksDB.destroy();
});
