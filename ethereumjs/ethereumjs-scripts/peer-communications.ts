import assert from 'assert'
import { randomBytes } from 'crypto'
import { TextEncoder, TextDecoder } from 'util'
import LRUCache from 'lru-cache'
import ms from 'ms'
import chalk from 'chalk'
import * as rlp from 'rlp'
import Common, { Chain, Hardfork } from '@ethereumjs/common'
import { TypedTransaction, TransactionFactory } from '@ethereumjs/tx'
import { Block, BlockHeader } from '@ethereumjs/block'
import * as devp2p from '../src/index'
import myCustomChain from './js-genesis.json'

/* IBIS IMPORTS */
import IbisWorker from './ibis'
import { PeerInfo, xor, ETH, Peer } from '@ethereumjs/devp2p'
import { buffer2int } from '@ethereumjs/devp2p'
import { Address } from 'ethereumjs-util'



/* Setup the chain */
const PRIVATE_KEY = Buffer.from("133965f412d1362645cbd963619023585abc8765c7372ed238374acb884b2b3a", 'hex')
var GENESIS_DIFFICULTY = 0x77777; 
var GENESIS_HASH = "98a440ae7d107996b4a68e08e54b36acaefb63e66dcbabfe115618116713f4cb";
var IBIS_BOOTNODE_IP = "172.16.254.62";
const bootnode = {
  address: IBIS_BOOTNODE_IP,
  udpPort: 30303,
  tcpPort: 30303,
}
const common = new Common({ chain: myCustomChain, hardfork: Hardfork.London})
const REMOTE_CLIENTID_FILTER = [
  'go1.5',
  'go1.6',
  'go1.7',
  'quorum',
  'pirl',
  'ubiq', 
  'gmc',
  'gwhale',
  'prichain',
]
const dpt = new devp2p.DPT(PRIVATE_KEY, {
  refreshInterval: 30000,
  endpoint: {
    address: '0.0.0.0',
    udpPort: null,
    tcpPort: null,
  },
})
const rlpx = new devp2p.RLPx(PRIVATE_KEY, {
  dpt,
  maxPeers: 25,
  capabilities: [devp2p.ETH.eth64, devp2p.ETH.eth65, devp2p.ETH.eth66],
  common,
  remoteClientIdFilter: REMOTE_CLIENTID_FILTER,
})

const IBIS = new IbisWorker(PRIVATE_KEY, dpt, rlpx)

/* accept incoming connections */
dpt.bind(30303, '0.0.0.0')
rlpx.listen(30303, '0.0.0.0')

