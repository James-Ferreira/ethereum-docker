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
import { ETH, Peer } from '../src/index'
import myCustomChain from './js-genesis.json'

/* IBIS IMPORTS */
import { PeerInfo, xor } from '@ethereumjs/devp2p'
import { buffer2int } from '@ethereumjs/devp2p'

var GENESIS_DIFFICULTY = 1;
var GENESIS_HASH = "dfaa0648072fdf12cdeda5f09be19948b97b66733af7cb69a469000b5766328e";
var IBIS_BOOTNODE_IP = "172.16.254.62";
const PRIVATE_KEY = randomBytes(32)
const getPeerAddr = (peer: Peer) => `${peer._socket.remoteAddress}:${peer._socket.remotePort}`


/* SETUP */
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


/* DPT */
dpt.bind(30305, '0.0.0.0')
 
// uncomment, if you want accept incoming connections
// rlpx.listen(30305, '0.0.0.0')

const ibisBootnode = {
  address: IBIS_BOOTNODE_IP,
  udpPort: 30303,
  tcpPort: 30303,
}

dpt.addPeer(ibisBootnode).catch((err) => {
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

/*

  IBIS FUNCTIONS

*/

/**
 * Converts a hexidecimal string into a binary representation
 * @param hex hexademical string to convert
 * @returns binary conversion
 */
function hex2bin(hex: string){
  return (parseInt(hex, 16).toString(2)).padStart(8, '1');
}

/**
 * Converts a binary string into a hexidecimal representation
 * @param bin Binary string to convert
 * @returns hexidecimal conversion
 */
function bin2hex(bin: string){
  return (parseInt(bin, 2).toString(16));
}

/**
 * Generates an array of node ids where the index in the array
 * corresponds to the LOGICAL_DISTANCE from the target node id.
 * For example, result[1] represents a difference at the 1st bit
 * @param target target node id
 */
function generateDistanceIds(target: Buffer): any[] {

  let result = [];
  
  for(let i = 0; i < target.length; i++) {
      let val = Buffer.from(target);
      if (target[i] == 1) {
          val[i] = 0;
      } else {
          val[i] = 1
      }
      
      // console.log("target = " + target)
      // console.log("val = " + val)
      // console.log("hex = " + val.toString("hex"))
      result.push(val);
  }
  return result;
}

async function delve(target: PeerInfo, delve_id: Buffer) {
  // let log_dist = (xor(delve_id, dpt.getPeer(target)?.id))
  try {
    let log_dist = xor(delve_id, dpt.getPeer(target)?.id as Buffer);
    let dist = Math.log2(buffer2int(log_dist));
    console.log("delving distance = " + buffer2int(log_dist) + "/" + dist);
  } catch (e) {
    return console.log(e);
  }


  console.log(chalk.magenta(`(ibis)`) + chalk.green(` delving... )`));
  dpt._server.findneighbours(target, delve_id);
  var x = await new Promise(resolve => dpt._server.on('peers', (peers) => resolve(peers)));
  console.log(chalk.magenta(`(ibis)`) + chalk.green(` received: `));
  console.log(x);


  console.log(`

  +:+:+:+:+:+:+ +:+:+:+:+:+:+ +:+:+:+:+:+:+ +:+:+:+:+:+:+ 
                                                          
  +#+#+#+#+#+#+ +#+#+#+#+#+#+ +#+#+#+#+#+#+ +#+#+#+#+#+#+ 
                                                        
  `)
}

setInterval(() => {
  console.log(`
  ▄█  ▀█████████▄   ▄█     ▄████████ 
  ███    ███    ███ ███    ███    ███ 
  ███▌   ███    ███ ███▌   ███    █▀  
  ███▌  ▄███▄▄▄██▀  ███▌   ███        
  ███▌ ▀▀███▀▀▀██▄  ███▌ ▀███████████ 
  ███    ███    ██▄ ███           ███ 
  ███    ███    ███ ███     ▄█    ███ 
  █▀   ▄█████████▀  █▀    ▄████████▀  
  `)
  console.log(dpt._server.ibis_message())


  const peers = dpt.getPeers()
  //peer id is the first 7 characters from enode
  // const peerid = "288b972"

  
  for(const peer of peers) {
    let delve_ids = generateDistanceIds(peer.id as Buffer);

    for(let id of delve_ids) {
      // console.log("...delving id " + peer.id + "with" + id)
      delve(ibisBootnode, id as Buffer)
    }
  }


}, ms('5s'))

//add sent findneighbours to queue (with timestamp)
//wait to receive neighbours through events
//pair neighbours with their findneighbours


  // console.log(
  //   chalk.yellow(
  //     `Total nodes in DPT: ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`
  //   )
  // )


  // const peers = dpt.getPeers()
  // if (peers.length > 2) {
  //   peers.forEach( (element) => {
  //     let peer = element as Peer
  //       console.log(chalk.yellowBright(`\n \n Peer || ${Buffer.from(peer._remoteId)}`))
  //   })
  // }




  /* ARCHIVE */
  

/* Blocks */
// const blocksCache = new LRUCache({ max: 100 })
// function onNewBlock(block: Block, peer: Peer) {
//   const blockHashHex = block.hash().toString('hex')
//   const blockNumber = block.header.number.toNumber()
//   if (blocksCache.has(blockHashHex)) return

//   blocksCache.set(blockHashHex, true)
//   console.log(
//     `----------------------------------------------------------------------------------------------------------`
//   )
//   console.log(`New block ${blockNumber}: ${blockHashHex} (from ${getPeerAddr(peer)})`)
//   console.log(
//     `----------------------------------------------------------------------------------------------------------`
//   )
//   for (const tx of block.transactions) onNewTx(tx, peer)
// }

// function isValidTx(tx: TypedTransaction) {
//   return tx.validate()
// }

// async function isValidBlock(block: Block) {
//   return (
//     block.validateUnclesHash() &&
//     block.transactions.every(isValidTx) &&
//     block.validateTransactionsTrie()
//   )
// }


//const txCache = new LRUCache({ max: 1000 })
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
