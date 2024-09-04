/********************************* Registration **************************************
 * React Server is split into processing and display. The processing part uses 
 * "userState" this allows variables to be used in the HTML and  
 * useEffect for response from requests to the Light Node.
 * The display runs HTML and displays Registration page. There is a "Registration" button 
 * to forward the user/password. 
 */
import "./App.css";
import io from "socket.io-client";
import { useState, useEffect } from "react";
import Login from "./Login";

// ************** Setup socket io connection to remote Light Node *****************
// ******* This must match DDNS or its IP address  of the Light Node **************

const socket = io.connect("http://192.168.0.41:3001");

/************************************************************************************** */
function Registration() {
  const [username, setUsername] = useState("");           // a store for username
  const [passWord, setPassWord] = useState("");           // a store for password
  const [cancelled, setCancel] = useState(false);         // flag cancel
  const [showRegister, setRegister] = useState(false);    // flag Registration

  const Cancel = () => {
    console.log(" Registration cancelled ");
    setCancel(true);                                      // flagged cancel
  };

  const Register = () => {
    if (username !== "" && passWord !== "") {      // check if we have username and password
      if ( passWord.length > 7){                   // password must be greater than 7 chars 
      console.log(`Registering  ${username}  `);
      socket.emit("Register", username, passWord); // send to Light Node
    } else {
      document.getElementById("userName").value = "";    // clear fields
      document.getElementById("passWord").value = "";
      document.getElementById("status").style.textAlign = "center"
      document.getElementById("status").style.color = "red";

      document.getElementById("status").value = "Invalid password";  // display status
    }
    }
  };
  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
  useEffect(() => {                                   // response from Light Node
    socket.on("Register", async (data) => {           // data true/false
      console.log('Register as');
      console.log(data);
      setRegister(data);                              // set flag true/false
      
      if (!showRegister) {                            // if false Registration failed
        document.getElementById("userName").value = "";     // clear fields
        document.getElementById("passWord").value = "";
        document.getElementById("status").style.textAlign = "center"
        document.getElementById("status").style.color = "red";

        document.getElementById("status").value = "User in Use"; // display status
        await delay(1000);

        document.getElementById("status").value = "";   // clear status

      }
    });
  });
  if (cancelled) {
    return < Login />                        // if cancel return back to Login 
  }
// display Registration page
  return (
    <div className="App">
      {!showRegister ? (
        <div className="joinChatContainer">
          <h3>Registration</h3>
          <input
            type="text"
            id="userName"
            placeholder="userName.."
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <input
            type="password"
            id="passWord"
            placeholder="PassWord.."
            onChange={(event) => {
              setPassWord(event.target.value);
            }}
          />
          <button onClick={Register}>Register</button>
          <input
            type="text"
            id="status"
          />
          <button onClick={Cancel}>Cancel</button>
        </div>
      ) : (
        < Login />

      )}
    </div>
  );
}

export default Registration;
