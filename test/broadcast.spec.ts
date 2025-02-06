import type { Operation } from '../src'
import { randomBytes } from 'crypto'
import * as fs from 'fs/promises'
import { Client, PrivateKey } from '../src'

const NUM_TEST_ACCOUNTS = 1

function randomString(length: number) {
  return randomBytes(length * 2)
    .toString('base64')
    .replace(/[^0-9a-z]+/gi, '')
    .slice(0, length)
    .toLowerCase()
}

export async function createAccount(): Promise<{ username: string, password: string }> {
  const password = randomString(32)
  const username = `ctaiyi-${randomString(9)}`
  const response = await fetch('http://47.109.49.30:8080/create', {
    method: 'POST',
    body: `username=${username}&password=${password}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const text = await response.text()
  if (response.status !== 200) {
    throw new Error(`Unable to create user: ${text}`)
  }
  return { username, password }
}

async function getTestnetAccounts(): Promise<{ username: string, password: string }[]> {
  try {
    const data = await fs.readFile('.testnetrc')
    return JSON.parse(data.toString())
  }
  catch (error) {
    if ((error as any).code !== 'ENOENT') {
      throw error
    }
  }

  const rv: { username: string, password: string }[] = []
  while (rv.length < NUM_TEST_ACCOUNTS) {
    rv.push(await createAccount())
  }

  // eslint-disable-next-line no-console
  console.log(`CREATED TESTNET ACCOUNTS: ${rv.map(i => i.username)}`)

  await fs.writeFile('.testnetrc', JSON.stringify(rv))

  return rv
}

describe('broadcast', () => {
  vi.setConfig({
    testTimeout: 60 * 1000,
  })

  const client = Client.testnet()

  type Account = Awaited<ReturnType<typeof getTestnetAccounts>>[number]
  let acc1: Account, acc2: Account

  beforeAll(async () => {
    [acc1, acc2] = await getTestnetAccounts()
  })

  it('should create or exist account', async () => {
    expect(acc1).toBeDefined()
    expect(acc2).toBeDefined()
  })

  it('should create correct key', async () => {
    const activeKey = PrivateKey.fromLogin(acc1.username, acc1.password)
    const ownerKey = PrivateKey.fromLogin(acc1.username, acc1.password, 'owner')
    const postingKey = PrivateKey.fromLogin(acc1.username, acc1.password, 'posting')
    const memoKey = PrivateKey.fromLogin(acc1.username, acc1.password, 'memo')

    expect(activeKey.toString())
      .toBe(PrivateKey.from('5JQ4D21dDeW5fe3fT5BwMaa7vhUyvCdZqet1knFbNuRXTBQAhdb').toString())
    expect(ownerKey.toString())
      .toBe(PrivateKey.from('5KGudtStQtgXVKud22escrZKn6mxq298MFS7tkEakBN85QR22U1').toString())
    expect(postingKey.toString())
      .toBe(PrivateKey.from('5KczcseNZriu9jANqvdLixd4jYnpg4jgKL7NnLRVtaZwXiScvgf').toString())
    expect(memoKey.toString())
      .toBe(PrivateKey.from('5JuZrLeNWustMjCqzzCamHdzSoM1PMvWsUc2hyjpVLDb4zYkqcs').toString())
  })

  it('should get valid prepare tx', async () => {
    const operations: Operation[] = []
    const preparedTx = await client.broadcast.prepareTransaction({ operations })
    expect(preparedTx).toHaveProperty('expiration', expect.any(String))
    expect(preparedTx).toHaveProperty('extensions', [])
    expect(preparedTx).toHaveProperty('ref_block_num', expect.any(Number))
    expect(preparedTx).toHaveProperty('ref_block_prefix', expect.any(Number))
  })

  it('should sign tx with signature', async () => {
    const activeKey = PrivateKey.fromLogin(acc1.username, acc1.password)
    const operations: Operation[] = [
      [
        'create_actor',
        {
          // both work
          // fee: '1 @@000000037',
          // fee: '1.000000 QI',
          fee: {
            amount: 1,
            precision: 6,
            fai: '@@000000037',
          },
          creator: 'sifu',
          family_name: `ctaiyi-${randomString(2)}`,
          last_name: `ctaiyi-${randomString(2)}`,
        },
      ],
    ]
    const preparedTx = await client.broadcast.prepareTransaction({ operations })
    const tx = client.broadcast.sign(preparedTx, activeKey)

    expect(tx).toHaveProperty('expiration', preparedTx.expiration)
    expect(tx).toHaveProperty('extensions', preparedTx.extensions)
    expect(tx).toHaveProperty('ref_block_num', preparedTx.ref_block_num)
    expect(tx).toHaveProperty('ref_block_prefix', preparedTx.ref_block_prefix)
    expect(tx).toHaveProperty('operations', operations)
    expect(tx).toHaveProperty('signatures', [expect.any(String)])
  })
})
