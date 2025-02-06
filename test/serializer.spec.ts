import type { Serializer } from './../src'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import ByteBuffer from 'bytebuffer'
import { HexBuffer, Types } from './../src'

import serializerTests from './serializer.json'

function serialize(serializer: Serializer, data: any) {
  const buffer = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  serializer(buffer, data)
  buffer.flip()
  return bytesToHex(new Uint8Array(buffer.toArrayBuffer()))
}

describe('serializers', () => {
  for (const test of serializerTests) {
    it(test.name, () => {
      let serializer: Serializer
      if (!test.name.includes('::')) {
        serializer = Types[test.name as unknown as keyof typeof Types] as Serializer
      }
      else {
        const [base, ...sub] = test.name.split('::').map(t => Types[t as unknown as keyof typeof Types]) as [(...args: any[]) => Serializer, ...Serializer[]]
        serializer = base(...sub) as Serializer
      }
      for (const [expected, value] of test.values) {
        const actual = serialize(serializer, value)
        assert.equal(actual, expected)
      }
    })
  }

  it('binary', () => {
    const data = HexBuffer.from('026400c800')
    const r1 = serialize(Types.Binary(), HexBuffer.from([0x80, 0x00, 0x80]))
    assert.equal(r1, '03800080')
    const r2 = serialize(Types.Binary(), HexBuffer.from(hexToBytes('026400c800')))
    assert.equal(r2, '05026400c800')
    const r3 = serialize(Types.Binary(5), HexBuffer.from(data))
    assert.equal(r3, '026400c800')
    assert.throws(() => {
      serialize(Types.Binary(10), data)
    })
  })

  it('void', () => {
    assert.throws(() => {
      serialize(Types.Void, null)
    })
  })

  it('invalid Operations', () => {
    assert.throws(() => {
      serialize(Types.Operation, ['transfer', {}])
    })
    assert.throws(() => {
      serialize(Types.Operation, ['transfer', { from: 1 }])
    })
    assert.throws(() => {
      serialize(Types.Operation, ['transfer', 10])
    })
  })
})
