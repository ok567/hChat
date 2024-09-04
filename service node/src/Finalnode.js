/********************************************* Service Node **************************************
 * The Service Node functions as a Blockchain and Miner. Initially the Genesis Block is created 
 * then goes into a mining loop awaiting a transaction in the pool. When a transaction is received 
 * from the Light Node its signature is check then placed in the transaction pool. The mining loop 
 * takes this transaction and creates a new block with next index, timestamp, transaction and current 
 * difficulty. The block from here is mined with the supplied difficulty and stored on the blockchain.
 * This triggers the newly created block to be sent to the Light node. An additionally function is 
 * that the Light Node can request a "TYPE_REQUEST_CHAIN" with "To: From:" parameter. The Service 
 * Node then responds with all blocks related to a conversation between "to: from:" and "from: to:". 
*/
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const WS = require("ws");
const { fork } = require("child_process");        // Used for mining 
const Block = require("./block");                 // Block definitions
const Transaction = require("./transaction");      
const Blockchain = require("./blockchain");
const hChain = new Blockchain();                  // Creating the blockchain with genesis block
const PORT = 4000;                                // Service Node port 
//const PEERS = [];                               //*********** Peer Nodes ************
const MY_ADDRESS = "ws://localhost:4000";         // only need for multi node working
const ENABLE_MINING = process.env.ENABLE_MINING === "true" ? true : false;   //Flag for mining
const server = new WS.Server({ port: PORT });     // Setup WS server on port 4000

//  "opened" for holding both sockets and addresses
// "connected" is for addresses only used in multi node working.
// let opened = [], connected = []; //  ?????

let tempChain = new Blockchain();                 // temp store of a chain block
let miner = fork(`${__dirname}/miner.js`);        // fork to mining 
let mined = false;                                // Flag to block has been mined

console.log("Listening on PORT", PORT);


