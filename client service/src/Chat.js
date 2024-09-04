/********************************* Login App **************************************
 * React Server is split into processing and display. The processing part uses 
 * "userState" this allows variables to be used in the HTML and useEffect for response 
 * from requests to the Light Node.
 * The display runs HTML and displays chat message. There is a "send" button 
 * to forward the message 
 */
import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";  // used to keep messages rolling up
let listOfConv = [];      // temp stores
let temp_mess = [];       // temp stores

function Chat({ socket, fromUser, username  }) { // from MaimMenu
  const [currentMessage, setCurrentMessage] = useState(""); // a store for current message
  const [messageList, setMessageList] = useState([]);       // a store for list of messages
  const [cancelled, setCancel] = useState(false);           // cancel flag
  const [start, setStart] = useState(true);                 // start flag
  
  if (start) {
    const fromTo = [fromUser, username];                   // the desired conversation requested
    socket.emit("TYPE_REQUEST_CHAIN", fromTo);             // send to light Node
    console.log("sending TYPE_REQUEST_CHAIN");
    setStart(false);                                       // finished getting history
  }
  const Cancel = () => {                                  // cancel button
    console.log(" Registration cancelled ");
    setCancel(true);                                       // flag cancel
  };

  const sendMessage = async () => {                       // compose textmessage
    if (currentMessage !== "") {                          // check if no current message
      const messageData = {                               // to: from: msg time
        from: fromUser,
        to: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes() +
          ":" +
          new Date(Date.now()).getSeconds(),
      };

      await socket.emit("send_message", messageData);    // send to Light Node
      setCurrentMessage("");
      
    }
  };

  useEffect(() => {
    // when a message is received it is checked to see if it has already be received and 
    // if so it is not displayed this is required as when a user request a history it is 
    // downloaded to the chatroom then when to other user request his history it is 
    // downloaded again so the first user receives it twice.
    socket.off("receive_message").on("receive_message", (data) => { // response from Light Node
             let display = true;       // flag it as new
        temp_mess = data;         // get message
        listOfConv.map((messageContent) => {  // get each message from list
          
          if ((temp_mess.message === messageContent.message) // compare each part of message
            && (temp_mess.from === messageContent.from)
            && (temp_mess.to === messageContent.to) 
            && (temp_mess.time === messageContent.time)){
            display = false;                                 // if match flag no display
          }else{
          }
          
        });
        if (display) {                                   // must be new message
          setMessageList((list) => [...list, data]);     // store list of messages for html
          listOfConv.push(data);                         // shadow list
         // lastMessage = data;                            // store new message as last message
        }
     });
  
  }, []);
  if (cancelled) {
    window.location.reload(false);                       // reload and bak to login
    return;
  }
  /* In this HTML each message in the message list (messageContent) is checked to see
  *  if it is the user who sent it and if so it put it in css class "you" which then is displays 
  *  it, on the right of the screen in green. If it is from the other user it is put into class 
  * "other" and displayed on the left of the screen in blue. Then react function ScrollToBottom then 
  * takes place. Text can be sent ether by the arrow or the "enter" key.
  */
  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat User {fromUser} to {username}</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent) => {
            return (
              <div
                className="message"
                id={username === messageContent.to ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="to">{messageContent.from}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
      <div className="chat-footer-control">
        <button onClick={Cancel}>Cancel_chat</button></div>
    </div>
  );
}

export default Chat;
