import { PeerInfo, KBucket, Server, DPTOptions, toNewUint8Array, int2buffer } from "@ethereumjs/devp2p";
import { DPT } from "../../ethereumjs/files/ibis_dpt";
import CryptoJS from 'crypto-js';
import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'

// DELVER CLASS
// pass it a DPT to use as its own (for connections)
export class Delver extends EventEmitter {
  _target: PeerInfo
  _targetID: number
  _targetDPT: DPT
  _targetKBucket: KBucket
  _server: Server

  const getNeighbours = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      })
    })
  }

  constructor(dpt: DPT, target: PeerInfo, targetID: number) {
    super();
    this._target = target;
    this._targetID = targetID;
    this._targetKBucket = new KBucket(randomBytes(32));
    this._server = new Server(this, randomBytes(32), null)
  } 

    /**
     *  Generates an address with a flipped bit from targetID at distance
     */
     generate_address_at_distance(distance: number): Buffer {
        let attempt = this._targetID;
        attempt[distance] = !attempt[distance];
        return int2buffer(attempt);
    }

    delve_target(target) {
      // calculate an address to map to each bucket (Geth = 17 Kbuckets)
      let delving_addrs: number[];
      for (let i = 0; i < 17; i++) {
        // delving_addrs.push(this.generate_address_at_distance(target, i))
        this._server.findneighbours(target, this.generate_address_at_distance(i))

      //wait until server.on("peers", )
      //sleep(xxx) - may be necessary for ddos 
      //blocking wait for NEIGHBOURS RETURN MESSAGE

      /* ADD NEIGHBOURS TO target_DPT */
      this._server.on('peers', (peers) => {
          console.log(peers)
          //target_dpt._addPeerBatch(peers)
        })
      }

    }

    async getNeighbours(): Promise<PeerInfo[]> {
      return this.dns.getPeers(this._dnsRefreshQuantity, this._dnsNetworks)
    }
}
//dpt.on('peers', (msg, rinfo) => console.error(chalk.red(`DELVER: ${msg} and rinfo ${rinfo}`)))
