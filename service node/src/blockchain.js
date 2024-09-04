/**************************************** blockchain *********************************
 *
 * This defines blockchain and has the following functions:
 * 
 * getLastBlock  - Used to get the latest block off the block chain
 * 
 * addTransaction(transaction)  - method to add a transaction to the pool of pending 
 *                                transactions
 * 
 * isValid(blockchain)  -  used to go through the whole blockchain to make sure that
 *                         the chain is valid. Only used in a multi node network
*/
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");
const Block = require("./block");
const Transaction = require("./transaction");



// Creating the Blockchain
class Blockchain {
	constructor() {
        this.chain = [new Block("")]; // use block definition 
        this.difficulty = 1; // number determines how many 0's a hash should start with
        this.blockTime = 40000 // the time between the creation of each new block in milliseconds 
        this.transactions = []; //message pool which holds all of the pending transactions that need to be mined
    }

    // Used to get the latest block off the block chain
    getLastBlock() {
        return this.chain[this.chain.length - 1]; // chain length is number of elements in the array
    }



    
    // method to add a transaction to the pool of pending transactions
   	addTransaction(transaction){
   		//console.log("attempting to add transaction to the pool")
   		//console.log(transaction); //****************************************************
   		if (Transaction.isValid(transaction, this)) {
            this.transactions.push(transaction);
            //console.log("*ADDING THE TRANSACTION*")
        }
   	}
   
    static isValid(blockchain) { // only used in a multi node network
        // go through the whole blockchain to make sure that the chain is valid
        for (let i = 1; i < blockchain.chain.length; i++) { //i starts at 1, as 0 is the genesis block which contains nothing
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];

            // Checks the hash that is stored in the current block and uses the getHash function to generate the hash of the block to see if they are the same. 
            // It also goes to the previous block and retrieves its hash value and checks that with the previous hash stored in the current block to make sure they're the same. 
            if (
            	currentBlock.hash !== Block.getHash(currentBlock) || prevBlock.hash !== currentBlock.prevHash 	
			) {
                return false; //if either of the checks lead to hashes that arent equal, false is returned to inform that the chain is invalid
            }
        }

        return true; //if in both checks the hashes are equal, true is returned to inform tha the chain is valid
    }



}

module.exports = Blockchain;

