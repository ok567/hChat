// Miner thread's code.

const Block = require("./block");

// Listening for messages from the main process.
process.on("message", message => {
    if (message.type === "MINE") {
        // When the "MINE" message is received, the thread should be mining by incrementing the nonce value until a preferable hash is met.
       // console.log("MINER.JS CURRENTLY MINING!!")
        const block = message.data[0];
        const difficulty = message.data[1];

        for (;;) { // 
            // We will loop until the hash has "4+difficulty" starting zeros.
            if (block.hash.startsWith("0000" + Array(difficulty).join("0"))) {
                process.send({ result: block });

                break;
            }
            
            block.nonce++;                         // increment nonce
            block.hash = Block.getHash(block);     // calculate block hash with new nonce

        }
    }
});

//if (block.hash.startsWith(Array(difficulty + 1).join("0"))) {