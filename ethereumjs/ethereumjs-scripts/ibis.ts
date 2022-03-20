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

type NodeType = { id: string, lastSeen: string}
type Record = {id: string, lastSeen: string}
const CHAIN_ID =  0x189f624f;

export default class IbisWorker extends EventEmitter{
    _private_key: Buffer
    _address: Address
    // _target: PeerInfo
    _rlpx_peers: Set<Peer>
    _ttx_hashes: Set<string>
    _dpt: devp2p.DPT
    _rlpx: devp2p.RLPx
    _graph: { [id: string]: Record[]}
    _map: Map<string, string>
    _rl: readline.Interface
    _active: boolean

    constructor(private_key: Buffer, dpt: devp2p.DPT, rlpx: devp2p.RLPx) {
      super()
      this._private_key = private_key;
      this._address = Address.fromPrivateKey(private_key);
      this._dpt = dpt;
      this._rlpx = rlpx;
      this._rlpx_peers = new Set<Peer>();
      this._ttx_hashes = new Set<string>();
      this._graph = {};
      this._map = new Map()
      this._rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      this._active = false;

    }



  /* TAGGED TRANSACTION FUNCTIONS */

  async ttx_menu() {
    console.log(chalk.red("\n TTx targets"))
    let count = 0;
    let peers = this._rlpx.getPeers() as Array<devp2p.Peer>;

    for(let peer of peers){
      let addr = peer._socket.remoteAddress;
      let id = peer.getId();
      if (addr && id) console.log(chalk.green(count + ") ") + addr + " (" + id.toString('hex').slice(0, 7) + ")")
      count += 1;
    }

    const user_input: string = await new Promise(resolve => {
      this._rl.question('Please select an option [0-' + (count - 1) + '] ', resolve);
    })

    return new Promise((resolve, reject) => {
      let opt = parseInt(user_input)

      if(( 0 <= opt && opt <= count - 1)) {
        this.sendTTx(peers[opt]);
        console.log("ttx complete...")
        resolve(peers[opt])
      } else {
        console.log("error: todo add catch")
      }
    });
  }

  /**
   * Creates an IBIS 'Tagged Transaction', sends the message to a specified
   * Peer and returns the Transaction hash
   */
   createTTx() {
     const common = new Common({ chain: myCustomChain, hardfork: Hardfork.London })
     let txData = {
      nonce: 0,
      gasPrice: 100,
      gasLimit: 1000000000,
      value: 0,
      data: randomBytes(8),
    }

    // let txData = {
    //   "chainId": CHAIN_ID,
    //   "nonce": "0x00",
    //   "maxPriorityFeePerGas": "0x01",
    //   "maxFeePerGas": "0xff",
    //   "gasLimit": "0x02625a00",
    //   "to": "0xcccccccccccccccccccccccccccccccccccccccc",
    //   "value": "0x0186a0",
    //   "data": "0x1a8451e600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    //   "accessList": [],
    //   "type": "0x02"
    // }

    const tx = TransactionFactory.fromTxData(txData, { common })

    const signedTx = tx.sign(this._private_key)

    if (signedTx.validate() && signedTx.getSenderAddress().equals(this._address)) {
      console.log('Valid signature')
    } else {
      console.log('Invalid signature')
    }

    return signedTx;
  }

