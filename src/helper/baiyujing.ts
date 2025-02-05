import type { Client } from "../client";
import type { Account, ExtendedAccount } from "../taiyi/account";
import type { BlockHeader, SignedBlock } from "../taiyi/block";
import type { ChainProperties, DynamicGlobalProperties } from "../taiyi/misc";
import type { AppliedOperation } from "../taiyi/operation";
import type { RewardFund } from "../taiyi/rewards";
import type { ScheduleSiming, Siming } from "../taiyi/siming";
import type { SignedTransaction, Transaction } from "../taiyi/transcation";

export class BaiYuJingAPI {
  constructor(private readonly client: Client) { }

  /**
   * 用于调用 `baiyujing_api` 的便捷方法。
   */
  public call<T>(method: string, params?: any[]) {
    return this.client.call<T>('baiyujing_api', method, params)
  }

  public async getState(path?: string) {
    return this.call<unknown>('get_state', [path])
  }

  /** 当前司命 */
  public async getActiveSimings() {
    return this.call<string[]>('get_active_simings')
  }

  public async getBlockHeader(blockNum: number) {
    return this.call<BlockHeader>('get_block_header', [blockNum])
  }

  public async getBlock(blockNum: number) {
    return this.call<SignedBlock>('get_block', [blockNum])
  }

  public async getOpsInBlock(blockNum: number) {
    return this.call<AppliedOperation[]>('get_ops_in_block', [blockNum])
  }

  public getConfig() {
    return this.call<Record<string, string | number | boolean>>('get_config')
  }

  public async getDynamicGlobalProperties() {
    return this.call<DynamicGlobalProperties>('get_dynamic_global_properties')
  }

  public async getChainProperties() {
    return this.call<ChainProperties>('get_chain_properties')
  }

  public async getSimingSchedule() {
    return this.call<ScheduleSiming>('get_siming_schedule')
  }

  public async getHardforkVersion() {
    return this.call<string>('get_hardfork_version')
  }

  public async getNextScheduledHardFork() {
    return this.call<number>('get_next_scheduled_hardfork')
  }

  public async getRewardFund(name: string) {
    return this.call<RewardFund>('get_reward_fund', [name])
  }

  public async getKeyReferences(keys: string[]) {
    return this.call<string[]>('get_key_references', [keys])
  }

  async getAccounts(names: string[]) {
    return this.call<ExtendedAccount[]>('get_accounts', [names])
  }

  async lookupAccountNames(names: string[]) {
    return this.call<Account[]>('lookup_account_names', [names])
  }

  /** 模糊查找用户名 */
  async lookupAccounts(lowerBoundName: string, limit: number) {
    return this.call<string[]>('lookup_accounts', [lowerBoundName, limit])
  }

  async getAccountsCount() {
    return this.call<number>('get_account_count')
  }

  /**
   * 从 `start` 开始反向查询指定账户的交易历史
   * @param start `-1` 或者任意正整数
   * @param limit 最大 1000，如果 start 为正，需要小于 start
   */
  async getAccountHistory(accountName: string, start: number, limit: number) {
    return this.call<unknown[]>('get_account_history', [accountName, start, limit])
  }

  async getOwnerHistory(owner: string) {
    return this.call<unknown[]>('get_owner_history', [owner])
  }

  async getRecoveryRequest(accountName: string) {
    return this.call<unknown>('get_recovery_request', [accountName])
  }

  async getWithdrawRoutes(accountName: string, routeType?: 'incoming' | 'outgoing' | 'all') {
    return this.call<unknown[]>('get_withdraw_routes', [accountName, routeType])
  }

  async getQiDelegations(delegator: string, start: number, limit?: number) {
    return this.call<unknown[]>('get_qi_delegations', [delegator, start, limit])
  }

  async getExpiringQiDelegations(delegator: string, start: number, limit?: number) {
    return this.call<unknown[]>('get_expiring_qi_delegations', [delegator, start, limit])
  }

  //#region Siming
  async getSimings(simingIds: number[]) {
    return this.call<Siming[]>('get_simings', [simingIds])
  }

  async getSimingByAccount(accountName: string) {
    return this.call<Siming>('get_siming_by_account', [accountName])
  }

  async getSimingsByAdore(startName: string, limit: number) {
    return this.call<Siming[]>('get_simings_by_adore', [startName, limit])
  }

  async lookupSimingAccounts(lowerBoundName: string, limit: number) {
    return this.call<string[]>('lookup_siming_accounts', [lowerBoundName, limit])
  }

  async getSimingCount() {
    return this.call<number>('get_siming_count')
  }
  //#endregion
  //#region Transaction

  async getTransactionHex(tx: SignedTransaction) {
    return this.call<string>('get_transaction_hex', [tx])
  }

  async getTransactionResults(trxId: string) {
    return this.call<Transaction[]>('get_transaction_results', [trxId])
  }
  //#endregion


  //#region NFA
  async find_nfa(nfaId: number) {
    return this.call<unknown>('find_nfa', [nfaId])
  }

  async find_nfas(nfaIds: number[]) {
    return this.call<unknown>('find_nfas', [nfaIds])
  }

  async list_nfas(owner: string, limit: number) {
    return this.call<unknown[]>('list_nfas', [owner, limit])
  }

  async getNfaHistory(nfaId: number, limit: number, start: number,) {
    return this.call<unknown[]>('get_nfa_history', [nfaId, limit, start])
  }

  async getNfaActionInfo(nfaId: number, action: string) {
    return this.call<{ exist: boolean, consequence: boolean }>('get_nfa_action_info', [nfaId, action])
  }

  async evalNfaAction(nfaId: number, action: string[]) {
    return this.call<unknown>('eval_nfa_action', [nfaId, action])
  }

  async evalNfaActionWithStringArgs(nfaId: number, action: string, args: string) {
    return this.call<unknown>('eval_nfa_action_with_string_args', [nfaId, action, args])
  }

  //#endregion

}
