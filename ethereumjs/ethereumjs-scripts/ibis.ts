import { EventEmitter } from 'events'
import ms from 'ms'
import chalk from 'chalk'
import { TypedTransaction, TransactionFactory, JsonTx } from '@ethereumjs/tx'
import * as devp2p from '../src/index'

import { PeerInfo, xor, ETH, Peer, DPT, RLPx, } from '@ethereumjs/devp2p'
import { buffer2int } from '@ethereumjs/devp2p'
import { Address } from 'ethereumjs-util'

/* Terminal IO */
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';

type NodeType = { id: string, lastSeen: string}
type Record = {id: string, lastSeen: string}

export default class IbisWorker extends EventEmitter{
    _private_key: Buffer
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


  /**
   * Creates an IBIS 'Tagged Transaction', sends the message to a specified
   * Peer and returns the Transaction hash
   */
   createTTx() {
  
    const tx = TransactionFactory.fromTxData({
      nonce: 0,
      gasPrice: 100,
      gasLimit: 1000000000,
      value: 0,
      data:
        '0x7f4e616d65526567000000000000000000000000000000000000000000000000003057307f4e616d6552656700000000000000000000000000000000000000000000000000573360455760415160566000396000f20036602259604556330e0f600f5933ff33560f601e5960003356576000335700604158600035560f602b590033560f60365960003356573360003557600035335700',
    })
  
    const signedTx = tx.sign(this._private_key)
  
    const address = Address.fromPrivateKey(this._private_key)
  
    if (signedTx.validate() && signedTx.getSenderAddress().equals(address)) {
      console.log('Valid signature')
    } else {
      console.log('Invalid signature')
    }

    return signedTx;
  }

  sendTTx(target: Peer) {
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` generating ttx...`));

    // create the tagged transaction
    const ttx = this.createTTx()
    const txHash = ttx.hash().toString('hex')

    // get peer information
    const eth = target.getProtocols()[0]
    try {
      console.log(chalk.gray(`...sending ttx with hash `), txHash);
      if(eth instanceof devp2p.ETH) {
        (eth as devp2p.ETH).sendMessage(devp2p.ETH.MESSAGE_CODES.TX, ttx.serialize().toString('hex'))
      } else {
        console.log(chalk.gray(`...peer using LES protocol, ttx not sent`))
      }
      this._ttx_hashes.add(txHash)
      console.log(chalk.green(` sent ttx...`));    } catch (e) {
      console.log(e);
    }

  }

  verifyTTx(tx: TypedTransaction) {
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` received tx, checking if ttx... )`));
    if(tx.hash().toString('hex') in this._ttx_hashes) {
      console.log(chalk.green(`IBIS IS GO`));
      return true;
    } else {
      console.log(chalk.red(`IBIS IS NO`));
      return false;
    }
  }

  async delve(target: PeerInfo, delve_id: Buffer) {
    if(!target.address) {
      console.log("no target address, exiting delve")
      return;
    }
    console.log(chalk.magenta(`(ibis)`) + chalk.green(` delving... ` + chalk.cyan(target.address)));

    // let log_dist = (xor(delve_id, dpt.getPeer(target)?.id))
    // try {
    //   let log_dist = xor(delve_id, this._dpt.getPeer(target)?.id as Buffer);
    //   let dist = Math.log2(buffer2int(log_dist));
    //   console.log("delving distance = " + buffer2int(log_dist) + "/" + dist);
    // } catch (e) {
    //   return console.log(e);
    // }
    
    this._dpt._server.findneighbours(target, delve_id);
    var response: PeerInfo[] = await new Promise(resolve => this._dpt._server.on('peers', (peers) => resolve(peers)));
    console.log(chalk.magenta(`\n(ibis) `) + chalk.green(`received `) + response.length + chalk.green(` neighbours`));
    
    for(let entry of response) {
      if(target.address && entry.address) this.addEdge(target.address, entry.address);
    }
    // if(response["address"]) {
    //   this.addEdge(target.address, response["address"])
    // }
  
    return;
  }

  addEdge(src: string, dst: string) {
    if(src == dst) return;
    const key = src + "," + dst;
    if(!this._map.has(key)) console.log(chalk.cyan(`...adding new edge `) + src + " -> " + dst)
    else console.log(chalk.grey(`...updating existing edge `) + src + " -> " + dst)

    this._map.set(key, new Date().toString())
  }

  async main() {
    while(true) {
      console.log(this._dpt._server.ibis_message());
      let promise = await this.parent_menu();
      console.log("promise: " + promise)
    }
    //let result = await this.parent_menu();

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
    console.log(chalk.red("--> menu"))
    console.log(chalk.green("0) ") + "print status");
    console.log(chalk.green("1) ") +  "delve");
    console.log(chalk.green("2) ") +  "tagged transaction");
    console.log(chalk.green("3) ") +   "exit");

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
        break;
      default:
        console.log(chalk.red('invalid selection'));
    }

    return new Promise(reject=>reject("oops"));
``  }


  async delve_menu() {
    console.log(chalk.red("\n--> select Delving target"))

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
      console.log("option " + opt)

      if(( 0 <= opt && opt <= count - 1)) {
        this.delve(peers[opt], peers[opt].id as Buffer)
        console.log("delving complete...")
        resolve(peers[opt])
      } else {
        console.log("error: todo add catch")
      }
    });
  }

  print_status() {
    console.log(chalk.bgCyan("(ibis status)"))
    console.log("rlpx peers: ", this._rlpx.getPeers().length);
    console.log("dpt peers: ", this._dpt.getPeers().length);
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