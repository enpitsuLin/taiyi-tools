/**
 * @file Steem account type definitions.
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

import { PublicKey } from './../crypto'
import { Asset } from './asset'

export interface AuthorityType {
  weight_threshold: number // uint32_t
  account_auths: Array<[string, number]> // flat_map< account_name_type, uint16_t >
  key_auths: Array<[string | PublicKey, number]>// flat_map< public_key_type, uint16_t >
}

export class Authority implements AuthorityType {

  /**
   * Convenience to create a new instance from PublicKey or authority object.
   */
  public static from(value: string | PublicKey | AuthorityType) {
    if (value instanceof Authority) {
      return value
    } else if (typeof value === 'string' || value instanceof PublicKey) {
      return new Authority({
        account_auths: [],
        key_auths: [[value, 1]],
        weight_threshold: 1,
      })
    } else {
      return new Authority(value)
    }
  }

  public weight_threshold: number
  public account_auths: Array<[string, number]>
  public key_auths: Array<[string | PublicKey, number]>

  constructor({ weight_threshold, account_auths, key_auths }: AuthorityType) {
    this.weight_threshold = weight_threshold
    this.account_auths = account_auths
    this.key_auths = key_auths
  }
}

export interface Account {
  id: number // account_id_type
  name: string // account_name_type
  owner: Authority
  active: Authority
  posting: Authority
  memo_key: string;
  json_metadata: string;
  proxy: string;

  last_owner_update: string
  last_account_update: string;
  created: string;
  recovery_account: string;
  last_account_recovery: string;

  can_adore: boolean;

  balance: Asset | string;
  reward_yang_balance: Asset | string;
  reward_qi_balance: Asset | string;
  reward_feigang_balance: Asset | string;
  qi: Asset | string;
  delegated_qi: Asset | string;
  received_qi: Asset | string;
  qi_withdraw_rate: Asset | string;

  next_qi_withdrawal_time: string;
  withdrawn: number;
  to_withdraw: number;
  withdraw_routes: number;

  proxied_vsf_adores: number[];
  simings_adored_for: number;

  gold: Asset | string;
  food: Asset | string;
  wood: Asset | string;
  fabric: Asset | string;
  herb: Asset | string;
  qi_balance: Asset | string;
}

export interface ExtendedAccount extends Account {
  transfer_history: any[]
  other_history: any[]
  siming_adores: any[]
}
