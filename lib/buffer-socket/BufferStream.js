const assert = require('assert');

class BufferStream {
  constructor(buffer) {
    this._array = [];
    this._col = 0;
    this._length = 0;

    if (buffer) {
      this.write(buffer);
    }
  }

  get length() {
    return this._length;
  }

  // ----------------------------------
  /**
   * @param buffer {Buffer}
   * @return {BufferStream}
   */
  write(buffer) {
    assert(Buffer.isBuffer(buffer), `value must be Buffer, got "${buffer}"`);

    this._array.push(buffer);
    this._length += buffer.length;
    return this;
  }

  writeInt(value) {
    assert(Number.isInteger(value), `value must be integer got "${value}"`);

    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(value, 0);
    return this.write(buffer);
  }

  writeNumber(value) {
    assert(Number.isFinite(value), `value must be finite got "${value}"`);

    const buffer = Buffer.alloc(8);
    buffer.writeDoubleLE(value, 0);
    return this.write(buffer);
  }

  writeBuffer(buffer) {
    assert(Buffer.isBuffer(buffer), `value must be Buffer, got "${buffer}"`);

    this.writeInt(buffer.length);
    return this.write(buffer);
  }

  // ----------------------------------
  _pick(size) {
    let row = 0;
    let col = this._col;

    const array = [];
    while (row < this._array.length && size > 0) {
      const line = this._array[row];

      const slice = col === 0 && size >= line.length ? line : line.slice(col, col + size);
      size -= slice.length;
      col += slice.length;

      if (col >= line.length) {
        row += 1;
        col = 0;
      }

      array.push(slice);
    }

    const buffer = Buffer.concat(array);
    return { buffer, row, col };
  }

  /**
   * @param size {int}
   * @return {Buffer}
   */
  pick(size) {
    assert(Number.isInteger(size), `size must be integer got "${size}"`);

    const { buffer } = this._pick(size);
    return buffer;
  }

  /**
   * @param size {int}
   * @return {Buffer}
   */
  read(size) {
    assert(Number.isInteger(size));

    const { row, col, buffer } = this._pick(size);
    this._array = this._array.slice(row); // pop this._array
    this._col = col;
    this._length -= buffer.length;

    return buffer;
  }

  _read(size) {
    let buffer = this.read(size);
    if (buffer.length < size) {
      buffer = Buffer.concat([buffer, Buffer.alloc(size - buffer.length)]);
    }
    return buffer;
  }

  readInt() {
    const buffer = this._read(4);
    return buffer.readInt32LE(0);
  }

  readNumber() {
    const buffer = this._read(8);
    return buffer.readDoubleLE(0);
  }

  readBuffer() {
    const size = this.readInt();
    return this.read(size);
  }

  // ----------------------------------
  toBuffer() {
    const array = [...this._array];
    if (this._col && array.length) {
      array[0] = array[0].slice(this._col);
    }
    return Buffer.concat(array);
  }
}

module.exports = BufferStream;
