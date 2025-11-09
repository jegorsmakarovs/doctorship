import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {auth} from "../config/firebase";
import {db} from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {getDocs, getDoc, collection, doc, addDoc, deleteDoc, updateDoc} from "firebase/firestore"
import "./ComponentCSS/Item.css"
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

const Item = () => {

    

    const navigate = useNavigate();
    const currentDate = new Date().toLocaleDateString('en-US');
    const location = useLocation();
    const { id } = location.state || {};
    const [user, setUser] = useState(null);
    const [userid, setUserId] = useState (null);

    const [medicineName, setMedicineName] = useState("");
    const [medicineDosage, setMedicineDosage] = useState("");
    const [medicineExpiryDate, setMedicineExpiryDate] = useState(new Date().toLocaleDateString('en-US'));
    const [medicineLocation, setMedicineLocation] = useState("");
    const [medicineQuantity, setMedicineQuantity] = useState(null);
    const [medicineTabletQuantity, setMedicineTabletQuantity] = useState(1);
    const [typeMedicine, setTypeMedicine] = useState('None');
    
    const [takenMedicine, setTakenMedicine] = useState(0);

    function formatDate(string){
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(string).toLocaleDateString('en-GB',options);
    }   

    const compareDates = (d1, d2) => {
        let date1 = new Date(d1).getTime();
        let date2 = new Date(d2).getTime();
        var msDiff = date2 - date1;    //Future date - current date
        var daysTillExp = Math.floor(msDiff / (1000 * 60 * 60 * 24));

        if (daysTillExp > 90) {
        return "";    

        } else if (daysTillExp <= 0) {
        return "danger"; 

        } else {
        return "warning"; 
        }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
          setUser(user);
          setUserId(user.uid);        
      } else {
          console.log("No user");
      }
      });


    const getMedicineList = async () => {
                const docRef = doc(db, "medicine", userid, "stock", id);
                const snapshot = await getDoc(docRef);
                
                if(snapshot.data().quantity<=0){
                  navigate("/");
                }else{
                setMedicineName(snapshot.data().name);
                setMedicineDosage(snapshot.data().dosage);
                setMedicineExpiryDate(snapshot.data().expiryDate);
                setMedicineLocation(snapshot.data().location);
                setMedicineQuantity(snapshot.data().quantity);
                setMedicineTabletQuantity(snapshot.data().tabletInPack);
                setTypeMedicine(snapshot.data().medicineType);
                }
                
        }

       const subtractMedicineQuantity = async (id, quantity, taken) => {
               const medicineDoc = doc (db, "medicine", userid, "stock", id);
               await updateDoc(medicineDoc, {quantity: (quantity-taken)});
               setTakenMedicine(0);
               getMedicineList();
               
          }   

      const deleteMedicine = async (id) => {
              const medicineDoc = doc (db, "medicine", userid, "stock", id);
              await deleteDoc(medicineDoc);
              navigate(-1);
          }
    
        //ON PAGE LOAD GET MEDICINE LIST
        useEffect(() => {
            if (userid){
                getMedicineList();
            }
        }, [user]);
    
  
  return (
    <>
    <div className="back">
      <div className="item-inner">
    <h1>{medicineName} {medicineDosage}</h1>
    <h2>{typeMedicine !="SingleItem" ? typeMedicine : null}</h2>
    <h3 className = { compareDates(currentDate, medicineExpiryDate) }>Expiry Date: {formatDate(medicineExpiryDate)}</h3>
          <h3>Total Quantity: {
                        typeMedicine === "Bottles" ? 
                        (medicineQuantity + ' bottles') 

                        /* SHOW IN TABLE IF SELECTED SINGLE ITEM */
                        : typeMedicine === "SingleItem" ? 
                        (medicineQuantity + ' pcs')

                        /* SHOW IN TABLE IF SELECTED AMPOULES */
                        : typeMedicine === "Ampoules" ? 
                        (medicineQuantity + ' ampoules')

                        /* SHOW IN TABLE IF SELECTED TABLETS */
                        : typeMedicine === "Tablets" ? 
                        (medicineQuantity + ' tablets')

                        : 
                        (null)
      }</h3>
      <h3>{
        typeMedicine === "Tablets" ?
                        ((medicineQuantity / medicineTabletQuantity)%1) !== 0
                         ? "Packs: "+ Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs + ' 
                         + (medicineQuantity - (Math.floor(medicineQuantity / medicineTabletQuantity) * medicineTabletQuantity)) + ' tablets'
                         : "Packs: "+Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs' :
        typeMedicine === "Ampoules" ? 
                        ((medicineQuantity / medicineTabletQuantity)%1) !== 0
                         ? "Packs: "+ Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs + ' 
                         + (medicineQuantity - (Math.floor(medicineQuantity / medicineTabletQuantity) * medicineTabletQuantity)) + ' ampoules'
                         : "Packs: "+ Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs': null
        }</h3>
        <h3>Location: {medicineLocation}</h3>
        <div className="take">
        <input onChange={(e) => setTakenMedicine(e.target.value)} value={takenMedicine} type="number" min="0" placeholder="Amount"/>
        <button onClick={() => subtractMedicineQuantity(id, medicineQuantity, takenMedicine)}>Take</button>
        </div>
        <div className="itemBtns">
        {/* <button onClick={() => navigate(-1)}>Take</button> */}
        <button id="delete" onClick={() => deleteMedicine(id)}>Delete</button>
        <button onClick={() => navigate(-1)}>Back</button>
        </div>
    </div>
    </div>
    </>

  );
    
};

export default Item;