// THE CONNECTION LISTENER
server.on("connection", async (socket, req) => { // Received message from Light Node
    // Listens for messages
    socket.on("message", message => {
        // Parse the message from a JSON into an object 
        const _message = JSON.parse(message);
        switch (_message.type) {                 // Type of message    
            case "TYPE_HANDSHAKE":
            //  nodes.forEach(node => connect(node)) // used for multi node working.

            case "TYPE_CREATE_TRANSACTION": //constructs the transaction from  received  from Light Node
                const transactionRx = _message.data;    // get transaction
                if (Transaction.isValid(transactionRx)) {  // check if signature is valid   
                    hChain.addTransaction(transactionRx); //adding the transaction to the transaction pool read to be minned
                }
                break;

            

            case "TYPE_REQUEST_CHAIN": // Received from Light Node with "To:"" From:" 
                                       // when user enters chat room.
                hChain.chain.forEach(function (element, i) { // Search block chain for matching 
                    if (i > 0) {                             // To: From or From: To:
                        const transaction = element.data;    // get transaction from block.
                        if (((transaction[0].textMessage.from == _message.data[0])
                            || (transaction[0].textMessage.from == _message.data[1]))
                            && ((transaction[0].textMessage.to == _message.data[0])
                                || (transaction[0].textMessage.to == _message.data[1]))) {
                            // Sent to Ligh Node on each match.
                            socket.send(JSON.stringify(produceMessage("TYPE_SEND_CHAIN", element)));
                            console.log("Conversation", transaction[0].textMessage);
                        }
                    }
                });
                break;
                case "TYPE_REPLACE_CHAIN": // only used in a multi node distributed network
                // "TYPE_REPLACE_CHAIN" is sent when someone wants to submit a new block.
                //  Message body must contain the new block and the new difficulty.
                const newBlock = _message.data;
                console.log("This is the newBlock: ", newBlock)
                // Only continue checking the block if its prevHash is not the same as the latest block's hash.
                // This is because the block sent to us is likely duplicated or from a node that has lost and should be discarded.
                if (newBlock.prevHash !== hChain.getLastBlock().prevHash) {
                    console.log("first yes")
                    // Check if the block is valid or not, if yes, we will push it to the chain, update the difficulty, chain state and the transaction pool.
                    if (
                        SHA256(newBlock.blockNumber.toString() + hChain.getLastBlock().hash + newBlock.timestamp + JSON.stringify(newBlock.data) + newBlock.difficulty + newBlock.nonce) === newBlock.hash &&
                        newBlock.hash.startsWith(Array(hChain.difficulty + 1).join("0")) && //diff 1?
                        hChain.getLastBlock().hash === newBlock.prevHash &&
                        //newBlock.blockNumber - 1 === hChain.getLastBlock().blockNumber &&
                        newBlock.difficulty === hChain.difficulty
                    ) {
                        console.log("LOG :: New block received.");
                        hChain.chain.push(newBlock);
                        // Update the new transaction pool (remove all the transactions that are no longer valid).
                        hChain.transactions = [];
                        // If mining is enabled, we will set mined to true, informing that another node has mined before us.
                        if (ENABLE_MINING) {
                            console.log("MINING ENABLED?")
                            mined = true;
                            // Stop the worker thread
                            worker.kill();
                            worker = fork(`${__dirname}/worker.js`);
                        }
                        // Send the block to other nodes
                        //sendMessage(produceMessage("TYPE_REPLACE_CHAIN", newBlock)); 
                        // send to Service Node
                        socket.send(JSON.stringify(produceMessage("TYPE_REPLACE_CHAIN", newBlock)));
                        
                    }
                }
                break;

            case "TYPE_SEND_CHAIN":   // Only used in a multi node distributed network.
                const { block, finished } = _message.data;
                if (!finished) {
                    tempChain.chain.push(block);
                } else {
                    tempChain.chain.push(block);
                    if (Blockchain.isValid(tempChain)) {
                        hChain.chain = tempChain.chain;
                    }
                    tempChain = new Blockchain();
                }
                break;
        }
    })
    //  add this one line for error handling:
    //process.on("uncaughtException", err => console.log(err));

    function mine() {
        // Create a new block using previous blocks hash and the transaction from the pool
        // block = chain block number + time stamp + transaction + difficulty. 
        const block = new Block(hChain.chain.length + 1, Date.now(), hChain.transactions, hChain.difficulty);
        // Now top and tail with hash. 
        block.prevHash = hChain.getLastBlock().hash;
        block.hash = Block.getHash(block);

        // Mine the block.
        mine(block, hChain.difficulty)
            .then(result => {
                // If the block is not mined before, we will add it to our chain and send it to Light Node.
                if (!mined) {
                    if (result.blockNumber % 100 === 0) { // Every 100 blocks 
                        // If time to mine block is increasing then decrease difficulty 
                        // or if decreasing the increase difficulty.
                        hChain.difficulty += Date.now() - parseInt(hChain.getLastBlock().timestamp) < hChain.blockTime ? 1 : -1;
                    }
                    hChain.chain.push(Object.freeze(result)); // Put new block on chain.
                    hChain.transactions = [];      // Clear transaction pool.
                    // Send to Light node
                    socket.send(JSON.stringify(produceMessage("TYPE_REPLACE_CHAIN", hChain.getLastBlock())));
                    console.log(hChain.getLastBlock());
                } else {
                    mined = false;
                }
                
                //const stringify = JSON.parse(JSON.stringify(block.data));
                // Re-create the miner thread
                miner.kill();

                miner = fork(`${__dirname}/miner.js`);
            })
            .catch(err => console.log(err));
            // Send a message to the miner thread, asking it to mine with level of difficulty.
        function mine(block, difficulty) {
            return new Promise((resolve, reject) => { // Setup Returned mined block.
                miner.addListener("message", message => resolve(message.result));
                miner.send({
                    type: "MINE",
                    data: [block, difficulty]
                });
            });
        }
    }


    function loopMine() {
        let mining = true;
        if (mining || hChain.transactions.length !== 0) { //checking if there are any transactions to mine
            for (let i = 0; i < hChain.transactions.length; i++) { //if so,it goes through each one
                console.log("MINING!") 
                mining = false;  // no longer mining
                mine(); //mining transaction
                console.log("WAITING FOR SOMEONE TO MINE TRANSACTION") //Nothing to do 
            }
        }
        setTimeout(loopMine, 2000); //every 1 seconds, it reruns the function to check to see if 
        // there have been any new transactions sent to the pool
    }

    loopMine();
    //PEERS.forEach(peer => connect(peer)); // Used for inter node comms
});





function produceMessage(type, data) { // Combine message type and message 
    return { type, data }
}

function sendMessage(message) {  // only used in a multi node distributed network
    console.log("Sending Message", message)
    opened.forEach(node => {
        node.socket.send(JSON.stringify(message));
    });
}
// THE CONNECT TO OTHER NODES FUNCTION (Not implemented)
async function connect(address) {
    // We will only connect to the node if we haven't, and we should not be able to connect to ourself
    if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
        const socket = new WS(address, {
            'reconnection': true,
            'reconnectionDelay': 1000,
            'reconnectionDelayMax': 5000,
            'reconnectionAttempts': 5
        });
        console.log("New Node Connection", address);
        socket.on('error', function (err) {
            console.error('error!');
            //console.error(e.code);
        });
        socket.on("open", () => {
            // I will use the spread operator to include our connected nodes' addresses into the message's body and send it.
            socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected])));
            console.log("sending  TYPE_HANDSHAKE");
            // We should give other nodes' this one's address and ask them to connect.
            opened.forEach(node => node.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))));

            // If "opened" already contained the address, we will not push.
            if (!opened.find(peer => peer.address === address) && address !== MY_ADDRESS) {
                opened.push({ socket, address });
                //console.log("socket & address",socket, address);
            }

            // If "connected" already contained the address, we will not push.
            if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
                connected.push(address);
            }

            // Two upper if statements exist because of the problem of asynchronous codes. Since they are running
            // concurrently, the first if statement can be passed easily, so there will be duplications.
        });

        socket.on('connect_error', function (data) {
            console.log('connection_error');
        });

        // When they disconnect, we must remove them from our connected list.
        socket.on("close", () => {
            opened.splice(connected.indexOf(address), 1);
            connected.splice(connected.indexOf(address), 1);
        });
    }
}













