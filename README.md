# hChat

hChat is a decentralized messaging application built on a custom blockchain developed from scratch using JavaScript. The application utilizes JavaScript-based smart contracts to facilitate secure and private communication between users. This project demonstrates the potential of custom blockchain solutions for decentralized applications (dApps).

## Features

- **Custom Blockchain**: A lightweight blockchain developed entirely in JavaScript, tailored for messaging.
- **JavaScript Smart Contracts**: Implements smart contracts in JavaScript to automate and secure messaging interactions.
- **Decentralized Messaging**: Ensures messages are securely stored on a distributed ledger.
- **End-to-End Encryption**: Messages are encrypted to ensure privacy between users.
- **User Authentication**: Secure user login and identity verification using a user crendential database.

## Usage

1. **Register/Login**: Create a new account or log in using your existing credentials.
 
![Login](https://github.com/user-attachments/assets/b70f57fd-8790-43eb-8c54-c11e190974e0)
![Registration](https://github.com/user-attachments/assets/04d70228-0ff4-4212-bf56-ec8c076d7687)

2. **Start a Chat**: Begin a new conversation by selecting a contact and entering the chatroom.

![listofchatroom](https://github.com/user-attachments/assets/6f735c76-d2da-4e4d-9ce8-e9b3a101828e)
![chatrooms](https://github.com/user-attachments/assets/2461e2fa-d2a2-44ff-831c-2dfd274d6ac7)

3. **Send Messages**: Type and send your message. Messages are encrypted and stored on the custom blockchain.

![sendingmessage](https://github.com/user-attachments/assets/a6a904d6-0530-490e-8e1c-aca42607b06b)

4. **View Conversations**: Access your chat history securely at any time.


## Technology Stack

- **Backend**: Node.js, Websocket.js
- **Frontend**: React.js, HTML, CSS
- **Blockchain**: Custom blockchain developed in JavaScript
- **Smart Contracts**: JavaScript
- **Database**: SQL

## Network Architecture

# Light node
The light node is designed as the gateway between the client-server and the service node. It is able to process requests and messages from the client-server and action them. This is achieved in the case of login and registration by accessing the SQL database to confirm the authenticity and in the case of text messages to process them into a transaction and forward it to the service node. This solicits a response from the service node and a similar form of a smart contract will be applied to distribute messages to the relevant users.

# Service Node
The service node holds the blockchain. The service node listens out for any transactions from the light node and adds it to a transaction pool. This pool is interrogated by a mining service and processed, resulting in a block, holding the transaction, being added to the blockchain, and then sent back to the light node. 

# Client Server
The client server has bidirectional communication to and from the web interface and the light node so that different users and devices can connect to the client server for its web pages such as login, registration, main menu, and chatrooms. This also enable users to connect and communicate back and forth to the light node, which sends requests and receives responses to and from the SQL database for logging in and registration and the service node for chatting on the web interface.

# SQL Database
A SQL server runs on the network, which stores a user database. The light node connects to the SQL database and requests user information as required.


![BIGGER UML of Network drawio](https://github.com/user-attachments/assets/903dba53-5613-4fb9-b9a3-4f9160b82855)

