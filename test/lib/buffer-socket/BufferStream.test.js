const BufferStream = require('../../../lib/buffer-socket/BufferStream');

test('BufferStream', () => {
  const stream = new BufferStream();
  expect(stream.length).toEqual(0);

  stream.write(Buffer.from('abc'));
  expect(stream.length).toEqual(3);

  stream.write(Buffer.from('def'));
  expect(stream.length).toEqual(6);

  expect(stream.read(2)).toEqual(Buffer.from('ab'));
  expect(stream.length).toEqual(4);

  expect(stream.pick(2)).toEqual(Buffer.from('cd'));
  expect(stream.length).toEqual(4);

  expect(stream.read(-2)).toEqual(Buffer.from(''));
  expect(stream.length).toEqual(4);

  expect(stream.pick(-2)).toEqual(Buffer.from(''));
  expect(stream.length).toEqual(4);

  expect(stream.read(2)).toEqual(Buffer.from('cd'));
  expect(stream.length).toEqual(2);

  expect(stream.read(3)).toEqual(Buffer.from('ef'));
  expect(stream.length).toEqual(0);

  expect(stream.read(10)).toEqual(Buffer.from(''));
  expect(stream.length).toEqual(0);

  stream.write(Buffer.from('ghijk'));
  expect(stream.length).toEqual(5);

  expect(stream.toBuffer()).toEqual(Buffer.from('ghijk'));
});

test('Int', () => {
  const stream = new BufferStream();

  stream.writeInt(0x12345678);
  expect(stream.length).toEqual(4);
  expect(stream.toBuffer()).toEqual(Buffer.from([0x78, 0x56, 0x34, 0x12]));
  expect(stream.readInt()).toEqual(0x12345678);
  expect(stream.length).toEqual(0);

  expect(() => stream.writeInt(0x7fffffff + 1)).toThrow('out of range');

  stream.writeInt(-1);
  expect(stream.length).toEqual(4);
  expect(stream.toBuffer()).toEqual(Buffer.from([0xff, 0xff, 0xff, 0xff]));
  expect(stream.readInt()).toEqual(-1);
  expect(stream.length).toEqual(0);

  expect(() => stream.writeInt(-0x80000000 - 1)).toThrow('out of range');
});

test('Number', () => {
  const stream = new BufferStream();

  stream.writeNumber(Math.PI);
  expect(stream.length).toEqual(8);
  expect(stream.toBuffer()).toEqual(Buffer.from([0x18, 0x2d, 0x44, 0x54, 0xfb, 0x21, 0x09, 0x40]));

  expect(stream.readNumber()).toEqual(Math.PI);
  expect(stream.length).toEqual(0);

  expect(() => stream.writeNumber(Infinity)).toThrow('value must be finite');
});
