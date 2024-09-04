/**********************************Light Node ******************************************************
 * The Light Node is split into 3 parts:
 *  
 * Server on port 3001 
 * Websocket on port 4000
 * Sql Database
 * 
 * The Server handles request from the Client Server :
 * 
 * Authenticate - User name and password are checked with the SQL database.
 *
 * Register     - Because there is no simple way to store a key pair,the key pair will
 *                have to be generated each time a transaction is created from a stored value. 
 *                This is achieved by first generating a totally random value for a seed by 
 *                generating a key pair and using the private key part. The hex value of the 
 *                private key is then hashed and the private/public keys plus the key pair are 
 *                discarded. A useable key pair is now generated from the hashed value. So now 
 *                the public key is extracted from the usable key pair. New user is checked for
 *                uniqueness and the password must be over 7 characters.
 *                Then the username,password,public key, and the seed is entered on to the SQL
 *                database. The seed could be used to generated the key pair directly but as 
 *                this is stored on the SQL database under the heading private key it gives
 *                some added security.
 *  
 * getUsers     - Request for all users on SQL database.
 * 
 * send_Message - From the users SQL records the public keys of the "To: From:" users,  
 *                are obtained and combined with the text message.    
 *                The signature is create by using the seed (of the sender) to generate a   
 *                key pair which is used to sign the transaction and forward the completed 
 *                transaction to the Service Node.
 *  
 * The websocket connect to the Service Node:
 * 
 * message      - The block received form the Service Node has the text message extracted 
 *                from it and used to identify the "to: from:". With this a chatroom  
 *                destination is worked out and the text massage is sent to the chatroom. 
 *                 
 * The SQL database handles request for users records and stores user records.      
 */


// crypto and EC is used for generating keypair.
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
let EC = require("elliptic").ec, ec = new EC("secp256k1");
const Transaction = require("./transaction");      // Transaction definitions
const express = require("express");                // Express Server setup
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require('mysql');                     // SQl database
const bcrypt = require('bcrypt');                   // used to hash passwords
let username = "";
let passWord = "";
let lastMessage = "";
let tempMessage = "";

const connectiondb = mysql.createConnection({      // Setup SQL database connection
  host: 'localhost',
  user: 'root',
  password: 'global20',
  database: 'nodelogin'
});

app.use(cors());                                  // setup for connection to Light Node

const server = http.createServer(app);

const WebSocket = require('ws');

const io = new Server(server, {
  cors: {
    methods: ["GET", "POST"],
  },
});

const ws = new WebSocket("ws://localhost:4000");   // setup connection to Service Node

const PEER = ["ws://localhost:4000"];
let strtext = " ";
let PEERSOCKET = [];     // only used for a multi node network


