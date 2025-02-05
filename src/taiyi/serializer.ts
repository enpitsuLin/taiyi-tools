/**
 * @file Steem protocol serialization.
 * @author Johan Nordberg <code@johan-nordberg.com>
 * @license
 * Copyright (c) 2017 Johan Nordberg. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *  1. Redistribution of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *
 *  2. Redistribution in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder nor the names of its contributors
 *     may be used to endorse or promote products derived from this software without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * You acknowledge that this software is not designed, licensed or intended for use
 * in the design, construction, operation or maintenance of any military facility.
 */
import * as ByteBuffer from 'bytebuffer'
import { PublicKey } from '../crypto'
import { Asset } from './asset'
import { HexBuffer } from './misc'
import type { Operation } from '../operation'

export type Serializer = (buffer: ByteBuffer, data: any) => void

const VoidSerializer = (_buffer: ByteBuffer) => {
  throw new Error('Void can not be serialized')
}

const StringSerializer = (buffer: ByteBuffer, data: string) => {
  buffer.writeVString(data)
}

const Int8Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeInt8(data)
}

const Int16Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeInt16(data)
}

const Int32Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeInt32(data)
}

const Int64Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeInt64(data)
}

const UInt8Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeUint8(data)
}

const UInt16Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeUint16(data)
}

const UInt32Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeUint32(data)
}

const UInt64Serializer = (buffer: ByteBuffer, data: number) => {
  buffer.writeUint64(data)
}

const BooleanSerializer = (buffer: ByteBuffer, data: boolean) => {
  buffer.writeByte(data ? 1 : 0)
}

const StaticVariantSerializer = (itemSerializers: Serializer[]) => {
  return (buffer: ByteBuffer, data: [number, any]) => {
    const [id, item] = data
    buffer.writeVarint32(id)
    itemSerializers[id](buffer, item)
  }
}

/**
 * Serialize asset.
 * @note This looses precision for amounts larger than 2^53-1/10^precision.
 *       Should not be a problem in real-word usage.
 */
const AssetSerializer = (buffer: ByteBuffer, data: Asset | string | number) => {
  const asset = Asset.from(data)
  const precision = asset.getPrecision()
  buffer.writeInt64(Math.round(asset.amount * Math.pow(10, precision)))
  buffer.writeUint8(precision)
  for (let i = 0; i < 7; i++) {
    buffer.writeUint8(asset.symbol.charCodeAt(i) || 0)
  }
}

const DateSerializer = (buffer: ByteBuffer, data: string) => {
  buffer.writeUint32(Math.floor(new Date(data + 'Z').getTime() / 1000))
}

const PublicKeySerializer = (buffer: ByteBuffer, data: PublicKey | string | null) => {
  if (data === null || (typeof data === 'string' && data.slice(-39) === '1111111111111111111111111111111114T1Anm')) {
    buffer.append(Buffer.alloc(33, 0))
  } else {
    buffer.append(PublicKey.from(data).key)
  }
}

const BinarySerializer = (size?: number) => {
  return (buffer: ByteBuffer, data: Buffer | HexBuffer) => {
    data = HexBuffer.from(data)
    const len = data.buffer.length
    if (size) {
      if (len !== size) {
        throw new Error(`Unable to serialize binary. Expected ${size} bytes, got ${len}`)
      }
    } else {
      buffer.writeVarint32(len)
    }
    buffer.append(data.buffer)
  }
}

const VariableBinarySerializer = BinarySerializer()

const FlatMapSerializer = (keySerializer: Serializer, valueSerializer: Serializer) => {
  return (buffer: ByteBuffer, data: Array<[any, any]>) => {
    buffer.writeVarint32(data.length)
    for (const [key, value] of data) {
      keySerializer(buffer, key)
      valueSerializer(buffer, value)
    }
  }
}

const ArraySerializer = (itemSerializer: Serializer) => {
  return (buffer: ByteBuffer, data: any[]) => {
    buffer.writeVarint32(data.length)
    for (const item of data) {
      itemSerializer(buffer, item)
    }
  }
}

