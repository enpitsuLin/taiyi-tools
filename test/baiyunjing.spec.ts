import { Client } from './../src'

describe('client', () => {
  vi.setConfig({
    testTimeout: 100000
  })
  const client = Client.testnet({ autoConnect: false })

  it('should connect', async () => {
    await client.connect()
    expect(client.isConnected()).toBe(true)
  })

  it('should exist baiyujing', () => {
    expect(client).toHaveProperty('baiyujing')
  })

  it('should get chain dynamic global properties', async () => {
    const properties = await client.baiyujing.getDynamicGlobalProperties()
    console.log({ properties })
    expect(properties).toHaveProperty('head_block_number')
    expect(properties).toHaveProperty('head_block_id')
    expect(properties).toHaveProperty('time')
    expect(properties).toHaveProperty('current_siming')
    expect(properties).toHaveProperty('current_supply')
  })

  it('should get chain properties', async () => {
    const properties = await client.baiyujing.getChainProperties()
    expect(properties).toHaveProperty('account_creation_fee')
    expect(properties).toHaveProperty('maximum_block_size')
  })

  it('should get config', async () => {
    const config = await client.baiyujing.getConfig()
    expect(config).toHaveProperty('IS_TEST_NET')
  })

  it('should get accounts', async () => {
    const accounts = await client.baiyujing.getAccounts(['sifu'])
    expect(accounts).toHaveLength(1)
    expect(accounts[0].name).toBe('sifu')
    expect(accounts[0].recovery_account).toBe('initminer')
  })

  it('should get accounts count', async () => {
    const count = await client.baiyujing.getAccountsCount()
    expect(count).toBeGreaterThan(0)
  })
})
