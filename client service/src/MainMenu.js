/********************************* MainMenu App **************************************
 * React Server is split into processing and display. The processing part uses 
 * "userState" this allows variables to be used in the HTML and useEffect for response 
 * from requests to the Light Node.
 * The display runs HTML and displays a list of all users on the SQL database
 * each having a radio button beside them. There is a "select" button to confirm
 * the choice of user
 * 
 */
import "./App.css";
import { useEffect, useState } from "react";
import Chat from "./Chat";

function MainMenu({ socket, fromUser, public_key }) { // from login page
  console.log("from user");
  console.log(fromUser);
  const [start, setStart] = useState(true);   // flag to run once
  
  if (start) {
    socket.emit("getUsers");   // get user list from SQL database via Light node  
    setStart(false);           // don't run again
  }

  const [username, setUsername] = useState(null);  // a store for username
  const [userList, setUserList] = useState([]);    // a store for list of users
  const [selectUser, setSelectUser] = useState(false); // flag user selected
  const [cancelled, setCancel] = useState(false);      // cancel flag
  const handleChange = e => { setUsername(e.target.value); } // handles user name selected

  const Cancel = () => {   // cancel button clicked
    console.log(" Selection cancelled ");
    setCancel(true);  // flag cancel
  };

  

  const SelectedUser = () => {  // selected button
    if (username) {             // for user selected
      console.log(" Select called");
     // Users have to join a room to hold a conversation. In order that the two user are 
     // put in the same room their names are compared and who ever is the greater, their 
     // name is used first, and combined with the other user name i.e if Jack and John 
     // want to talk then they would be put into room JohnJack (John being greater because
     // J=J and "o" is hex 6f and "a" is only hex 61 therefore "o" is greater). This ensure 
     // that both user are always placed in the same no matter who connects first. 
      if (username > fromUser) {    // to: greater than from:
        let room = username.concat(fromUser); // that would be username-fromUSER
        console.log(room);
        socket.emit("join_room", room);       // join that room
      } else {
        let room = fromUser.concat(username); // that would be fromUSER-username
        console.log(room);
        socket.emit("join_room", room);       // join that room
      }

      setSelectUser(true);   // flag room chosen  and selected
    }
  };


  useEffect(() => {
    socket.on("getUsers", (data) => {   // response back from Light node with user list
      setUserList((list) => data);      // store for use in HTML
    });

  });
  
  if (cancelled) {                      // cancel button
    window.location.reload(false);      // reload and back to login
    return;
  }
  return (

    // if selected jump to chat other wise display list using map
    <div className="chat-window">
      {selectUser ? (< Chat socket={socket} fromUser={fromUser} username={username} public_key={public_key} />) : (
        <><div className="chat-header">
          <div id="main">
          <p>Live Chat User {fromUser}</p>
          <button onClick={Cancel}>x</button>
          </div>
        </div><div className="chat-body">
            <div className="select">
              {userList.map((x, i) => <label key={i}>
                <input
                  type="radio"
                  name="gender"
                  value={x.username}
                  onChange={handleChange} /> {x.username};
                <br></br>
              </label>)}
            </div>
          </div><div className="chat-footer">
            <div>Selected User: {username}</div>
            <button onClick={SelectedUser}>Select</button>
          </div></>)}
          <div className="chat-footer-control">
            </div>
    </div>
  )



}

export default MainMenu;
