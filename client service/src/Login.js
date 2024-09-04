/********************************* Login App **************************************
 * React Server is split into processing and display. The processing part uses 
 * "userState" this allows variables to be used in the HTML and useEffect for response 
 * from requests to the Light Node.

 * The display runs Html with login and password entry fields. Login and Registration
 * buttons and a Status box.
 * 
 */
import "./App.css";
import io from "socket.io-client";
import React, { useEffect, useState } from "react";
import Registration from "./Registration";
import MainMenu from "./MainMenu";

// ************** Setup socket io connection to remote Light Node *****************
// ******** This must match DDNS or its IP address  of the Light Node *************

const socket = io.connect("http://192.168.0.41:3001"); 

// ********************************************************************************

function Login() {
  const [fromUser, setfromUser] = useState(""); // the user that is login/sending 
  const [passWord, setPassWord] = useState(""); // user password
  const [authenticated, setAuthenticated] = useState(false); // if the login is successful 
  const [reg, setReg] = useState(false);  // if registration is required
  

  const authentication = () => { // send to Light Node for authentication 
    if (fromUser !== "" && passWord !== "") {
     //console.log(`User with ID: ${fromUser} password: ${passWord}`);
      socket.emit("authenticate", fromUser,passWord);
      
    }
  };

 const RegistrationEntry = () => { // flag move to registration 
         console.log(" Registration called");
         setReg(true);
 };
  useEffect(() => {
    socket.on("authenticated", (data) => { // Light Node response to authenticate
  
  
  if  (data) {
    setAuthenticated(true); // set flag  true/false
    console.log(" authenticated now");
    } else {                       // show invalid is false
    document.getElementById("userName").value = "";
    document.getElementById("passWord").value = "";
    document.getElementById("status").style.textAlign ="center"
    document.getElementById("status").style.color = "red";
     document.getElementById("status").value = "invalid";
    
  }
  });
  });

  return (
    <div className="App">
     { reg ? (
     < Registration/>    // jump to registration if flagged
     ) : (
      !authenticated ? (  // if not flagged continue to display
        <div className="joinChatContainer">
          <h3>Login</h3>
          <input
            type="text"
            id = "userName"
            placeholder="UserName.."
            onChange={(event) => {
              setfromUser(event.target.value); // store username in fromuser
            }}
          />
          <input
            type="password"
            id = "passWord"
            placeholder="PassWord.."
            onChange={(event) => {
              setPassWord(event.target.value); // store password in passWord
            }}
          />
          <button onClick={authentication}>Login</button>
          <button onClick={RegistrationEntry}>Registration</button>
          <input
            type="text"
            id = "status" 
            placeholder="status.. "
          />
         </div>
      ) : (
        
       < MainMenu socket={socket} fromUser={fromUser} / > // if authenticated jump to MainMenu
 
      )
      )
      }
    
    </div>
  );
}

export default Login;
