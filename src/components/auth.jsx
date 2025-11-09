import {auth} from "../config/firebase";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword,signOut, onAuthStateChanged} from "firebase/auth";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export const Auth = () => {

    const [email, setEmail] = useState(""); // State to hold email input
    const [password, setPassword] = useState(""); // State to hold password input
    const location = useLocation();
     let { login } = location.state || {};
    const [user, setUser] = useState(null);
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
        await createUserWithEmailAndPassword(auth, email, password);
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
                        type="email"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
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
                        type="name"
                        placeholder="Name"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    
                    <button onClick={signIn}>Register</button>

                     <a href="" onClick={setLoginTrue}>Already have an account?</a>
                </div>
                </div>
                )
        );
    }

};
