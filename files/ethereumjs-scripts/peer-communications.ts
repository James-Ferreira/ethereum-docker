import assert from 'assert'
import { randomBytes } from 'crypto'
import LRUCache from 'lru-cache'
import ms from 'ms'
import chalk from 'chalk'
import * as rlp from 'rlp'
import Common, { Chain, Hardfork } from '@ethereumjs/common'
import { TypedTransaction, TransactionFactory } from '@ethereumjs/tx'
import { Block, BlockHeader } from '@ethereumjs/block'
import * as devp2p from '../src/index'
import { ETH, Peer } from '../src/index'
import myCustomChain from './js-genesis.json'

const PRIVATE_KEY = randomBytes(32)

const common = new Common({ chain: myCustomChain })
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

const getPeerAddr = (peer: Peer) => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

// DPT
const dpt = new devp2p.DPT(PRIVATE_KEY, {
  refreshInterval: 30000,
  endpoint: {
    address: '0.0.0.0',
    udpPort: null,
    tcpPort: null,
  },
})

/* eslint-disable no-console */
dpt.on('error', (err) => console.error(chalk.red(`DPT error: ${err}`)))

/* eslint-disable @typescript-eslint/no-use-before-defin e */

// RLPx
const rlpx = new devp2p.RLPx(PRIVATE_KEY, {
  dpt,
  maxPeers: 25,
  capabilities: [devp2p.ETH.eth66],
  common,
  remoteClientIdFilter: REMOTE_CLIENTID_FILTER,
})

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

  eth.sendStatus({
    td: devp2p.int2buffer(1), // total difficulty in genesis block
    bestHash: Buffer.from(
      'e3543ec4a70a1794cbebb6895501022f7b30a96ab56c06a5ff668caab02a41db',
      'hex'
    ),
    genesisHash: Buffer.from(
      'e3543ec4a70a1794cbebb6895501022f7b30a96ab56c06a5ff668caab02a41db',
      'hex'
    ),
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

// uncomment, if you want accept incoming connections
rlpx.listen(30305, '0.0.0.0')
dpt.bind(30305, '0.0.0.0')

// add ibis bootstrap node
const ibisBootnode = {
  address: "172.16.254.14",
  udpPort: 30303,
  tcpPort: 30303,
}
dpt.addPeer(ibisBootnode).catch((err) => {
  console.error(chalk.bold.red(`DPT bootstrap error: ${err.stack || err}`))
})



// connect to local ethereum node (debug)
/*
dpt.addPeer({ address: '127.0.0.1', udpPort: 30303, tcpPort: 30303 })
  .then((peer) => {
    return rlpx.connect({
      id: peer.id,
      address: peer.address,
      tcpPort: peer.tcpPort,
      udpPort: peer.tcpPort
    })
  })
  .catch((err) => console.log(`error on connection to local node: ${err.stack || err}`))
*/

const txCache = new LRUCache({ max: 1000 })
function onNewTx(tx: TypedTransaction, peer: Peer) {
  const txHashHex = tx.hash().toString('hex')
  if (txCache.has(txHashHex)) return

  txCache.set(txHashHex, true)
  console.log(`New tx: ${txHashHex} (from ${getPeerAddr(peer)})`)
}

const blocksCache = new LRUCache({ max: 100 })
function onNewBlock(block: Block, peer: Peer) {
  const blockHashHex = block.hash().toString('hex')
  const blockNumber = block.header.number.toNumber()
  if (blocksCache.has(blockHashHex)) return

  blocksCache.set(blockHashHex, true)
  console.log(
    `----------------------------------------------------------------------------------------------------------`
  )
  console.log(`New block ${blockNumber}: ${blockHashHex} (from ${getPeerAddr(peer)})`)
  console.log(
    `----------------------------------------------------------------------------------------------------------`
  )
  for (const tx of block.transactions) onNewTx(tx, peer)
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

setInterval(() => {
  const peersCount = dpt.getPeers().length
  const openSlots = rlpx._getOpenSlots()
  const queueLength = rlpx._peersQueue.length
  const queueLength2 = rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length

  console.log(
    chalk.yellow(
      `Total nodes in DPT: ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`
    )
  )
}, ms('30s'))