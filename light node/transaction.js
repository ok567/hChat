/************************************* Transaction **********************************
* This defines the transaction fields and has two function:
* sign (keypair)         - uses the key pair to generate a signature of the transaction 
*                          with elliptic curve and crypto 
* isValid (transaction)  - recalculate the signature and check this matches with transaction 
*                          signature
*/
  
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");

class Transaction { 
    constructor(from, to, textMessage) {
        this.from = from;
        this.to = to;
        this.textMessage = textMessage;
        
    } 
 
    sign(keyPair) { 
            // The signature is generated by signing the hash which contains the sender's address, the recipient's address and timestamp.
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.textMessage), "base64").toDER("hex"); 
       // } 
    } 
 
    static isValid(tx) { // tx meaning transaction
        //console.log("Attempting to validate")
        return (
            tx.from && //check to see if the from address exists
            tx.to && //check to see if the to address exists
            tx.textMessage && // check to see if there is a textmessage  
            // now check that calculated signature is the same the transaction signature 
            ec.keyFromPublic(tx.from, "hex").verify(SHA256(tx.from + tx.to + tx.textMessage), tx.signature) 
        );
    }
}

module.exports = Transaction;