const ObjectSerializer = (keySerializers: Array<[string, Serializer]>) => {
  return (buffer: ByteBuffer, data: { [key: string]: any }) => {
    for (const [key, serializer] of keySerializers) {
      try {
        serializer(buffer, data[key])
      } catch (error: any) {
        error.message = `${key}: ${error.message}`
        throw error
      }
    }
  }
}

const OptionalSerializer = (valueSerializer: Serializer) => {
  return (buffer: ByteBuffer, data: any) => {
    if (data != undefined) {
      buffer.writeByte(1)
      valueSerializer(buffer, data)
    } else {
      buffer.writeByte(0)
    }
  }
}

const AuthoritySerializer = ObjectSerializer([
  ['weight_threshold', UInt32Serializer],
  ['account_auths', FlatMapSerializer(StringSerializer, UInt16Serializer)],
  ['key_auths', FlatMapSerializer(PublicKeySerializer, UInt16Serializer)],
])

const PriceSerializer = ObjectSerializer([
  ['base', AssetSerializer],
  ['quote', AssetSerializer],
])

const ChainPropertiesSerializer = ObjectSerializer([
  ['account_creation_fee', AssetSerializer],
  ['maximum_block_size', UInt32Serializer],
  ['sbd_interest_rate', UInt16Serializer],
])

type DefinitionsToParams<Definitions extends Array<[string, Serializer]>> = {
  [key in Definitions[number][0]]: Parameters<Definitions[number][1]>[1]
}

const OperationDataSerializer = <const Definitions extends Array<[string, Serializer]>>(operationId: number, definitions: Definitions) => {
  const objectSerializer = ObjectSerializer(definitions)
  return (buffer: ByteBuffer, data: DefinitionsToParams<Definitions>) => {
    buffer.writeVarint32(operationId)
    objectSerializer(buffer, data)
  }
}

