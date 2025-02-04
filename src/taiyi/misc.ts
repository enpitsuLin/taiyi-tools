/**
 * @file Misc steem type definitions.
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
import { Asset } from './asset'
import { bytesToHex } from '@noble/hashes/utils'

/**
 * Large number that may be unsafe to represent natively in JavaScript.
 */
export type Bignum = string

/**
 * Buffer wrapper that serializes to a hex-encoded string.
 */
export class HexBuffer {

    /**
     * Convenience to create a new HexBuffer, does not copy data if value passed is already a buffer.
     */
    public static from(value: Uint8Array | HexBuffer | number[] | string) {
        if (value instanceof HexBuffer) {
            return value
        } else if (value instanceof Uint8Array) {
            return new HexBuffer(value)
        } else if (typeof value === 'string') {
            return new HexBuffer(Buffer.from(value, 'hex'))
        } else {
            return new HexBuffer(Buffer.from(value))
        }
    }

    constructor(public buffer: Uint8Array) { }

    public toString() {
        return bytesToHex(this.buffer)
    }

    public toJSON() {
        return this.toString()
    }

}

export interface ChainProperties {
    account_creation_fee: string | Asset
    maximum_block_size: number // uint32_t
}

/**
 * Node state.
 */
export interface DynamicGlobalProperties {
    id: number
    head_block_number: number
    head_block_id: string
    time: string

    /** 当前总等价阳寿供应量（包含真气、物质所有的等价阳寿总量） */
    current_supply: Asset | string

    /** 当前总的真气（自由真气） */
    total_qi: Asset | string
    /** 当前总的真气（自由真气） */
    pending_rewarded_qi: Asset | string
    pending_rewarded_feigang: Asset | string
    pending_cultivation_qi: Asset | string

    /** 当前总的金石（包括NFA内含物质） */
    total_gold: Asset | string
    /** 当前总的食物（包括NFA内含物质） */
    total_food: Asset | string
    /** 当前总的木材（包括NFA内含物质） */
    total_wood: Asset | string
    /** 当前总的织物（包括NFA内含物质） */
    total_fabric: Asset | string
    /** 当前总的药材（包括NFA内含物质） */
    total_herb: Asset | string

    /** 最大区块大小 */
    maximum_block_size: number;
    /** 当前绝对槽位号 */
    current_aslot: number;
    /** 最近槽位填充情况 */
    recent_slots_filled: string;
    /** 参与度计数（除以128得到参与百分比） */
    participation_count: number;
    /** 最后一个不可逆区块号 */
    last_irreversible_block_num: number;

    /** 委托返回周期 */
    delegation_return_period: number;
    /** 内容奖励阳百分比 */
    content_reward_yang_percent: number;
    /** 内容奖励气基金百分比 */
    content_reward_qi_fund_percent: number;

}
