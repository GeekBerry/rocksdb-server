# RocksDB Server

Rocksdb server and client base on websocket.

## Usage

* Server

```javascript
const server = new Server({ host: '127.0.0.1', port: 2222, location: './data' });
```

* Client

```javascript
async function main() {
  const client = new Client({ host: '127.0.0.1', port: 2222 });

  const value  = await client.get('key');
  console.log(value);
  
  await client.set('key', 'value');
  
  await client.del('key');
  
  await client.batch([
    { type: 'put', key: Buffer.from('key1'), value: Buffer.from('value1') },
    { type: 'put', key: 'key2', value: 'value2' },
    { type: 'put', key: 'key3', value: 'value3' },
    { type: 'del', key: Buffer.from('key2') },
    { type: 'put', key: 'key4', value: 'value4' },
    { type: 'put', key: 'key5', value: 'value5' },
  ]);
  
  const list = await client.list({ limit: 2, reverse: true, gte: 'key1', lt: 'key4' });
  console.log(list);

  const keys = await client.keys({ limit: 2 });
  console.log(keys);
  
  const values = await client.values({ limit: 2 });
  console.log(values);

  await client.clear({ gt: 'key1', lt: 'key4' });

  await client.close();
}
```

# Test

`jest`
