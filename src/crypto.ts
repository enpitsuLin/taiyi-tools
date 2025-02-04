import assert from 'assert'
import bs58 from 'bs58'
import * as secp from '@noble/secp256k1'

import { sha256 as nobleSha256 } from '@noble/hashes/sha2'
import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160'
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils'
import type { Transaction, SignedTransaction } from './transaction'
import ByteBuffer from 'bytebuffer'
import { Types } from './taiyi/serializer'
import { DEFAULT_ADDRESS_PREFIX, DEFAULT_CHAIN_ID } from './client'
import { hmac } from '@noble/hashes/hmac'

secp.etc.hmacSha256Sync = (k, ...m) => hmac(nobleSha256, k, secp.etc.concatBytes(...m));


export const NETWORK_ID = new Uint8Array([0x80])

export function sha256(input: Uint8Array | string): Uint8Array {
  return nobleSha256(input)
}

export function ripemd160(input: Uint8Array | string): Uint8Array {
  return nobleRipemd160(input)
}

export function doubleSha256(input: Uint8Array | string): Uint8Array {
  return sha256(sha256(input))
}

export function encodePublic(key: Uint8Array | string, prefix: string): string {
  const msg = typeof key === 'string' ? new TextEncoder().encode(key) : key
  const checksum = ripemd160(msg)

  const combined = concatBytes(msg, checksum.slice(0, 4))
  return prefix + bs58.encode(combined)
}

export function decodePublic(encodedKey: string): { key: Uint8Array, prefix: string } {
  const prefix = encodedKey.slice(0, 3)
  assert.strictEqual(prefix.length, 3, 'public key invalid prefix')
  encodedKey = encodedKey.slice(3)
  const buffer = bs58.decode(encodedKey)
  const checksum = buffer.slice(-4)
  const key = buffer.slice(0, -4)
  const checksumVerify = ripemd160(key).slice(0, 4)
  assert.deepStrictEqual(checksumVerify, checksum, 'public key checksum mismatch')
  return { key, prefix }
}

export function encodePrivate(key: Uint8Array | string): string {
  const msg = typeof key === 'string' ? new TextEncoder().encode(key) : key
  assert.strictEqual(msg.at(0), 0x80, 'private key network id mismatch')
  const checksum = doubleSha256(msg)

  const combined = concatBytes(msg, checksum.slice(0, 4))
  return bs58.encode(combined)
}

export function decodePrivate(encodedKey: string): Uint8Array {
  const buffer = bs58.decode(encodedKey)
  assert.deepStrictEqual(buffer.slice(0, 1), NETWORK_ID, 'private key network id mismatch')
  const checksum = buffer.slice(-4)
  const key = buffer.slice(0, -4)
  const checksumVerify = doubleSha256(key).slice(0, 4)
  assert.deepStrictEqual(checksumVerify, checksum, 'private key checksum mismatch')
  return key
}

function isCanonicalSignature(signature: Uint8Array): boolean {
  return (
    !(signature[0] & 0x80) &&
    !(signature[0] === 0 && !(signature[1] & 0x80)) &&
    !(signature[32] & 0x80) &&
    !(signature[32] === 0 && !(signature[33] & 0x80))
  )
}



export class PublicKey {
  public static fromString(wif: string): PublicKey {
    const { key, prefix } = decodePublic(wif)
    return new PublicKey(key, prefix)
  }

  public static from(value: string | PublicKey) {
    if (value instanceof PublicKey) {
      return value
    } else {
      return PublicKey.fromString(value)
    }
  }

  constructor(
    public readonly key: Uint8Array,
    public readonly prefix: string = DEFAULT_ADDRESS_PREFIX
  ) {
    assert(
      secp.ProjectivePoint.fromHex(key).assertValidity(),
      'invalid public key'
    )
  }

  public verify(message: Uint8Array, signature: Signature): boolean {
    return secp.verify(signature.data, message, this.key)
  }

  public toString() {
    return encodePublic(this.key, this.prefix)
  }

  public toJSON() {
    return this.toString()
  }

  public [Symbol.for('nodejs.util.inspect.custom')]() {
    return `PublicKey <${this.toString()}>`;
  }
}

