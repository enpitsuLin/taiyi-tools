import type { Client } from "../client";
import type { Account } from "../taiyi/account";
import type { ChainProperties, DynamicGlobalProperties } from "../taiyi/misc";
import type { Transaction } from "../taiyi/transcation";

export class BaiYuJingAPI {
  constructor(private readonly client: Client) { }

  /**
   * 用于调用 `database_api` 的便捷方法。
   */
  public call<T>(method: string, params?: any[]) {
    return this.client.call<T>('baiyujing_api', method, params)
  }

  public async getDynamicGlobalProperties() {
    return this.call<DynamicGlobalProperties>('get_dynamic_global_properties')
  }

  public async getChainProperties() {
    return this.call<ChainProperties>('get_chain_properties')
  }

  public getConfig() {
    return this.call('get_config')
  }

  async getAccounts(names: string[]) {
    return this.call<Account[]>('get_accounts', [names])
  }

  async getAccountsCount() {
    return this.call<number>('get_account_count')
  }

  async get_transaction_results(trxId: string) {
    return this.call<Transaction[]>('get_transaction_results', [trxId])
  }
}
