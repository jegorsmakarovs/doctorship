import {auth} from "../config/firebase";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword,signOut, onAuthStateChanged} from "firebase/auth";
import {db} from "../config/firebase";
import {getDocs, collection, doc, addDoc, deleteDoc, arrayUnion, 
    updateDoc, query, orderBy, serverTimestamp} from "firebase/firestore"
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { RadioGroup } from "@headlessui/react";

export const Auth = () => {

    const [email, setEmail] = useState(""); // State to hold email input
    const [password, setPassword] = useState(""); // State to hold password input
    const location = useLocation();
     let { login } = location.state || {};
    const [user, setUser] = useState(null);
    const [shipName, setShipName] = useState("Ever Given");
    const [IMO, setIMO] = useState("12345678");
    const [Crew, setCrew] = useState(0);
     const [voyageType, setVoyageType] = useState("A");


    const [loading, setLoading] = useState(true);
    const [userid, setUserId] = useState (null);
        
    const navigate = useNavigate();

    onAuthStateChanged(auth, (user) => {
        if (user) {
            setUser(user);
            setLoading(false);
            setUserId(user.uid);        
        } else {
            console.log("No user");
        }
        });
    
    // Function to handle user registration
    const signIn = async () => {
        try {
        const cred= await createUserWithEmailAndPassword(auth, email, password);
        const userid = cred.user.uid;
         const infoCollectionRef =  collection (db, "medicine", userid, "info")
                try{
                    const docRef= await addDoc(infoCollectionRef, {
                        shipName: shipName,
                        IMO: IMO,
                        crew:Crew,
                        voyageType: voyageType,
                    });
                } catch (err) {
                    console.error(err);
                    };
        navigate("/");
        } catch (err) {
            console.error(err);
        }
    };

    // Function to handle user login
    const logIn = async () => {
        try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
        } catch (err) {
            console.error(err);
        }
    };
    
    // Function to handle user sign-out
    const logout = async () => {
        try {
        await signOut(auth);
        navigate("/");
        } catch (err) {
            console.error(err);
        }
    };

     const setLoginTrue = () => {
    navigate(location.pathname, {
      state: { ...location.state, login: true },
    });
  };

  const setLoginFalse = () => {
    navigate(location.pathname, {
      state: { ...location.state, login: false },
    });
  };

    // If user is logged in, show welcome message and logout button
    if (user && !loading) {
        return (
        <div className = "loginRegistration">
            <h1>Welcome, {user.email}</h1>
            <button onClick={logout}>Log out</button>
        </div>
    );
    }
    // If no user is logged in, show login and registration form
    else {
        return (
            login ? (
                <div className="backgr">
                <div className="loginRegistration">
                    <h2 onClick={() => navigate('/')}>DOCTORSHIP</h2>
                    
                    <input
                    id="regInput"
                        type="email"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        id="regInput"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    
                    <button onClick={logIn}>Login</button>
                    <a href="" onClick={setLoginFalse}>Create an account</a>
                </div>
                </div>
            ) : (
             <div className="backgr">
            <div className="loginRegistration">
                <h2 onClick={() => navigate('/')}>DOCTORSHIP</h2>
                    <input
                        type="email"
                        id="regInput"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        id="regInput"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="name"
                        id="regInput"
                        placeholder="Ship's Name"
                        onChange={(e) => setShipName(e.target.value)}
                    />
                    <input
                        type="name"
                        id="regInput"
                        placeholder="IMO Number"
                        onChange={(e) => setIMO(e.target.value)}
                    />
                    <label htmlFor="crewInput">Number of crew on board</label>
                    <input
                    value={Crew}
                        type="number"
                        id="regInput"
                        placeholder="Crew on Board"
                        onChange={(e) => setCrew(Number(e.target.value))}
                    />
                    <small className="hint-text">
                    Include officers, ratings, and all personnel currently onboard.
                    </small>
                    <fieldset>
  <legend>Select type of voyages:</legend>
  <div className="radio-group">
    <label className="radio-item">
      <input type="radio" name="voyageType" value="A"  onChange={(e) => setVoyageType(e.target.value)}/>
      Ocean going vessel
    </label>
    <label className="radio-item">
      <input type="radio" name="voyageType" value="B" onChange={ (e) =>setVoyageType(e.target.value)} />
      Not more than 24 hours from port
    </label>
    <label className="radio-item">
      <input type="radio" name="voyageType" value="C" onChange={ (e) =>setVoyageType(e.target.value)} />
      Not more than 2 hours from port
    </label>
  </div>
</fieldset>
                    
                    
                    <button onClick={signIn}>Register</button>

                     <a href="" onClick={setLoginTrue}>Already have an account?</a>
                </div>
                </div>
                )
        );
    }

};
