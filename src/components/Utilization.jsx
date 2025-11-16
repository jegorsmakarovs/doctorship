import {auth} from "../config/firebase";
import {db} from "../config/firebase";

import {createUserWithEmailAndPassword, signInWithEmailAndPassword,signOut, onAuthStateChanged} from "firebase/auth";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import ReactPDF from '@react-pdf/renderer';


import {getDocs, collection, doc, addDoc, deleteDoc, arrayUnion, 
    updateDoc, query, where, orderBy, serverTimestamp} from "firebase/firestore"

 const Utilization = () => {

    
    const [user, setUser] = useState(null);
    
    const [userid, setUserId] = useState (null);
    
    const [openLogId, setOpenLogId] = useState("");

    const [medicineList, setMedicineList] = useState([]);

    const [finishedList, setFinishedList] = useState([]);
    
    const [selectedTypeDisposal, setSelectedTypeDisposal] = useState("Incineration");

    const [latitude, setLatitude] = useState("00 deg 00,0 N");
    const [longitude, setLongitude] = useState("000 deg 00,0 E");
        
    const navigate = useNavigate();

  useEffect(() => {
          if (userid){
              getOpenLists();
              getFinishedLists();
              
          }
      }, [user]);

const setFinished = async(id) =>{
    const medicineDoc = doc (db, "medicine", userid, "destroyedStock", id);
 await updateDoc(medicineDoc, {finished: true,
    preparedAt: serverTimestamp(), disposalType: selectedTypeDisposal, position: latitude + " / " + longitude,
 });
 
 getOpenLists();
 getFinishedLists();
}

const getFinishedLists = async () => {
   const finishedListsRef = collection(db, "medicine", userid, "destroyedStock");

  // 2️⃣ Create query: only finished == true and sorted by preparedAt DESC
  const q = query(
    finishedListsRef,
    where("finished", "==", true),
    orderBy("preparedAt", "desc"),
  );

  // 3️⃣ Fetch data
  const snapshot = await getDocs(q);

  // 4️⃣ Map documents
  const logs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log("Finished logs:", logs);
  setFinishedList(logs);
};

const getOpenLists = async () => {
  const logCollectionRef = collection(db, "medicine", userid, "destroyedStock");
  const data = await getDocs(logCollectionRef);
  const allLogs = data.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  // Filter logs where finished is not true
  const filteredLogs = allLogs.filter((log) => log.finished !== true);

  if (!filteredLogs.length) {
    console.log("No open lists found");
    setMedicineList([]); // clear list
    return;
  }

  const openLog = filteredLogs[0];
  console.log("Open log:", openLog);
  setOpenLogId(openLog.id);

  try {
    const medicineCollectionRef = collection(db, "medicine", userid, "stock");
    const q = query(medicineCollectionRef, orderBy("name", "asc"));
    const data = await getDocs(q);

    const allMedicines = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    // ✅ Use .includes() instead of 'in'
    const filteredMedicines = allMedicines.filter((medicine) =>
      openLog.itemid?.includes(medicine.id)
    );

    setMedicineList(filteredMedicines);
    console.log("Filtered medicines:", filteredMedicines);
  } catch (err) {
    console.error("Error loading medicines:", err);
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
    

        return (
        <><div className="open-utilization-log">
                <h1 className="disposal-titles">Medicine Disposal Reports</h1>
                {medicineList.length != 0 ?
                    <><table>
                        <thead>
                            <tr>
                                <th scope="col"><span className="th-text">Name</span></th>
                                <th scope="col"><span className="th-text">Expiry Date</span></th>

                                <th scope="col"><span className="th-text">Quantity</span></th>

                            </tr>
                        </thead>

                        {medicineList.map((medicine) => (
                            <tbody key={medicine.id}>
                                <tr>
                                    <td>{medicine.name + ' ' + medicine.dosage}</td>
                                    <td>{medicine.expiryDate}</td>
                                    <td>{
                                        /* SHOW IN TABLE IF SELECTED BOTTLES */
                                        medicine.medicineType === "Bottles" ?
                                            (medicine.quantity + ' bottles')

                                            /* SHOW IN TABLE IF SELECTED SINGLE ITEM */
                                            : medicine.medicineType === "SingleItem" ?
                                                (medicine.quantity + ' pcs')

                                                /* SHOW IN TABLE IF SELECTED AMPOULES */
                                                : medicine.medicineType === "Ampoules" ?
                                                    ((medicine.quantity / medicine.tabletInPack) % 1) !== 0
                                                        ? medicine.quantity + ' ampoules (' + Math.floor(medicine.quantity / medicine.tabletInPack) + ' packs + '
                                                        + (medicine.quantity - (Math.floor(medicine.quantity / medicine.tabletInPack) * medicine.tabletInPack)) + ' ampoules)'
                                                        : medicine.quantity + ' ampoules (' + Math.floor(medicine.quantity / medicine.tabletInPack) + ' packs)'

                                                    /* SHOW IN TABLE IF SELECTED TABLETS */
                                                    : medicine.medicineType === "Tablets" ?
                                                        ((medicine.quantity / medicine.tabletInPack) % 1) !== 0
                                                            ? medicine.quantity + ' tablets (' + Math.floor(medicine.quantity / medicine.tabletInPack) + ' packs + '
                                                            + (medicine.quantity - (Math.floor(medicine.quantity / medicine.tabletInPack) * medicine.tabletInPack)) + ' tablets)'
                                                            : medicine.quantity + ' tablets (' + Math.floor(medicine.quantity / medicine.tabletInPack) + ' packs)'

                                                        :
                                                        (null)}</td>
                                </tr>
                            </tbody>
                        ))}

                    </table>
                    <div className="latlonginput">
                    <div>
                        <label>Ship's Latitude:</label>
                    <input
                            placeholder="00 deg 00,0 N/S"
                            type="string"
                            required
                            onChange={(e) => setLatitude(e.target.value)} />
                    </div>
                    <div>
                     <label>Ship's Longitude:</label>       
                     <input
                            placeholder="000 deg 00,0 E/W"
                            type="string"
                            required
                            onChange={(e) => setLongitude(e.target.value)} />
                            </div>
                          <div> 
                            <label>Type of Disposal:</label>
                    <select
                            onChange={e => setSelectedTypeDisposal(e.target.value)} // ... and update the state variable on any change!
                            style={{ margin: "10px" }}
                            >
                            <option value="Incineration">Incineration</option>
                            <option value="Landing">Landing</option>
                        </select>
                        </div>
                    <button onClick={() => setFinished(openLogId)}>Finish Report</button>
                    </div>
                    </>
                    : null}
            </div>
            <div>
                <h1 className="disposal-titles">Completed Reports</h1>
                {finishedList.length != 0 ?
                <ul >
                    {finishedList.map((log) => (
                        <li className="disposalList" key={log.id}>
                            <span>Prepared At: {log.preparedAt ? log.preparedAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            <button onClick={() => navigate('/report', { state: { id: log.id } })}>Print</button>
                        </li>
                    ))}
                </ul> : <p>No completed reports found.</p>}
                </div></>
    );

};
export default Utilization;
