import { hexToBytes } from '@noble/hashes/utils'
import { version } from '../package.json'

/**
 * 包版本
 */
export const VERSION = version

/**
 * 主网链ID
 * TODO(enpitsulin): 测试网ID 主网上线需调整
 */
export const DEFAULT_CHAIN_ID = hexToBytes('18dcf0a285365fc58b71f18b3d3fec954aa0c141c44e4e5cb4cf777b9eab274e')

/**
 * 地址前缀
 */
export const DEFAULT_ADDRESS_PREFIX = 'TAI'

interface RPCRequest {
  /**
   * Request sequence number.
   */
  id: number | string
  /**
   * RPC method.
   */
  method: 'call' | 'notice' | 'callback'
  jsonrpc: '2.0'
  params: any[]
}

interface RPCCall extends RPCRequest {
  method: 'call'
  /**
   * 1. API to call, you can pass either the numerical id of the API you get
   *    from calling 'get_api_by_name' or the name directly as a string.
   * 2. Method to call on that API.
   * 3. Arguments to pass to the method.
   */
  params: [number | string, string, any[]]
}

interface RPCError {
  code: number
  message: string
  data?: any
}

interface RPCResponse {
  /**
   * Response sequence number, corresponding to request sequence number.
   */
  id: number
  error?: RPCError
  result?: any
}

interface PendingRequest {
  request: RPCRequest,
  timer: NodeJS.Timer | undefined
  resolve: (response: any) => void
  reject: (error: Error) => void
}