const OperationSerializers: Record<Operation['0'], Serializer> = {
  account_create: OperationDataSerializer(0, [
    ['fee', AssetSerializer],
    ['creator', StringSerializer],
    ['new_account_name', StringSerializer],
    ['owner', AuthoritySerializer],
    ['active', AuthoritySerializer],
    ['posting', AuthoritySerializer],
    ['memo_key', PublicKeySerializer],
    ['json_metadata', StringSerializer],
  ]),
  account_update: OperationDataSerializer(1, [
    ['account', StringSerializer],
    ['owner', OptionalSerializer(AuthoritySerializer)],
    ['active', OptionalSerializer(AuthoritySerializer)],
    ['posting', OptionalSerializer(AuthoritySerializer)],
    ['memo_key', PublicKeySerializer],
    ['json_metadata', StringSerializer],
  ]),


  transfer: OperationDataSerializer(2, [
    ['from', StringSerializer],
    ['to', StringSerializer],
    ['amount', AssetSerializer],
    ['memo', StringSerializer],
  ]),
  transfer_to_qi: OperationDataSerializer(3, [
    ['from', StringSerializer],
    ['to', StringSerializer],
    ['amount', AssetSerializer],
  ]),
  withdraw_qi: OperationDataSerializer(4, [
    ['from', StringSerializer],
    ['to', StringSerializer],
    ['amount', AssetSerializer],
  ]),
  set_withdraw_qi_route: OperationDataSerializer(5, [
    ['from_account', StringSerializer],
    ['to_account', StringSerializer],
    ['percent', UInt16Serializer],
    ['auto_vest', BooleanSerializer],
  ]),
  delegate_qi: OperationDataSerializer(6, [
    ['delegator', StringSerializer],
    ['delegatee', StringSerializer],
    ['qi', AssetSerializer],
  ]),


  siming_update: OperationDataSerializer(7, [
    ['owner', StringSerializer],
    ['url', StringSerializer],
    ['block_signing_key', PublicKeySerializer],
    ['props', ChainPropertiesSerializer],
    ['fee', AssetSerializer],
  ]),
  siming_set_properties: OperationDataSerializer(8, [
    ['owner', StringSerializer],
    ['props', ChainPropertiesSerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),
  account_siming_adore: OperationDataSerializer(9, [
    ['amount', StringSerializer],
    ['siming', StringSerializer],
    ['approve', BooleanSerializer],
  ]),
  account_siming_proxy: OperationDataSerializer(10, [
    ['account', StringSerializer],
    ['proxy', StringSerializer],
  ]),
  decline_adoring_rights: OperationDataSerializer(11, [
    ['account', StringSerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),


  custom: OperationDataSerializer(12, [
    ['required_auths', ArraySerializer(StringSerializer)],
    ['id', UInt16Serializer],
    ['data', StringSerializer],
  ]),
  custom_json: OperationDataSerializer(13, [
    ['required_auths', ArraySerializer(StringSerializer)],
    ['required_posting_auths', ArraySerializer(StringSerializer)],
    ['id', StringSerializer],
    ['json', StringSerializer],
  ]),


  request_account_recovery: OperationDataSerializer(14, [
    ['recovery_account', StringSerializer],
    ['account_to_recover', StringSerializer],
    ['new_owner_authority', AuthoritySerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),
  recover_account: OperationDataSerializer(15, [
    ['account_to_recover', StringSerializer],
    ['new_owner_authority', AuthoritySerializer],
    ['recent_owner_authority', AuthoritySerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),
  change_recovery_account: OperationDataSerializer(16, [
    ['account_to_recover', StringSerializer],
    ['new_recovery_account', StringSerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),


  claim_reward_balance: OperationDataSerializer(17, [
    ['account', StringSerializer],
    ['reward_qi', AssetSerializer],
    ['extensions', ArraySerializer(VoidSerializer)],
  ]),

  //#region contract
  create_contract: OperationDataSerializer(18, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['code', StringSerializer],
    ['abi', StringSerializer],
    ['fee', AssetSerializer],
  ]),
  revise_contract: OperationDataSerializer(19, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['code', StringSerializer],
    ['abi', StringSerializer],
    ['fee', AssetSerializer],
  ]),
  call_contract_function: OperationDataSerializer(20, [
    ['caller', StringSerializer],
    ['contract', StringSerializer],
    ['function', StringSerializer],
    ['params', StringSerializer],
    ['fee', AssetSerializer],
  ]),
  //#endregion

  //#region nfa (non fungible asset)
  create_nfa_symbol: OperationDataSerializer(21, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['maximum_supply', UInt32Serializer],
    ['json_metadata', StringSerializer],
  ]),

  create_nfa: OperationDataSerializer(22, [
    ['creator', StringSerializer],
    ['symbol', StringSerializer],
    ['to', StringSerializer],
    ['uri', StringSerializer],
    ['json_metadata', StringSerializer],
  ]),

  transfer_nfa: OperationDataSerializer(23, [
    ['from', StringSerializer],
    ['to', StringSerializer],
    ['token_id', UInt32Serializer],
    ['memo', StringSerializer],
  ]),

  approve_nfa_active: OperationDataSerializer(24, [
    ['owner', StringSerializer],
    ['approved', StringSerializer],
    ['token_id', UInt32Serializer],
    ['approve', BooleanSerializer],
  ]),

  action_nfa: OperationDataSerializer(25, [
    ['owner', StringSerializer],
    ['token_id', UInt32Serializer],
    ['action', StringSerializer],
    ['params', StringSerializer],
  ]),
  //#endregion

  //#region zone
  create_zone: OperationDataSerializer(26, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['json_metadata', StringSerializer],
  ]),
  //#endregion

  //#region actor
  create_actor_talent_rule: OperationDataSerializer(27, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['rule', StringSerializer],
  ]),

  create_actor: OperationDataSerializer(28, [
    ['owner', StringSerializer],
    ['name', StringSerializer],
    ['json_metadata', StringSerializer],
  ]),
  //#endregion

  //#region virtual operations
  hardfork: OperationDataSerializer(29, [
    ['hardfork_id', UInt32Serializer],
  ]),

  fill_qi_withdraw: OperationDataSerializer(30, [
    ['from_account', StringSerializer],
    ['to_account', StringSerializer],
    ['withdrawn', AssetSerializer],
    ['deposited', AssetSerializer],
  ]),

  return_qi_delegation: OperationDataSerializer(31, [
    ['account', StringSerializer],
    ['return_qi_delegation', AssetSerializer],
  ]),

  producer_reward: OperationDataSerializer(32, [
    ['producer', StringSerializer],
    ['qi_reward', AssetSerializer],
  ]),

  nfa_convert_resources: OperationDataSerializer(33, [
    ['owner', StringSerializer],
    ['token_id', UInt32Serializer],
    ['resources', StringSerializer],
  ]),

  nfa_trasfer: OperationDataSerializer(34, [
    ['from', StringSerializer],
    ['to', StringSerializer],
    ['token_id', UInt32Serializer],
  ]),

  nfa_deposit_withdraw: OperationDataSerializer(35, [
    ['owner', StringSerializer],
    ['token_id', UInt32Serializer],
    ['amount', AssetSerializer],
  ]),

  reward_feigang: OperationDataSerializer(36, [
    ['account', StringSerializer],
    ['reward', AssetSerializer],
  ]),

  reward_cultivation: OperationDataSerializer(37, [
    ['account', StringSerializer],
    ['reward', AssetSerializer],
  ]),

  tiandao_year_change: OperationDataSerializer(38, [
    ['year', UInt32Serializer],
  ]),

  tiandao_month_change: OperationDataSerializer(39, [
    ['month', UInt32Serializer],
  ]),

  tiandao_time_change: OperationDataSerializer(40, [
    ['time', UInt32Serializer],
  ]),

  actor_born: OperationDataSerializer(41, [
    ['actor_id', UInt32Serializer],
    ['owner', StringSerializer],
    ['json_metadata', StringSerializer],
  ]),

  actor_talent_trigger: OperationDataSerializer(42, [
    ['actor_id', UInt32Serializer],
    ['talent', StringSerializer],
    ['params', StringSerializer],
  ]),

  actor_movement: OperationDataSerializer(43, [
    ['actor_id', UInt32Serializer],
    ['from_zone', UInt32Serializer],
    ['to_zone', UInt32Serializer],
  ]),

  actor_grown: OperationDataSerializer(44, [
    ['actor_id', UInt32Serializer],
    ['growth', StringSerializer],
  ]),

  narrate_log: OperationDataSerializer(45, [
    ['narrator', StringSerializer],
    ['content', StringSerializer],
  ]),
  //#endregion
}

const OperationSerializer = (buffer: ByteBuffer, operation: Operation) => {
  const serializer = OperationSerializers[operation[0]]
  if (!serializer) {
    throw new Error(`No serializer for operation: ${operation[0]}`)
  }
  try {
    serializer(buffer, operation[1])
  } catch (error: any) {
    error.message = `${operation[0]}: ${error.message}`
    throw error
  }
}

const TransactionSerializer = ObjectSerializer([
  ['ref_block_num', UInt16Serializer],
  ['ref_block_prefix', UInt32Serializer],
  ['expiration', DateSerializer],
  ['operations', ArraySerializer(OperationSerializer)],
  ['extensions', ArraySerializer(StringSerializer)],
])

export const Types = {
  Array: ArraySerializer,
  Asset: AssetSerializer,
  Authority: AuthoritySerializer,
  Binary: BinarySerializer,
  Boolean: BooleanSerializer,
  Date: DateSerializer,
  FlatMap: FlatMapSerializer,
  Int16: Int16Serializer,
  Int32: Int32Serializer,
  Int64: Int64Serializer,
  Int8: Int8Serializer,
  Object: ObjectSerializer,
  Operation: OperationSerializer,
  Optional: OptionalSerializer,
  Price: PriceSerializer,
  PublicKey: PublicKeySerializer,
  StaticVariant: StaticVariantSerializer,
  String: StringSerializer,
  Transaction: TransactionSerializer,
  UInt16: UInt16Serializer,
  UInt32: UInt32Serializer,
  UInt64: UInt64Serializer,
  UInt8: UInt8Serializer,
  Void: VoidSerializer,
}
