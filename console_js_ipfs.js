'use strict';

// External modules
const repl = require('repl');
const fs   = require('fs');

// ElevenBuckets SDK modules
const castIron = require('CastIron/core/CastIron.js');
const ipfsBase = require('ipfs_base/IPFS_JS.js');

// extending classes for REPL
class ipfsREPL extends ipfsBase {
	constructor(cfpath) {
		super(cfpath);

		// Class methods in constructor to skip babel class transform
		this.pullFile = (ipfshash, outpath) => {
			return this.read(ipfshash).then((r) => {
				fs.writeFileSync(outpath, r);
				return true;
			})
		}

		this.reload = () => {
			this.ready = false;
  			return this.stop().then(() => {
	  			console.log("Reset IPFS ...");
	  			const IPFS = require('ipfs');
	  			this.ipfs = new IPFS(this.options);

	  			return ipfs.start().then(() => { this.ready = true; return true; });
  			})
		}

		this.ping = (nodehash) => { return this.ipfs.ping(nodehash, {count: 3}) }
		this.getConfigs = () => { return this.ipfs.config.get(); }
		this.setConfigs = (entry, value) => { 
			return this.ipfs.config.set(entry, value).then( () => { 
				return this.ipfs.config.get(entry).then((r) => { return { [entry]: r } });
			}); 
		}
	}
}


// Class instances
const ciapi = new castIron('./.local/config.json');
const ipfs  = new ipfsREPL('./.local/config.json');

// Handling promises in REPL (for node < 10.x)
const replEvalPromise = (cmd,ctx,filename,cb) => {
  let result=eval(cmd);
  if (result instanceof Promise) {
    return result.then(response=>cb(null,response));
  }
  return cb(null, result);
} 

// REPL main function
const terminal = (ipfs) => {
  return ipfs.start().then(() => {
  	  let r = repl.start({ prompt: '[CastIron]$ ', eval: replEvalPromise });
  	  r.context = {ipfs, ciapi};

  	  r.on('exit', () => {
  		  console.log('Thank you for using CastIron CLI...');
  		  if (ipfs.ipfs.isOnline()) ipfs.stop();
		  process.exit(0);
  	  })
    })
    .catch((err) => {
  	console.log(err);
  	process.exit(12);
    })
}

// Main
terminal(ipfs);

