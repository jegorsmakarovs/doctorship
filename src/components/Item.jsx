import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {auth} from "../config/firebase";
import {db} from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {getDocs, getDoc, collection, doc, addDoc, deleteDoc, arrayUnion, updateDoc, serverTimestamp} from "firebase/firestore"
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
    const [destroyed, setDestroyed] = useState(false);
    const [typeMedicine, setTypeMedicine] = useState("");
    
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
                setDestroyed(snapshot.data().destroyed);
                }
                
        }

       const subtractMedicineQuantity = async (id, quantity, taken, medName) => {
        try{
          if (!taken || taken <= 0) return;
          if (taken > quantity) {
            alert(`Cannot take more than available quantity (${quantity})`);
            return;
          }
          const medicineDoc = doc(db, "medicine", userid, "stock", id);
          const newQty = quantity - taken;

          await updateDoc(medicineDoc, { quantity: newQty });

          const usageColRef = collection(db, "medicine", userid, "stock", id, "usage");
          await addDoc(usageColRef, {
            name: medName,
            taken: taken,
            before: quantity,
            after: newQty,
            takenAt: serverTimestamp(),
            by: user?.uid || null,
            recipientName: "",
            diagnosis: ""
          });

          setTakenMedicine(0);
          getMedicineList();
        } catch (error) {
          console.error("Error taking medicine: ", error);
          alert("An error occurred while taking the medicine. Please try again.");
        }
      };
      
      const deleteMedicine = async (id) => {
            
              const logCollectionRef = collection(db, "medicine", userid, "destroyedStock");
              const data = await getDocs(logCollectionRef);
              const allLogs = data.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
              }));
              
              // Filter logs where finished is not true (either false, undefined, or missing)
              const filteredLogs = allLogs.filter((log) => log.finished !== true);
              
              // Now console.log only their IDs
              if (filteredLogs.length > 0) {
                console.log(filteredLogs[0].id);
                const medicineDoc = doc (db, "medicine", userid, "stock", id);
                  await updateDoc(medicineDoc, {destroyed: true});
                  const logDoc = doc (db, "medicine", userid, "destroyedStock", filteredLogs[0].id);
                  await updateDoc(logDoc, {itemid: arrayUnion(id)});
                
              } else {
               const medicineDoc = doc (db, "medicine", userid, "stock", id);
                      await updateDoc(medicineDoc, {destroyed: true});
                      const docCollectionRef =  collection (db, "medicine", userid, "destroyedStock");
                          const docRef= await addDoc(docCollectionRef, {
                               finished:false,
                               itemid:id,
                           });
                          }
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
        {destroyed || medicineQuantity<=0 ? <h3>Medicine is disposed or finished</h3> : 
    <><h1>{medicineName} {medicineDosage}</h1><h2>{typeMedicine != "SingleItem" ? typeMedicine : null}</h2><h3 className={compareDates(currentDate, medicineExpiryDate)}>{compareDates(currentDate, medicineExpiryDate)=="danger"? "EXPIRED:" : "Expiry Date:" } {formatDate(medicineExpiryDate)}</h3><h3>Total Quantity: {typeMedicine === "Bottles" ?
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
                    (null)}</h3><h3>{typeMedicine === "Tablets" ?
                      ((medicineQuantity / medicineTabletQuantity) % 1) !== 0
                        ? "Packs: " + Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs + '
                        + (medicineQuantity - (Math.floor(medicineQuantity / medicineTabletQuantity) * medicineTabletQuantity)) + ' tablets'
                        : "Packs: " + Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs' :
                      typeMedicine === "Ampoules" ?
                        ((medicineQuantity / medicineTabletQuantity) % 1) !== 0
                          ? "Packs: " + Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs + '
                          + (medicineQuantity - (Math.floor(medicineQuantity / medicineTabletQuantity) * medicineTabletQuantity)) + ' ampoules'
                          : "Packs: " + Math.floor(medicineQuantity / medicineTabletQuantity) + ' packs' : null}</h3><h3>Location: {medicineLocation}</h3><div className="take">
                <input onChange={(e) => setTakenMedicine(Number(e.target.value))} value={takenMedicine} type="number" min="0" placeholder="Amount" />
                <button onClick={() => subtractMedicineQuantity(id, medicineQuantity, takenMedicine, medicineName)}>Take</button>
              </div><div className="itemBtns">
                {/* <button onClick={() => navigate(-1)}>Take</button> */}
                <button id="delete" onClick={() => deleteMedicine(id)}>Dispose</button>
                <button onClick={() => navigate(-1)}>Back</button>
              </div></>
        }
    </div>
    </div>
    </>

  );
    
};

export default Item;