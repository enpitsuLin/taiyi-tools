import { Client, type DynamicGlobalProperties } from './../src'

vi.setConfig({
  testTimeout: 100000
})
const client = Client.testnet({ autoConnect: false })

describe('client instance base status', () => {
  it('should connect', async () => {
    await client.connect()
    expect(client.isConnected()).toBe(true)
  })

  it('should exist baiyujing', () => {
    expect(client).toHaveProperty('baiyujing')
  })
})

describe('node and chain information', () => {

  it('should get state', async () => {
    const state = await client.baiyujing.getState()
    expect(state).toHaveProperty('props')
    expect((state as { props: DynamicGlobalProperties }).props).toHaveProperty('time')
  })

  it('should get siming', async () => {
    const siming = await client.baiyujing.getActiveSimings()
    expect(siming).toBeInstanceOf(Array)
    expect(siming.length).toBe(21)
  })

  it('should get block header', async () => {
    const header = await client.baiyujing.getBlockHeader(1)
    expect(header.previous)
      .toEqual('0000000000000000000000000000000000000000')
  })

  it('should get block', async () => {
    const block = await client.baiyujing.getBlock(1)
    expect(block.previous)
      .toEqual('0000000000000000000000000000000000000000')
    expect(block.transactions).instanceOf(Array)
  })

  it('should get ops in block', async () => {
    const ops = await client.baiyujing.getOpsInBlock(1)
    expect(ops).toBeInstanceOf(Array)
    expect(ops.at(0)).toHaveProperty('op')
    expect(ops.at(0)!.op[0]).toBe('producer_reward')
  })

  it('should get config', async () => {
    const config = await client.baiyujing.getConfig()
    expect(config).toHaveProperty('IS_TEST_NET')
  })

  it('should get chain dynamic global properties', async () => {
    const properties = await client.baiyujing.getDynamicGlobalProperties()


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

  it('should get siming schedule', async () => {
    const schedule = await client.baiyujing.getSimingSchedule()

    expect(schedule).toHaveProperty('id')
    expect(schedule).toHaveProperty('current_shuffled_simings')
    expect(schedule.current_shuffled_simings).toBeInstanceOf(Array)
  })

  it('should get hardfork version', async () => {
    const version = await client.baiyujing.getHardforkVersion()
    expect(version).toBeTypeOf('string')
  })

  it('should get next scheduled hardfork', async () => {
    const next = await client.baiyujing.getNextScheduledHardFork()
    expect(next).toHaveProperty('hf_version')
    expect(next).toHaveProperty('live_time')
  })

  it('should get reward fund', async () => {
    const fund = await client.baiyujing.getRewardFund('cultivation')
    expect(fund).toHaveProperty('id')
    expect(fund).toHaveProperty('name')
    expect(fund).toHaveProperty('reward_balance')
    expect(fund).toHaveProperty('reward_qi_balance')
    expect(fund).toHaveProperty('percent_content_rewards')
    expect(fund).toHaveProperty('last_update')
  })

  it('should get key references', async () => {
    const config = await client.baiyujing.getConfig()
    const references = await client.baiyujing.getKeyReferences([config.TAIYI_INIT_PUBLIC_KEY_STR as string])
    expect(references).toBeDefined()
  })
})

describe("account information", () => {
  it('should get accounts', async () => {
    const accounts = await client.baiyujing.getAccounts(['sifu'])

    expect(accounts).toHaveLength(1)
    expect(accounts[0].name).toBe('sifu')
    expect(accounts[0].recovery_account).toBe('initminer')
    expect(accounts[0]).toHaveProperty('other_history')
  })

  it('should lookup account names', async () => {
    const accounts = await client.baiyujing.lookupAccountNames(['sifu'])

    expect(accounts).toHaveLength(1)
    expect(accounts[0].name).toBe('sifu')
    expect(accounts[0].recovery_account).toBe('initminer')
  })

  it('should lookup accounts', async () => {
    const accounts = await client.baiyujing.lookupAccounts('sifu', 10)

    expect(accounts).toContain('sifu')
  })

  it('should get accounts count', async () => {
    const count = await client.baiyujing.getAccountsCount()

    expect(count).toBeGreaterThan(0)
  })

  it('should get owner history', async () => {
    const history = await client.baiyujing.getOwnerHistory('sifu')

    expect(history).toBeDefined()
  })

  it('should get recovery request', async () => {
    const request = await client.baiyujing.getRecoveryRequest('sifu')

    expect(request).toBe(null)
  })

  it('should get withdraw routes', async () => {
    const routes = await client.baiyujing.getWithdrawRoutes('sifu', 'all')

    expect(routes).instanceOf(Array)
  })


  it('should get qi delegations', async () => {
    const delegations = await client.baiyujing.getQiDelegations('sifu', 10, 10)

    expect(delegations).toMatchInlineSnapshot(`[]`)
  })

  //TODO(@enpitsulin): 记录下报错
  it.skip('should get expiring qi delegations', async () => {
    try {
      const delegations = await client.baiyujing.getExpiringQiDelegations('sifu', 0, 10)
      expect(delegations).toMatchInlineSnapshot(`[]`)

    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).cause).toMatchInlineSnapshot(`
        {
          "code": 13,
          "message": "Day of month value is out of range 1..31",
          "name": "N5boost10wrapexceptINS_9gregorian16bad_day_of_monthEEE",
          "stack": [
            {
              "context": {
                "file": "time.cpp",
                "hostname": "",
                "level": "warn",
                "line": 48,
                "method": "from_iso_string",
                "timestamp": "2025-02-05T09:53:14",
              },
              "data": {
                "what": "Day of month value is out of range 1..31",
              },
              "format": "\${what}: unable to convert ISO-formatted string to fc::time_point_sec",
            },
          ],
        }
      `)
    }
  })

  it('should get account history', async () => {

    const history = await client.baiyujing.getAccountHistory('initminer', -1, 1)

    await expect(history).toMatchFileSnapshot('./__snapshots__/account_history.snap')
  })
})

