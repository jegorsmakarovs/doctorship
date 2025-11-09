import React, { useEffect, useState } from "react";
import {auth} from "../config/firebase";
import {db} from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {getDocs, collection, doc, addDoc, deleteDoc, updateDoc, query, orderBy, serverTimestamp} from "firebase/firestore"
import 'bootstrap';
import { useNavigate } from "react-router-dom";
import AddMedicinePopup from "./AddMedicinePopup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SubtractMedicinePopup from "./SubtractMedicinePopup";
import QrPopup from "./QrPopup";
import QRCode from "react-qr-code";
import {BrowserView, MobileView} from 'react-device-detect';

const Home = () => {

    //QR
    const [back, setBack] = useState('#FFFFFF');
    const [fore, setFore] = useState('#000000');
    const [size, setSize] = useState(100);

    const [topNav, setTopNav]= useState("topnav");

    //NAVIGATION
    const navigate = useNavigate();

    //GET MEDICINE LIST
    const [medicineList, setMedicineList] = useState([]);

    //FOR ADD ITEM BUTTON
    const [btnPopup , setBtnPopup] = useState(false);

    //NEW MEDICINE ADDITION STATES
    const [newMedicineName, setNewMedicineName] = useState("");
    const [newMedicineDosage, setNewMedicineDosage] = useState("");
    const [newMedicineExpiryDate, setNewMedicineExpiryDate] = useState(new Date().toLocaleDateString('en-US'));
    const [newMedicineLocation, setNewMedicineLocation] = useState("");
    const [newMedicineQuantity, setNewMedicineQuantity] = useState(0);
    const [newMedicineTabletQuantity, setNewMedicineTabletQuantity] = useState(1);
    const [selectedTypeMedicine, setSelectedTypeMedicine] = useState('None');

    //UPDATE MEDICINE QUANTITY STATES
    
    const [takenQuantity, setTakenQuantity] = useState(0);
    const [subtractBtnPopup , setSubtractBtnPopup] = useState(false); //FOR SUBTRACT ITEM QUANTITY BUTTON
    const [selectedId, setSelectedId] = useState("");
    const [currentQty, setCurrentQty] = useState(0);
    const [selectedName, setSelectedName] = useState("");

    //AUTH CHECK AND USERID STATE
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userid, setUserId] = useState (null);
    
    //GETS CURRENT DATE
    const currentDate = new Date().toLocaleDateString('en-US');

    const [qrPopup , setQRPopup] = useState(false);//FOR QR BUTTON
    const [qrID, setQrID] = useState("");
    const [qrName, setQrName] = useState("");
    const [qrDose, setQrDose] = useState("");

    //FORMATS TO STANDART DD MONTH YYYY
    function formatDate(string){
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(string).toLocaleDateString('en-GB',options);
    }   

    //CHECKS HOW LONG UNTIL EXPIRY
    const compareDates = (d1, d2) => {
        let date1 = new Date(d1).getTime();
        let date2 = new Date(d2).getTime();
        var msDiff = date2 - date1;    //Future date - current date
        var daysTillExp = Math.floor(msDiff / (1000 * 60 * 60 * 24));

        if (daysTillExp > 90) {
        return "";    

        } else if (daysTillExp <= 0) {
        return "table-danger"; 

        } else {
        return "table-warning"; 
        }
    };

    //CHECK IF USER IS LOGGED IN
    onAuthStateChanged(auth, (user) => {
    if (user) {
        setUser(user);
        setLoading(false);
        setUserId(user.uid);        
    } else {
        console.log("No user");
    }
    });

    const showQrCode = (id, medName, dose) => {
        setQRPopup(true);
        setQrID(id);
        setQrName(medName);
        setQrDose(dose);
    }

    //READ MEDICINE LIST FROM FIRESTORE DATABASE
    const getMedicineList = async () => {
            try{
                const medicineCollectionRef =  collection (db, "medicine", userid, "stock");
                const q = query(medicineCollectionRef, orderBy("name", "asc"));
                const data = await getDocs(q);
                const filteredData = data.docs.map((doc) => ({
                    ...doc.data(), 
                    id: doc.id
                }));
                
                setMedicineList(filteredData);
                filteredData.map((medicine) => (
                    medicine.quantity <=0 ? deleteMedicine (medicine.id) : null
                ));
            } catch (err) {
                console.error(err);
            }
    }

    //ON PAGE LOAD GET MEDICINE LIST
    useEffect(() => {
        if (userid){
            getMedicineList();
            
        }
    }, [user]);


    //ADD MEDICINE TO FIRESTORE DATABASE
    const onSubmitMedicine = async () => {
        const medicineCollectionRef =  collection (db, "medicine", userid, "stock")
        try{
            const docRef= await addDoc(medicineCollectionRef, {
                name: newMedicineName,
                medicineType: selectedTypeMedicine,
                dosage: newMedicineDosage,
                expiryDate: newMedicineExpiryDate, 
                location: newMedicineLocation,
                tabletInPack:newMedicineTabletQuantity,
                quantity: newMedicineQuantity * newMedicineTabletQuantity,
            });
            showQrCode(docRef.id,newMedicineName, newMedicineDosage)
            setNewMedicineName("");
            setSelectedTypeMedicine("None");
            setNewMedicineDosage("");
            setNewMedicineExpiryDate(new Date().toLocaleDateString('en-US'));
            setNewMedicineLocation("");
            setNewMedicineQuantity(0);
            setNewMedicineTabletQuantity(1);
            setBtnPopup(false);
            getMedicineList();
            
        } catch (err) {
            console.error(err);
        }
    };

    //DELETE MEDICINE FROM FIRESTORE DATABASE
    const deleteMedicine = async (id) => {
        const medicineDoc = doc (db, "medicine", userid, "stock", id);
        await deleteDoc(medicineDoc);
        getMedicineList();
    }

    //SUBTRACTS AMOUNT IN POPUP FROM QUANTITY OF MEDICINE
    const subtractMedicineQuantity = async (id, quantity, taken, medName) => {
        try {
            if (!taken || taken <= 0) return;
            if (taken > quantity) {
                alert("Taken quantity exceeds current quantity.");
                return;
        }

        const medicineDoc = doc (db, "medicine", userid, "stock", id);
        const newQty = quantity - taken;

        await updateDoc(medicineDoc, {quantity: newQty});

        const usageColRef = collection(db, "medicine", userid, "stock", id, "usage");
        await addDoc(usageColRef, {
            name: medName,
            taken: taken,
            before: quantity, 
            after: newQty, 
            takenAt: serverTimestamp(),
            by: user?.uid || null 
        });
        setSubtractBtnPopup(false);
        getMedicineList();
        } catch (err) {
            console.error(err);
            alert("Error updating quantity. Please try again.");
        }
    }

    function burgerNavBar() {
        if (topNav === "topnav") {
            setTopNav("topnav responsive")
        } else {
            setTopNav("topnav");
        }
    }

    //RENDER PART
    return (
        <>
            {/*<nav>
            <h1 style={{ color: "white" }}>
                 Medicine
            </h1>
            <div>
            <button className="addMedButton" onClick={() => navigate("/")}>
                Scan QR Code
            </button>
            <button className="addMedButton" onClick={() => navigate("/auth")}>
                {user ? "Account" : "Log in / Register"}
            </button>
            </div>
            </nav> */}
            {(user && !loading) ? (

                <><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link><div className={topNav} id="myTopnav">
                    <a href="/" className="active">DOCTORSHIP</a>
                    <a id="account" href="/auth">{user ? "Account" : "Log in / Register"}</a>
                    <a href="/qrscan">{user ? "Scan QR" : null}</a>
                    <a href="/history">History</a>
                    <a href="javascript:void(0);" className="icon" onClick={burgerNavBar}>
                        <i className="fa fa-bars"></i>
                    </a>
                </div></>
            ):null}
            {(user && !loading) ? (
                <>
                <SubtractMedicinePopup setTrigger = {setSubtractBtnPopup} trigger={subtractBtnPopup}>
                    <h3>Subtract Medicine Items</h3>
                    <h4>{selectedName}</h4>
                    <h3>Current Quantity: {currentQty}</h3>
                    <input
                            placeholder="Quantity Taken"
                            type="number"
                            min="0"
                            onChange={(e) => setTakenQuantity(Number(e.target.value))} />
                    <button style={{margin:"5px"}} onClick={() => subtractMedicineQuantity(selectedId, currentQty, takenQuantity, selectedName)}>Confirm</button>
                </SubtractMedicinePopup>

                <QrPopup setTrigger = {setQRPopup} trigger={qrPopup}>
        
                    <div className="qrDiv">
                    <h2>{qrName} {qrDose}</h2>
                    <QRCode
                        value={qrID}
                        bgColor={back}
                        fgColor={fore}
                        size={size === '' ? 0 : size}
                    />
                    </div>
    
                    
                </QrPopup>
                
                <AddMedicinePopup setTrigger = {setBtnPopup} trigger={btnPopup}>
                    <h3>Add New Medicine</h3>
                    <label>Select Item Type</label>
                        <select
                            value={selectedTypeMedicine} // ...force the select's value to match the state variable...
                            onChange={e => setSelectedTypeMedicine(e.target.value)} // ... and update the state variable on any change!
                            style={{ margin: "10px" }}
                            >
                            <option value="None">None</option>
                            <option value="Tablets">Tablets</option>
                            <option value="Bottles">Bottles</option>
                            <option value="Ampoules">Ampoules</option>
                            <option value="SingleItem">Single Item</option>
                        </select>

                    {/* IF SELECTED TABLETS */}
                        {selectedTypeMedicine === "Tablets" ? (
                        <div id="medicineFields">
                        <div id="addMedElement">
                        <label>Medicine Name</label>
                        <input
                            placeholder="Medicine Name"
                            onChange={(e) => setNewMedicineName(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Dosage</label>
                        <input
                            placeholder="Dosage in mg"
                            onChange={(e) => setNewMedicineDosage(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Quantity of tablets in pack</label>
                        <input
                            placeholder="Tablets in pack"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineTabletQuantity(Number(e.target.value))} />
                        </div>

                        <div id="addMedElement">
                        <label>Expiry Date</label>    
                        <DatePicker selected={newMedicineExpiryDate} 
                        minDate={new Date()} 
                        onChange={(date) => setNewMedicineExpiryDate(date.toLocaleDateString('en-US'))} />
                        </div>    

                        <div id="addMedElement">
                        <label>Location Onboard</label>
                        <input
                            placeholder="Location"
                            onChange={(e) => setNewMedicineLocation(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Packs Received</label>
                        <input
                            placeholder="Quantity of packs"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineQuantity(Number(e.target.value))} />
                        </div>

                        <button onClick={onSubmitMedicine}>+ Add Medicine</button>
                    </div>) 

                    
                        /* IF SELECTED BOTTLES */ 
                        : selectedTypeMedicine === "Bottles" ? (
                        <div id="medicineFields">
                        <div id="addMedElement">
                        <label>Medicine Name</label>
                        <input
                            placeholder="Medicine Name"
                            onChange={(e) => setNewMedicineName(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Volume</label>
                        <input
                            placeholder="Volume of bottle in ml"
                            onChange={(e) => setNewMedicineDosage(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Expiry Date</label>    
                        <DatePicker selected={newMedicineExpiryDate} 
                        minDate={new Date()} 
                        onChange={(date) => setNewMedicineExpiryDate(date.toLocaleDateString('en-US'))} />
                        </div>    

                        <div id="addMedElement">
                        <label>Location Onboard</label>
                        <input
                            placeholder="Location"
                            onChange={(e) => setNewMedicineLocation(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Bottles Received</label>
                        <input
                            placeholder="Quantity of bottles"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineQuantity(Number(e.target.value))} />
                        </div>

                        <button onClick={onSubmitMedicine}>+ Add Medicine</button>
                    </div>) 

                    /* IF SELECTED AMPOULES */
                        : selectedTypeMedicine === "Ampoules" ? (
                        <div id="medicineFields">
                        <div id="addMedElement">
                        <label>Medicine Name</label>
                        <input
                            placeholder="Medicine Name"
                            onChange={(e) => setNewMedicineName(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Dosage</label>
                        <input
                            placeholder="Dosage in mg"
                            onChange={(e) => setNewMedicineDosage(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Quantity of ampoules in pack</label>
                        <input
                            placeholder="Ampoules in pack"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineTabletQuantity(Number(e.target.value))} />
                        </div>

                        <div id="addMedElement">
                        <label>Expiry Date</label>    
                        <DatePicker selected={newMedicineExpiryDate} 
                        minDate={new Date()} 
                        onChange={(date) => setNewMedicineExpiryDate(date.toLocaleDateString('en-US'))} />
                        </div>    

                        <div id="addMedElement">
                        <label>Location Onboard</label>
                        <input
                            placeholder="Location"
                            onChange={(e) => setNewMedicineLocation(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Packs Received</label>
                        <input
                            placeholder="Quantity of packs"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineQuantity(Number(e.target.value))} />
                        </div>

                        <button onClick={onSubmitMedicine}>+ Add Medicine</button>
                    </div>)

                    /* IF SELECTED SINGLE ITEM */
                        : selectedTypeMedicine === "SingleItem" ? (
                        <div id="medicineFields">
                        <div id="addMedElement">
                        <label>Medicine Name</label>
                        <input
                            placeholder="Medicine Name"
                            onChange={(e) => setNewMedicineName(e.target.value)} />
                        </div>
                        
                        <div id="addMedElement">
                        <label>Expiry Date</label>    
                        <DatePicker selected={newMedicineExpiryDate} 
                        minDate={new Date()} 
                        onChange={(date) => setNewMedicineExpiryDate(date.toLocaleDateString('en-US'))} />
                        </div>    

                        <div id="addMedElement">
                        <label>Location Onboard</label>
                        <input
                            placeholder="Location"
                            onChange={(e) => setNewMedicineLocation(e.target.value)} />
                        </div>

                        <div id="addMedElement">
                        <label>Quantity Received</label>
                        <input
                            placeholder="Quantity"
                            type="number"
                            min="0"
                            onChange={(e) => setNewMedicineQuantity(Number(e.target.value))} />
                        </div>

                        <button onClick={onSubmitMedicine}>+ Add Medicine</button>
                    </div>) 
                        : (
                        null
                        )}

                    
            </AddMedicinePopup>

            </>
               
            
            ) : null}
            {(user && !loading) ? (
                <><BrowserView>
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col"><span className="th-text">Name</span></th>
                                    <th scope="col"><span className="th-text">Expiry Date</span></th>
                                    <th scope="col"><span className="th-text">Location</span></th>
                                    <th scope="col"><span className="th-text">Quantity</span></th>
                                    <th scope="col" className="btnColumn">
                                        <button className="addMedButton" onClick={() => { setBtnPopup(true); setSelectedTypeMedicine("None"); } }>+ Add Item</button>
                                    </th>
                                </tr>
                            </thead>

                            {medicineList.map((medicine) => (



                                <tbody key={medicine.id}>
                                    <tr
                                        className={compareDates(currentDate, medicine.expiryDate)}
                                    >
                                        <td>{medicine.name + ' ' + medicine.dosage}</td>
                                        <td>{formatDate(medicine.expiryDate)}</td>
                                        <td>{medicine.location}</td>
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
                                        <td className="btnsMenuTable">
                                            <button className="viewbtn" onClick={() => navigate('/item', { state: { id: medicine.id } })}>View</button>
                                            <button onClick={() => {
                                                setSubtractBtnPopup(true);
                                                setTakenQuantity(0);
                                                setSelectedId(medicine.id);
                                                setCurrentQty(medicine.quantity);
                                                setSelectedName(medicine.name);
                                            } }>Take</button>
                                            <button onClick={() => {
                                                showQrCode(medicine.id, medicine.name, medicine.dosage);
                                            } }>QR Code</button>
                                            <button id="delete" onClick={() => deleteMedicine(medicine.id)}>Delete</button>
                                        </td>
                                    </tr>

                                </tbody>


                            ))}

                        </table>

                    </div>
                </BrowserView>
                <MobileView>
                        <div>
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    
                                    <th scope="col">Location</th>
                                   
                                </tr>
                            </thead>

                            {medicineList.map((medicine) => (



                                <tbody key={medicine.id}>
                                    <tr
                                        className={compareDates(currentDate, medicine.expiryDate)}
                                        onClick={() => navigate('/item', { state: { id: medicine.id } })}
                                    >
                                        <td>{medicine.name + ' ' + medicine.dosage}</td>
                                       
                                        <td>{medicine.location}</td>
                                        
                                    </tr>

                                </tbody>


                            ))}

                        </table>

                    </div>
                    </MobileView></>
            ) : 
            <>
            
               
                <div className="textDiv">
                <h2>DOCTORSHIP</h2>
                <h1>WELCOME</h1>
                <p>DoctorShip is a platform for accounting ship's medicine stock</p>
                <div className="btnsMenuTable">
                <button onClick={() => navigate('/auth', { state: { login: true} })}>Login</button>
                <button onClick={() => navigate('/auth', { state: { login: false} })}>Register</button>
                </div>
                </div>
            </>
            
            }
        </>
        
    );
};

export default Home;