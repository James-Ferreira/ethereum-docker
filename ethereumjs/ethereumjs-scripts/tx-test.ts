import { EventEmitter } from 'events'
import ms from 'ms'
import chalk from 'chalk'
import { TypedTransaction, TransactionFactory, Transaction, JsonTx, FeeMarketEIP1559Transaction } from '@ethereumjs/tx'
import * as devp2p from '../src/index'
import { randomBytes } from 'crypto'

import { PeerInfo, xor, ETH, Peer, DPT, RLPx, keccak256, } from '@ethereumjs/devp2p'
import { buffer2int, int2buffer } from '@ethereumjs/devp2p'
import { Address } from 'ethereumjs-util'

/* Terminal IO */
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';

/* Chain */
import Common, { Chain, Hardfork } from '@ethereumjs/common'
import myCustomChain from './js-genesis.json'
const PRIVATE_KEY = randomBytes(32)
const ADDRESS = Address.fromPrivateKey(PRIVATE_KEY)
const CHAIN_ID = 413098575;

const common = new Common({ chain: myCustomChain, hardfork: Hardfork.London })
// let txData = {
//  nonce: randomBytes(8),
//  gasPrice: 0x3b9aca00,
//  gasLimit: 0x5208,
//  value: 0,
//  data: 0x0,
// }

let txData = {
  "chainId": CHAIN_ID,
  "nonce": "0x00",
  "maxPriorityFeePerGas": "0x01",
  "maxFeePerGas": "0xff",
  "gasLimit": "0x02625a00",
  "to": "0xcccccccccccccccccccccccccccccccccccccccc",
  "value": "0x0186a0",
  "data": "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "accessList": [],
  "type": "0x02"
}

const tx = TransactionFactory.fromTxData(txData, { common })

const signedTx = tx.sign(PRIVATE_KEY)

if (signedTx.validate() && signedTx.getSenderAddress().equals(ADDRESS)) {
 console.log('Valid signature')
} else {
 console.log('Invalid signature')
}

console.log("created tx: " + signedTx.serialize().toString('hex'))