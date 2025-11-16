import {auth} from "../config/firebase";
import {db} from "../config/firebase";

import {createUserWithEmailAndPassword, signInWithEmailAndPassword,signOut, onAuthStateChanged} from "firebase/auth";
import React, { useEffect, useState, useMemo, use } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import ReactPDF from '@react-pdf/renderer';


import {getDocs, collection, doc, addDoc, deleteDoc, arrayUnion, 
    updateDoc, query, where, orderBy, serverTimestamp} from "firebase/firestore"

 const Compliance = () => {

    
    const [user, setUser] = useState(null);
    
    const [userid, setUserId] = useState (null);

    const [quocient, setQuocient] = useState (1);

    const [medicineList, setMedicineList] = useState([]);
   
    const navigate = useNavigate();

    onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
               
                setUserId(user.uid);        
            } else {
                console.log("No user");
            }
            });

    useEffect(() => {
              if (userid){
                
                  getMissingMedicines(userid);
                  
              }
          }, [user]);


const getMissingMedicines = async (userID) => {
  // 1️⃣ Get required list

  const voyTypeRef = collection(db, "medicine", userID, "info");
  
  const voySnapshot = await getDocs(voyTypeRef);

  const requiredVoyageList = voySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  const crewOB=requiredVoyageList[0].crew;
  const quocient= Math.ceil(crewOB/10);
  console.log("Quocient:", quocient);
  setQuocient (quocient);

const string = "list" + requiredVoyageList[0].voyageType;


  const reqCollectionRef = collection(db, string);
  const reqQuery = query(reqCollectionRef, orderBy("name", "asc"));
  const reqSnapshot = await getDocs(reqQuery);

  const requiredList = reqSnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  // 2️⃣ Get actual stock
  const stockCollectionRef = collection(db, "medicine", userID, "stock");
  const stockQuery = query(stockCollectionRef, orderBy("name", "asc"));
  const stockSnapshot = await getDocs(stockQuery);

  const stockList = stockSnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  // 3️⃣ Compare — find required meds that are missing from stock
  const missing = requiredList.filter((req) => {
    // If req.name is not an array, treat as missing
    if (!Array.isArray(req.name) || req.name.length === 0) return true;

    // Check if any name in req.name exists in stock with sufficient quantity
    const foundInStock = stockList.some((stock) => {
      if (!stock.name || typeof stock.name !== "string") return false;

      return req.name.some(
        (name) =>
          typeof name === "string" &&
          stock.destroyed!==true&&
          stock.name.toLowerCase() === name.toLowerCase() &&
          stock.quantity >= (req.perTen ? req.qty * quocient : req.qty)
      );
    });

    // If none of the names match in stock, this required item is missing
    return !foundInStock;
  });

  console.log("Required Medicines:", requiredList);
  console.log("Current Stock:", stockList);
  console.log("Missing Medicines:", missing);
  setMedicineList(missing);
};

        return (
          
          
          <><h1 className="disposal-titles">Missing Medicines</h1>
          <div>
            
              <table>
                <thead>
                  <tr>
                    <th scope="col"><span className="th-text">Publication</span></th>
                    <th scope="col"><span className="th-text">Name</span></th>

                    <th scope="col"><span className="th-text">Quantity</span></th>

                  </tr>
                </thead>

                {medicineList.map((item) => (
                  <tbody key={item.id}>
                    <tr>
                      <td>{item.mfag ? "MFAG" : "IMGS"}</td>
                      <td>{item.name[0]}</td>
                      <td>{item.perTen ? (item.qty * quocient) : item.qty}</td>
                    </tr>
                  </tbody>
                ))}

              </table>
            </div>

            </>
        );

            };
            export default Compliance;
          