describe('siming', () => {

  it('should get simings', async () => {
    const simings = await client.baiyujing.getSimings([0])

    expect(simings).toHaveLength(1)
    expect(simings[0]).toHaveProperty('id')
    expect(simings[0]).toHaveProperty('owner')
    expect(simings[0]).toHaveProperty('props')
    expect(simings[0]).toHaveProperty('running_version')
    expect(simings[0]).toHaveProperty('signing_key')

  })

  it('should get siming by account', async () => {
    const siming = await client.baiyujing.getSimingByAccount('initminer')

    expect(siming).toHaveProperty('id')
    expect(siming).toHaveProperty('owner')
  })

  it('should get siming by adore', async () => {
    const simings = await client.baiyujing.getSimingsByAdore('initminer', 10)

    expect(simings).toBeInstanceOf(Array)
    expect(simings).toHaveLength(1)

    expect(simings.at(0)).toHaveProperty('id')
    expect(simings.at(0)).toHaveProperty('owner')
  })

  it('should lookup siming accounts', async () => {
    const simings = await client.baiyujing.lookupSimingAccounts('initminer', 10)

    expect(simings).toBeInstanceOf(Array)
    expect(simings).toContain('initminer')
  })

  it('should get siming count', async () => {
    const count = await client.baiyujing.getSimingCount()

    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(21)
  })
})

// 节点没有合适的固定 tx 无法验证，先skip
describe('transaction', () => {

  it.skip('should get transaction hex', async () => {
    // const hex = await client.baiyujing.getTransactionHex('529cf82ee9d82f2aba852f8e65d63e02b787d32d')
    // expect(hex).toBeDefined()
  })

  it.skip('should get transaction results', async () => {
    const results = await client.baiyujing.getTransactionResults('529cf82ee9d82f2aba852f8e65d63e02b787d32d')
    expect(results).toHaveLength(1)
  })
})

describe('Nfa', () => {
  it('should get nfa', async () => {
    const nfa = await client.baiyujing.find_nfa(1)
    expect(nfa).toHaveProperty('id')
    expect(nfa).toHaveProperty('symbol')
    //@ts-expect-error TODO(@enpitsulin): Nfa 的类型
    expect(nfa.symbol).toBe('nfa.jingshu.book')
  })

  it('should list all nfas', async () => {
    const nfas = await client.baiyujing.list_nfas('sifu', 10)
    expect(nfas).instanceOf(Array)
    expect(nfas.length).greaterThan(0)
  })

  it('should get nfa history', async () => {
    const history = await client.baiyujing.getNfaHistory(1, 20, 10)
    expect(history).instanceOf(Array)
    expect(history.length).greaterThan(0)
  })

  it('nfa action', async () => {
    const info = await client.baiyujing.getNfaActionInfo(28, 'short')
    expect(info).toHaveProperty('exist')
  })

  // 等可以部署合约后可以通过本地测试网验证
  it.skip('nfa eval action', async () => {
    const info = await client.baiyujing.evalNfaAction(28, ['short'])
    expect(info).toHaveProperty('exist')
  })

  // 同上
  it.skip('nfa action with string args', async () => {
    const info = await client.baiyujing.evalNfaActionWithStringArgs(28, 'short', '100')
    expect(info).toHaveProperty('exist')
  })
})