/* SETUP */
const getPeerAddr = (peer: Peer) => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`



dpt.addPeer(bootnode).catch((err) => {
  console.error(chalk.bold.red(`DPT bootstrap error: ${err.stack || err}`))
})

dpt.on('error', (err) => console.error(chalk.red(`DPT error: ${err}`)))


/* RLPx*/

rlpx.on('error', (err) => console.error(chalk.red(`RLPx error: ${err.stack || err}`)))

rlpx.on('peer:added', (peer) => {
  const addr = getPeerAddr(peer)
  const eth = peer.getProtocols()[0]
  const requests: {
    headers: any[]
    bodies: any[]
    msgTypes: { [key: string]: ETH.MESSAGE_CODES }
  } = { headers: [], bodies: [], msgTypes: {} }

  const clientId = peer.getHelloMessage().clientId
  console.log(
    chalk.green(
      `Add peer: ${addr} ${clientId} (eth${eth.getVersion()}) (total: ${rlpx.getPeers().length})`
    )
  )

  console.log(`\n Peer ${addr} ${clientId} with ports ${peer.tcpPort} `)

  eth.sendStatus({
    td: devp2p.int2buffer(GENESIS_DIFFICULTY),
    bestHash: Buffer.from(
      GENESIS_HASH,
      'hex'
    ),
    genesisHash: Buffer.from(
      GENESIS_HASH,
      'hex'
    ),

  })

  // check CHECK_BLOCK
  let forkDrop: NodeJS.Timeout
  let forkVerified = true
  // eth.once('status', () => {
  //   eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [1, [CHECK_BLOCK_NR, 1, 0, 0]])
  //   forkDrop = setTimeout(() => {
  //     console.log(chalk.red("dropping due to fork timeout"))
  //     peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
  //   }, ms('15s'))
  //   peer.once('close', () => clearTimeout(forkDrop))
  // })
  
  eth.on('message', async (code: ETH.MESSAGE_CODES, payload: any) => {
    if (code in ETH.MESSAGE_CODES) {
      requests.msgTypes[code] = code + 1
    } else {
      requests.msgTypes[code] = 1
    }

    switch (code) {
      case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
        if (!forkVerified) break

        for (const item of payload) {
          const blockHash = item[0]
          if (blocksCache.has(blockHash.toString('hex'))) continue
          setTimeout(() => {
            eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [2, [blockHash, 1, 0, 0]])
            requests.headers.push(blockHash)
          }, ms('0.1s'))
        }
        break

      case devp2p.ETH.MESSAGE_CODES.TX:
        if (!forkVerified) break
        console.log("transaction received from: " + addr)
        try {
          const tx = TransactionFactory.fromSerializedData(payload);
          console.log(chalk.gray("...transaction received with hash: ") + tx.hash().toString('hex'))
          IBIS.verifyTTx(tx, addr);
        }
        catch(e) {
          console.log(chalk.gray("...attemping to parse tx from block body"));
          for (const item of payload) {
            const tx = TransactionFactory.fromBlockBodyData(item)
            console.log(chalk.gray("...transaction received with hash: ") + tx.hash().toString('hex'))
            IBIS.verifyTTx(tx, addr);
          }
        }
        finally {
          // console.log(chalk.red("...the transaction could not be parsed"))
        }
        break

      case devp2p.ETH.MESSAGE_CODES.NEW_POOLED_TRANSACTION_HASHES:
        if (!forkVerified) break
        console.log("received new pool transactions")

        for (const item of payload) {
          console.log("tx hash: " + item.toString('hex'));
        }

        break

      case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_HEADERS: {
        const headers = []
        // hack
        if (devp2p.buffer2int(payload[1][0]) === CHECK_BLOCK_NR) {
          headers.push(CHECK_BLOCK_HEADER)
        }

        if (requests.headers.length === 0 && requests.msgTypes[code] >= 8) {
          peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
        } else {
          eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS, [payload[0], headers])
        }
        break
      }

      case devp2p.ETH.MESSAGE_CODES.BLOCK_HEADERS: {

        // if (!forkVerified) {
        //   if (payload[1].length !== 1) {
        //     console.log(
        //       `${addr} expected one header for ${CHECK_BLOCK_TITLE} verify (received: ${payload[1].length})`
        //     )
        //     peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
        //     break
        //   }

        //   const expectedHash = CHECK_BLOCK
        //   const header = BlockHeader.fromValuesArray(payload[1][0], { common })
        //   if (header.hash().toString('hex') === expectedHash) {
        //     console.log(`${addr} verified to be on the same side of the ${CHECK_BLOCK_TITLE}`)
        //     clearTimeout(forkDrop)
        //     forkVerified = true
        //   }
        // } else {
        //   if (payload[1].length > 1) {
        //     console.log(
        //       `${addr} not more than one block header expected (received: ${payload[1].length})`
        //     )
        //     break
        //   }

        //   let isValidPayload = false
        //   const header = BlockHeader.fromValuesArray(payload[1][0], { common })
        //   while (requests.headers.length > 0) {
        //     const blockHash = requests.headers.shift()
        //     if (header.hash().equals(blockHash)) {
        //       isValidPayload = true
        //       setTimeout(() => {
        //         eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES, [3, [blockHash]])
        //         requests.bodies.push(header)
        //       }, ms('0.1s'))
        //       break
        //     }
        //   }

        //   if (!isValidPayload) {
        //     //console.log(`${addr} received wrong block header ${header.hash().toString('hex')}`)
        //   }
        // }

        break
      }

      case devp2p.ETH.MESSAGE_CODES.GET_BLOCK_BODIES:

        if (requests.headers.length === 0 && requests.msgTypes[code] >= 8) {
          peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
        } else {
          eth.sendMessage(devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES, [payload[0], []])
        }
        break

      case devp2p.ETH.MESSAGE_CODES.BLOCK_BODIES: {

        if (!forkVerified) break

        if (payload[1].length !== 1) {
          console.log(
            `${addr} not more than one block body expected (received: ${payload[1].length})`
          )
          break
        }

        let isValidPayload = false
        while (requests.bodies.length > 0) {
          const header = requests.bodies.shift()
          const txs = payload[1][0][0]
          const uncleHeaders = payload[1][0][1]
          const block = Block.fromValuesArray([header.raw(), txs, uncleHeaders], { common })
          const isValid = await isValidBlock(block)
          if (isValid) {
            isValidPayload = true
            onNewBlock(block, peer)
            break
          }
        }

        if (!isValidPayload) {
          console.log(`${addr} received wrong block body`)
        }

        break
      }

      case devp2p.ETH.MESSAGE_CODES.NEW_BLOCK: {

        if (!forkVerified) break

        const newBlock = Block.fromValuesArray(payload[0], { common })
        const isValidNewBlock = await isValidBlock(newBlock)
        if (isValidNewBlock) onNewBlock(newBlock, peer)

        break
      }

      case devp2p.ETH.MESSAGE_CODES.GET_NODE_DATA:
        eth.sendMessage(devp2p.ETH.MESSAGE_CODES.NODE_DATA, [payload[0], []])

        // if (requests.headers.length === 0 && requests.msgTypes[code] >= 8) {
        //   console.log(chalk.red("\n\ndropping due to GET_NODE_DATA"))
        //   console.log(requests)

        //   peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
        // } else {
        //   eth.sendMessage(devp2p.ETH.MESSAGE_CODES.NODE_DATA, [payload[0], []])
        // }
        break

      case devp2p.ETH.MESSAGE_CODES.NODE_DATA:

        break

      case devp2p.ETH.MESSAGE_CODES.GET_RECEIPTS:

        if (requests.headers.length === 0 && requests.msgTypes[code] >= 8) {
          peer.disconnect(devp2p.DISCONNECT_REASONS.USELESS_PEER)
        } else {
          eth.sendMessage(devp2p.ETH.MESSAGE_CODES.RECEIPTS, [payload[0], []])
        }
        break

      case devp2p.ETH.MESSAGE_CODES.RECEIPTS:

        break
    }
  })
 })

rlpx.on('peer:removed', (peer, reasonCode, disconnectWe) => {
  const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
  const total = rlpx.getPeers().length
  console.log(
    chalk.yellow(
      `Remove peer: ${getPeerAddr(peer)} - ${who}, reason: ${peer.getDisconnectPrefix(
        reasonCode
      )} (${String(reasonCode)}) (total: ${total})`
    )
  )
})
rlpx.on('peer:error', (peer, err) => {
  if (err.code === 'ECONNRESET') return

  if (err instanceof assert.AssertionError) {
    const peerId = peer.getId()
    if (peerId !== null) dpt.banPeer(peerId, ms('5m'))

    console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.message}`))
    return
  }

  console.error(chalk.red(`Peer error (${getPeerAddr(peer)}): ${err.stack || err}`))
})


