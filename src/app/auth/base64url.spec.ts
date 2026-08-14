import { fromBase64Url, toBase64Url } from './base64url';

/**
 * The one file in this application where a wrong answer is silent. A mangled challenge does not
 * throw — the authenticator signs the wrong bytes and the server refuses, which on screen is
 * indistinguishable from a wrong password. So both directions are asserted, and both paddings.
 */
describe('base64url', () => {
  /** Readable fixtures: bytes in, bytes out, compared as arrays. */
  function bytes(...values: number[]): ArrayBuffer {
    return new Uint8Array(values).buffer;
  }

  function read(buffer: ArrayBuffer): number[] {
    return Array.from(new Uint8Array(buffer));
  }

  it('encodes with the url alphabet and no padding', () => {
    // 0xfb 0xff is "+/8=" in the standard alphabet — the two characters that differ, plus a pad.
    expect(toBase64Url(bytes(0xfb, 0xff))).toBe('-_8');
  });

  it('drops padding for every input length', () => {
    expect(toBase64Url(bytes(1))).toBe('AQ');
    expect(toBase64Url(bytes(1, 2))).toBe('AQI');
    expect(toBase64Url(bytes(1, 2, 3))).toBe('AQID');
  });

  it('takes a Uint8Array as readily as an ArrayBuffer', () => {
    expect(toBase64Url(new Uint8Array([1, 2, 3]))).toBe('AQID');
  });

  it('decodes the unpadded form the server sends', () => {
    expect(read(fromBase64Url('AQ'))).toEqual([1]);
    expect(read(fromBase64Url('AQI'))).toEqual([1, 2]);
  });

  it('decodes the padded form a hand-written fixture uses', () => {
    expect(read(fromBase64Url('AQ=='))).toEqual([1]);
    expect(read(fromBase64Url('AQI='))).toEqual([1, 2]);
  });

  it('decodes the standard alphabet too, so a pasted base64 value is not mangled', () => {
    expect(read(fromBase64Url('+/8='))).toEqual([0xfb, 0xff]);
    expect(read(fromBase64Url('-_8'))).toEqual([0xfb, 0xff]);
  });

  it('round trips every byte value', () => {
    const all = new Uint8Array(256);
    for (let value = 0; value < 256; value += 1) all[value] = value;
    expect(read(fromBase64Url(toBase64Url(all)))).toEqual(Array.from(all));
  });

  it('survives emptiness in both directions', () => {
    expect(toBase64Url(new ArrayBuffer(0))).toBe('');
    expect(read(fromBase64Url(''))).toEqual([]);
  });
});
