/************************************* Block **********************************
 * 
 * This defines the Block fields and a hash function:
 * getHash(block)   - calculate the block hash using SH256
 *
 * 
*/
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");
//const Transaction = require("./transaction");

class Block {
    constructor(index = 1, timestamp, data, difficulty = 1) {
        // Block's index
        this.blockNumber = index;
        // Block's creation timestamp
        this.timestamp = timestamp;
        // Block's transactions
        this.data = data;
        // Parent (previous) block's hash
        this.prevHash = "";
        // Block's hash
        this.hash = Block.getHash(this);
        // Difficulty
        this.difficulty = difficulty;
        // Nonce
        this.nonce = 0;
    }

    // Calculate the hash of the block
    static getHash(block) {
        return SHA256(block.blockNumber.toString() + block.prevHash + block.timestamp + JSON.stringify(block.data) + block.difficulty + block.nonce);
    }

    //maybe add get transaction, checking through the chain, looking at each block, seeing if from or to is equal to public key and then storing accordingly
}

module.exports = Block;