  async sendTTx(target: devp2p.Peer) {
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` generating ttx...`));

    // create the tagged transaction
    const ttx = this.createTTx()
    const txHash = ttx.hash().toString('hex')

    // get peer information
    const eth = target.getProtocols()[0]
    try {
      console.log(chalk.gray(`...sending ttx with hash `), txHash);

      if(eth instanceof devp2p.ETH) {
        (eth as devp2p.ETH).sendMessage(devp2p.ETH.MESSAGE_CODES.TX, ttx.serialize());
          console.log(chalk.green(`sent ttx <3`));
      } else {
        console.log(chalk.gray(`...peer using LES protocol, ttx not sent`))
      }
      this._ttx_hashes.add(txHash)
      console.log(chalk.green(`...now tracking ${this._ttx_hashes.size} TTx's...`));

      } catch(e){
        console.log(e);
      }

  }

  verifyTTx(tx: TypedTransaction) {
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` received tx, checking if ttx... )`));
    console.log(chalk.gray(`...currently ${this._ttx_hashes.size} TTx's in circulation`))

    if(tx.hash().toString('hex') in this._ttx_hashes) {
      console.log(chalk.green(`...parsed message is a ttx`));
      return true;
    } else {
      console.log(chalk.red(`...parsed message is not a ttx`));
      return false;
    }
  }

  /* Delving Functions */

  async delve_menu() {
    console.log(chalk.red("\n Delving targets"))

    let count = 0;
    let peers = this._dpt.getPeers() as Array<PeerInfo>
    for(let peer of peers){
      console.log(chalk.green(count + ") ") + peer.address)
      count += 1;
    }

    const user_input: string = await new Promise(resolve => {
      this._rl.question('Please select an option [0-' + (count - 1) + '] ', resolve);
    })

    return new Promise((resolve, reject) => {
      let opt = parseInt(user_input)

      if(( 0 <= opt && opt <= count - 1)) {
        this.delve(peers[opt], peers[opt].id as Buffer)
        console.log("delving complete...")
        resolve(peers[opt])
      } else {
        console.log("error: todo add catch")
      }
    });
  }


  async delve(target: PeerInfo, delve_id: Buffer) {

    if(!target.address) {
      console.log("no target address, exiting delve")
      return;
    }
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` delving... ` + chalk.cyan(target.address)));
    let targetHash = keccak256(target.id as Buffer);

    // calculate ids for each k-bucket
    //todo: these could be stored outside of the program to speed it up
    let DELVE_IDS : Buffer[] = this.generateDistanceIds(target.id as Buffer);

  
    // send a FIND_NEIGHBOURS message, targeted to each k-bucket
    for (let delve_id of DELVE_IDS) {
      if(!delve_id) {
        continue
      }

      let dist = this.calculateLogicalDistance(targetHash, keccak256(delve_id));

      console.log(chalk.cyan("delving distance = ") + chalk.red(dist.toString()));
      console.log(chalk.cyan("delving with id = ") + chalk.red(delve_id.toString('hex')));
      this._dpt._server.findneighbours(target, delve_id);
      var response: PeerInfo[] = await new Promise(resolve => this._dpt._server.on('peers', (peers) => resolve(peers)));
      console.log(chalk.magenta(`(ibis) `) + chalk.green(`received `) + response.length + chalk.green(` neighbours`));

      for(let entry of response) {
        if(target.address && entry.address) this.addEdge(target.address, entry.address);
      }

      //wait
      await this.delay(500);
    }

    return;
  }



  /**
   * Generates an array of node ids where the index in the array
   * corresponds to the LOGICAL_DISTANCE from the target node id.
   * For example, result[1] represents a difference at the 1st bit
   *
   * Note: computations use the keccak256 hash of the 512-bit public key
   * @param target target node id
   */
  generateDistanceIds(target: Buffer): Buffer[] {
    console.log(chalk.grey('calculating distance ids, this may take a while...'))
    let start_time = new Date().getTime();

    let arr = new Array<Buffer>(255);
    let hash = keccak256(target)
    let count = 0;
    let success = 0
    //limit should be 255
    let limit = 10
    while(true) {
      if (success > limit) break;
      console.log(success + "/" + limit)
      let randomId = randomBytes(32)
      let logicalDistance = this.calculateLogicalDistance(hash, keccak256(randomId));

      if(!arr[logicalDistance]) {
        arr[logicalDistance] = randomId
        success += 1
      }

      count += 1;
    }

  // get total minutes between two dates
    let end_time = new Date().getTime();
    var minutes = Math.abs(start_time - end_time) / 1000 / 60;
    console.log("calculated %d delve_ids in %d attempts and %d minutes", success, count, minutes);
    return arr;
  }

  //todo: fix this
  calculateLogicalDistance(x: Buffer, y: Buffer): number {
    let log_dist = xor(x, y);
    return Math.floor(Math.log2(buffer2int(log_dist)));
}


  // - - -

  addEdge(src: string, dst: string) {
    if(src == dst) return;
    const key = src + "," + dst;
    if(!this._map.has(key)) console.log(chalk.cyan(`...adding new edge `) + src + " -> " + dst)
    else console.log(chalk.grey(`...updating existing edge `) + src + " -> " + dst)

    this._map.set(key, new Date().toString())
  }

  async main() {
    console.log(this._dpt._server.ibis_message());
    while(true) {
      //console.clear()
      let promise = await this.parent_menu();
      console.log("promise: " + promise)

      console.log(chalk.green("\n\nrestarting...\n\n"));
    }

    /* TTx */
    // for(let peer of this._rlpx.getPeers()) {
    //   this.sendTTx(peer as unknown as Peer);
    // }

    /* Delving */
    // for(let peer of this._dpt.getPeers()) {
    //   let delve_ids = generateDistanceIds(peer.id as Buffer);
    //   this.delve(peer, peer.id as Buffer)

    //   // for(let id of delve_ids) {
    //   //   this.delve(peer, id)
    //   // }
    // }


    /* Node Map */

    // const peers = dpt.getPeers()

    // for(const peer of peers) {
    //   let delve_ids = generateDistanceIds(peer.id as Buffer);

    //   for(let id of delve_ids) {
    //     console.log("...delving id " + peer.id + "with" + id)
    //     delve(bootnode, id as Buffer)
    //   }
    // }
  }


  async parent_menu(){
    console.log(chalk.bgWhite(chalk.black("       MENU        ")));
    console.log(chalk.green("   0) ") + "print status");
    console.log(chalk.green("   1) ") +  "delve");
    console.log(chalk.green("   2) ") +  "tagged transaction");
    console.log(chalk.green("   3) ") +   "exit");

    let fn: any;

    const user_input = await new Promise(resolve => {
      this._rl.question('Please select an option [0-2] ', resolve);
    })

    switch(user_input) {
      case '0':
        return new Promise(resolve => resolve(this.print_status()));
      case '1':
        return new Promise(resolve => resolve(this.delve_menu()));
      case '2':
        return new Promise(resolve => resolve(this.ttx_menu()));
      default:
        console.log(chalk.red('invalid selection'));
    }

    return new Promise(reject=>reject("oops"));
``  }


  print_status() {
    console.log(chalk.bgCyan("(ibis status)"))
    console.log(chalk.grey("Node Address: ") + chalk.magenta(this._address.toString()));
    console.log(chalk.grey("RLPx peers: ") + chalk.cyan(this._rlpx.getPeers().length.toString()));
    console.log(chalk.grey("DPT peers: ") + chalk.cyan(this._dpt.getPeers().length.toString()));
    console.log(chalk.grey("Graph size: ") + chalk.cyan(this._map.size.toString()));
    return "status complete"
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

}