export type KeyRole = 'owner' | 'active' | 'posting' | 'memo'

export class PrivateKey {
  public static from(value: string | Uint8Array) {
    if (typeof value === 'string') {
      return PrivateKey.fromString(value)
    } else {
      return new PrivateKey(value)
    }
  }

  public static fromString(wif: string) {
    return new PrivateKey(decodePrivate(wif).slice(1))
  }

  public static fromSeed(seed: string) {
    return new PrivateKey(sha256(seed))
  }

  public static fromLogin(username: string, password: string, role: KeyRole = 'active') {
    const seed = username + role + password
    return PrivateKey.fromSeed(seed)
  }

  constructor(private key: Uint8Array) {
    assert(secp.utils.isValidPrivateKey(key), 'invalid private key')
  }

  public sign(message: Uint8Array): Signature {
    let signature: secp.SignatureWithRecovery
    let attempts = 0
    do {
      const data = concatBytes(message, new Uint8Array([attempts++]))

      const options = { extraEntropy: sha256(data) }

      signature = secp.sign(message, this.key, options)
    } while (!isCanonicalSignature(signature.toCompactRawBytes()))
    return new Signature(signature.toCompactRawBytes(), signature.recovery)
  }

  /**
   * Derive the public key for this private key.
   */
  public createPublic(prefix?: string, isCompressed: boolean = true): PublicKey {
    return new PublicKey(secp.getPublicKey(this.key, isCompressed), prefix)
  }

  /**
   * Return a WIF-encoded representation of the key.
   */
  public toString() {
    const combined = concatBytes(NETWORK_ID, this.key)
    return encodePrivate(combined)
  }

  /**
   * Used by `utils.inspect` and `console.log` in node.js. Does not show the full key
   * to get the full encoded key you need to explicitly call {@link toString}.
   */
  public [Symbol.for('nodejs.util.inspect.custom')]() {
    const key = this.toString()
    return `PrivateKey: ${key.slice(0, 6)}...${key.slice(-6)}`
  }
}

function transactionDigest(
  transaction: Transaction | SignedTransaction,
  chainId: Uint8Array
) {
  const buffer = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  try {
    Types.Transaction(buffer, transaction)
  } catch (cause) {
    const e = new Error('Unable to serialize transaction', { cause })
    e.name = 'SerializationError'
    throw e
  }
  buffer.flip()

  const digest = sha256(concatBytes(chainId, new Uint8Array(buffer.toArrayBuffer())))
  return digest
}

function signTransaction(
  transaction: Transaction,
  keys: PrivateKey | PrivateKey[],
  chainId: Uint8Array = DEFAULT_CHAIN_ID
) {
  const digest = transactionDigest(transaction, chainId)
  const signedTransaction = structuredClone(transaction) as SignedTransaction
  if (!signedTransaction.signatures) {
    signedTransaction.signatures = []
  }

  if (!Array.isArray(keys)) { keys = [keys] }
  for (const key of keys) {
    const signature = key.sign(digest)
    signedTransaction.signatures.push(signature.toString())
  }

  return signedTransaction
}

export class Signature {
  public static fromU8(array: Uint8Array) {
    assert.strictEqual(array.length, 65, 'invalid signature')
    const recovery = array.at(0)! - 31
    const data = array.slice(1)
    return new Signature(data, recovery)
  }

  public static fromString(string: string) {
    return Signature.fromU8(hexToBytes(string))
  }

  constructor(public data: Uint8Array, public recovery: number) {
    assert.equal(data.length, 64, 'invalid signature')
  }

  public recover(message: Uint8Array, prefix?: string) {
    const sig = secp.Signature.fromCompact(this.data).addRecoveryBit(this.recovery)
    return new PublicKey(sig.recoverPublicKey(message).toRawBytes(), prefix)
  }

  public toBuffer() {
    return concatBytes(new Uint8Array([this.recovery + 31]), this.data)
  }

  public toString() {
    return bytesToHex(this.toBuffer())
  }
}

export const cryptoUtils = {
  decodePrivate,
  doubleSha256,
  encodePrivate,
  encodePublic,
  isCanonicalSignature,
  ripemd160,
  sha256,
  signTransaction,
  transactionDigest,
}