/* Blocks */

const CHECK_BLOCK_TITLE = 'Custom Genesis' // Only for debugging/console output
const CHECK_BLOCK_NR = 0
const CHECK_BLOCK = GENESIS_HASH
const CHECK_BLOCK_HEADER = rlp.decode(
  Buffer.from(
    'f90219a0d44a4d33e28d7ea9edd12b69bd32b394587eee498b0e2543ce2bad1877ffbeaca01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347941ad91ee08f21be3de0ba2ba6918e714da6b45836a0fdec060ee45e55da9e36060fc95dddd0bdc47e447224666a895d9f0dc9adaa0ca0092d9fcc02ca9b372daec726704ce720d3aa366739868f4820ecaabadb9ac309a0974fee017515a46303f467b6fd50872994db1b0ea64d3455bad93ff9678aced9b90100356050004c5c89691add79838a01d4c302419252a4d3c96e9273908b7ee84660886c070607b4928c416a1800746a0d1dbb442d0baf06eea321422263726748600cc200e82aec08336863514d12d665718016989189c116bc0947046cc6718110586c11464a189000a11a41cc96991970153d88840768170244197e164c6204249b9091a0052ac85088c8108a4418dd2903690a036722623888ea14e90458a390a305a2342cb02766094f68c4100036330719848b48411614686717ab6068a46318204232429dc42020608802ceecd66c3c33a3a1fc6e82522049470328a4a81ba07c6604228ba94f008476005087a6804463696b41002650c0fdf548448a90408717ca31b6d618e883bad42083be153b83bdfbb1846078104798307834383639373636353666366532303530366636663663a0ae1de0acd35a98e211c7e276ad7524bb84a5e1b8d33dd7d1c052b095b564e8b888cca66773148b6e12',
    'hex'
  )
)