/* Utility Functions */

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
   * Sends a GET_RECEIPTS eth message to a target,
   * returning the Receipt object
   * @param target
   */
  // async function getReceipt(peer: Peer) {
  //   console.log("\n |-- RECEIPT METHOD --| \n")
  //   const eth = peer.getProtocols()[0]

  //   /* Create a Tagged Transaction */
  //   let payload = "abc"
  //   eth.sendMessage(devp2p.ETH.MESSAGE_CODES.TX, payload)
  //   console.log("...sent Tagged Transaction\n")


  //   /* Send a GET_RECEIPTS message */
  //   let block_hashes = "0xfd"
  //   eth.sendMessage(devp2p.ETH.MESSAGE_CODES.GET_RECEIPTS, block_hashes)
  //   console.log("...sent GET_RECEIPTS\n")

  //   var x = await new Promise(resolve => rlpx._server.on('message', (code, payload) =>  {
  //     if(code == devp2p.ETH.MESSAGE_CODES.RECEIPTS) {
  //       console.log("*** RECEIVED RECEIPT ***");
  //       resolve(payload);
  //     }

  //     console.log(x);
  //     console.log(`
  //     +:+:+:+:+:+:+ +:+:+:+:+:+:+ +:+:+:+:+:+:+ +:+:+:+:+:+:+
  //     `)
  //   }));


  // }