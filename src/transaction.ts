import type { Operation } from './operation'

export interface Transaction {
  ref_block_num: number
  ref_block_prefix: number
  expiration: string
  operations: Operation[]
  extensions: any[]
}

export interface SignedTransaction extends Transaction {
  signatures: string[]
}

export interface TransactionConfirmation {
  id: string
  block_num: number
  trx_num: number
  expired: boolean
}