const blocksCache = new LRUCache({ max: 100 })
function onNewBlock(block: Block, peer: Peer) {
  const blockHashHex = block.hash().toString('hex')
  const blockNumber = block.header.number.toNumber()
  if (blocksCache.has(blockHashHex)) return

  blocksCache.set(blockHashHex, true)
  // console.log(
  //   `----------------------------------------------------------------------------------------------------------`
  // )
  // console.log(`New block ${blockNumber}: ${blockHashHex} (from ${getPeerAddr(peer)})`)
  // console.log(
  //   `----------------------------------------------------------------------------------------------------------`
  // )
  // for (const tx of block.transactions) onNewTx(tx, peer)
}

function isValidTx(tx: TypedTransaction) {
  return tx.validate()
}

async function isValidBlock(block: Block) {
  return (
    block.validateUnclesHash() &&
    block.transactions.every(isValidTx) &&
    block.validateTransactionsTrie()
  )
}





// const txCache = new LRUCache({ max: 1000 })
// function onNewTx(tx: TypedTransaction, peer: Peer) {
//   const txHashHex = tx.hash().toString('hex')
//   if (txCache.has(txHashHex)) return

//   txCache.set(txHashHex, true)
//   console.log(`New tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
// }


// const peersCount = dpt.getPeers().length
// const openSlots = rlpx._getOpenSlots()
// const queueLength = rlpx._peersQueue.length
// const queueLength2 = rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length



/* IBIS LOGIC */
// setInterval(() => {
//   if(!IBIS._active) IBIS.pollNetwork()
// }, ms('5s'))


//wait until there are at least 3 nodes connected to the IBIS Client
function checkMinPeers(min: number){
  if (rlpx.getPeers().length > min) return true;
  else return false;
}
async function waitForPeers() {
  const d = await delay(2000);
  return checkMinPeers(3)
}

async function ibis_loop() {
  console.log(chalk.bgMagenta(`launching ibis client...`));

  console.log(chalk.magentaBright(`(ibis) `) + chalk.cyan(`waiting for at least 3 peers...`))
  // while(true) {
  //   let result = await waitForPeers();
  //   if(!result) continue;
  //   else break;
  // }

  IBIS.main()

}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

/* run ibis */
ibis_loop();