ws.onopen = function (e) {
  console.log(' Connected to Service Node');
  io.on("connection", (socket) => {
    socket.on("authenticate", (username, passWord) => {    // Received from Client server
      console.log(`User with ID: ${username} `);
      connectiondb.query('SELECT * FROM nodelogin.accounts WHERE BINARY username = ? ', [username], async function (error, results, fields) {
        if (error) throw error;     // If there is an issue with the query, output the error
        if (results.length > 0) {                // If the user account exists
          if (await bcrypt.compare(passWord, results[0].password)) { // compare password with hashed password
            socket.emit("authenticated", true);  // send true to Client Server
          } else {
            socket.emit("authenticated", null);  // send false to Client Server
          }
        } else {
          socket.emit("authenticated", null);    // send false to Client Server if SQL error
        }
      });
    });

    socket.on("Register", (username, passWord) => {       // Received from Client server
      console.log(`Register: ${username} password:`);
      connectiondb.query('SELECT * FROM nodelogin.accounts WHERE username = ? ', [username], async function (error, results, fields) {
        if (error) throw error;     // If there is an issue with the query, output the error
        if (results.length > 0) {                // If the user exists
          socket.emit("Register", false);  // send false to Client Server
        }
        else {
          const keyPairTemp = ec.genKeyPair();       // just used to generate a totally random value
          const seed = keyPairTemp.getPrivate('hex') // get hex value for seed
          let secret = crypto.createHash('sha256').update(seed).digest('hex'); // hash seed
          const keyPair = ec.keyFromPrivate(secret, "hex"); // This is the keyPair we will use
          const publicKey = keyPair.getPublic("hex"); // This is the users public key (address)
          const hashedPassword = await bcrypt.hash(passWord, 10); //hash password to store in SQL
          connectiondb.query( // store new user on SQL database
            "INSERT INTO nodelogin.accounts(username,password,public_key,private_key) VALUES (?,?,?,?)",
            [username, hashedPassword, publicKey, seed],
            (err, result) => {
              console.log(err);
            });

          socket.emit("Register", true); // send to Client Server
        };
      });
    });
    socket.on("getUsers", (username) => {  // Received from Client server
      // console.log(`getUsers: `);
      connectiondb.query('SELECT username FROM nodelogin.accounts ', function (error, results, fields) {
        if (error) throw error;                     // If there is an issue with the query, output the error
        if (results.length > 0) {                // If the account exists
          socket.emit("getUsers", results);  // send user list to Client Server
        }
        else {
          socket.emit("getUsers", null);
        };
      });
    });

    socket.on("join_room", (data) => { // Received request to join chatroom from Client server
      socket.join(data);               // create chatroom
    });

    socket.on("TYPE_REQUEST_CHAIN", (data) => { // Received request to get history from Client server
      sendMessage(produceMessage("TYPE_REQUEST_CHAIN", data)); // data is to: from:
    });

    socket.on("send_message", (data) => {
      console.log('Recieved message', data);
      // get the from: user record 
      connectiondb.query('SELECT * FROM nodelogin.accounts WHERE username = ?', [data.from], function (error, results, fields) {
        if (error) throw error;      // If there is an issue with the query, output the error
        if (results.length > 0) {                // If the account exists
          // from user record use the private key (seed) to get a hashed value
          let secret = crypto.createHash('sha256').update(results[0].private_key).digest('hex');
          // now use the hashed seed to re-generate the original key pair
          const keyPair = ec.keyFromPrivate(secret, "hex");
          const public_key = results[0].public_key;  // get public key from SQL
          connectiondb.query('SELECT * FROM nodelogin.accounts WHERE username = ?', [data.to], function (error, results1, fields) {
            if (error) throw error;  // If there is an issue with the query, output the error
            if (results1.length > 0) {    // If the account exists
              // now create new transaction out of the obtained values
              const clientTransaction = new Transaction(public_key, results1[0].public_key, data);
              console.log("Transaction created: ", clientTransaction)
              clientTransaction.sign(keyPair);  // sign transaction
              // send transaction to Service Node
              sendMessage(produceMessage("TYPE_CREATE_TRANSACTION", clientTransaction));
            }
          }
          )
        };
      });
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected", socket.id);
    });
    // received from Service node
    ws.on('message', function incoming(message) { //receiving the from to message to then create the transaction
      let _message = JSON.parse(message);
      //console.log(_message.type);
      const transaction = _message.data;
      switch (_message.type) {
        case "TYPE_HANDSHAKE":
          // not used
          break;
        case "TYPE_SEND_CHAIN":  // response to request chain history
        case "TYPE_REPLACE_CHAIN": //this is when a new block added to chain
          if (Transaction.isValid(transaction.data[0])) { // check transaction signature
            const stringify = JSON.parse(JSON.stringify(transaction.data)); // convert to string
            strtext = stringify[0]["textMessage"];    // get textmessage
            const to = strtext.to;                    // get to:
            const from = strtext.from;                // get from:
            // work out chatroom with "to: from:"
            if (to > from) {
              let room = to.concat(from);
              socket.to(room).emit("receive_message", strtext); // send to relevant chatrooom
            } else {
              let room = from.concat(to);
              socket.to(room).emit("receive_message", strtext); // send to relevant chatrooom
            }
          }
          break;


      }

    });
  });
};




function produceMessage(type, data) {
  return { type, data }
}

function sendMessage(message) {
  console.log("Sending Message", message)
  ws.send(JSON.stringify(message)); // send to Service Node
}



server.listen(3001,);    // setup server listening port 
// Setup server to listen on port and a DDNS address this so the web browser of the client
// can  a remote Light Node 
// ******************************* This must be setup for remote working ****************

socket = io.listen(server, { origins: "http://192.168.0.41:3001" }); 

// ***************************************************************************************
console.log("SERVER RUNNING");


