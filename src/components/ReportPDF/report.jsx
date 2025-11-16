import React, { useEffect, useState } from "react";
import { PDFViewer, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Table, TR, TH, TD } from "@ag-media/react-pdf-table";
import { useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import {getDocs, collection, doc, addDoc, deleteDoc, arrayUnion, 
    updateDoc, query, orderBy, serverTimestamp} from "firebase/firestore"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
  },
  section: {
    margin: 10,
    padding: 10,
  },
});

const MyDocument = ({ id, user, preparedAt, medicines, disposalType, position, shipName, IMO }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>MEDICINE DISPOSAL REPORT</Text>
        <Text>REPORT ID: {id}</Text>
        <Text>Prepared at: {preparedAt}</Text>
        
      </View>

      <View style={styles.section}>
        <Text>Ship Name: {shipName}</Text>
        <Text>IMO: {IMO}</Text>
      </View>

      <View style={styles.section}>
        <Text>Type of Disposal: {disposalType}</Text>
        <Text>Ship's Position Lat/Long: {position}</Text>
      </View>

      <View style={styles.section}>
        <Table>
          <TH>
            <TD>Medicine Name</TD>
            <TD>Expiry Date</TD>
            <TD>Quantity</TD>
          </TH>

          {medicines.map((item) => (
            <TR key={item.id}>
              <TD>{item.name}</TD>
              <TD>{item.expiryDate}</TD>
              <TD>{item.quantity}</TD>
            </TR>
          ))}
        </Table>
      </View>
      <View style={styles.section}>
        <Text>Master Signature: ________________________</Text>
        </View>
        <View style={styles.section}>
         <Text>Chief Officer Signature: ________________________</Text>
         </View>
         <View style={styles.section}>
         <Text>Chief Engineer Signature: ________________________</Text>
      </View>
    </Page>
  </Document>
);

const Report = () => {
  const location = useLocation();
  const { id } = location.state || {};
  const [preparedAt,setPreparedAt] = useState("");
  const [disposalType,setDisposalType] = useState("");
  const [position,setPosition] = useState("");
  const [shipName,setShipName] = useState("");
  const [IMO,setIMO] = useState("");
  const [user, setUser] = useState(null);
  const [userID, setUserID] = useState(null);
  const [medicines, setMedicines] = useState([]);

  // ✅ Get user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserID(currentUser.uid);
      } else {
        console.warn("No user logged in");
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch medicine data once userID is ready
  useEffect(() => {
    if (!userID || !id) return;

    const getLog = async () => {
      // if you want a whole collection of destroyedStock items:
      const logCollectionRef = collection(db, "medicine", userID, "destroyedStock");

      const data = await getDocs(logCollectionRef);
      const allLogs = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
        const filteredLog = allLogs.find((log) => log.id === id);
      setPreparedAt(filteredLog.preparedAt ? filteredLog.preparedAt.toDate().toLocaleDateString() : 'N/A');
      setDisposalType(filteredLog.disposalType || "N/A");
      setPosition(filteredLog.position || "N/A");

      try {
        const voyTypeRef = collection(db, "medicine", userID, "info");
          
          const voySnapshot = await getDocs(voyTypeRef);
        
          const requiredVoyageList = voySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
        
          const shipName=requiredVoyageList[0].shipName;
          const IMO=requiredVoyageList[0].IMO;
          setShipName (shipName);
          setIMO (IMO);

          const medicineCollectionRef = collection(db, "medicine", userID, "stock");
          const q = query(medicineCollectionRef, orderBy("name", "asc"));
          const data = await getDocs(q);
      
          const allMedicines = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
      
          // ✅ Use .includes() instead of 'in'
          const filteredMedicines = allMedicines.filter((medicine) =>
            filteredLog.itemid?.includes(medicine.id)
          );
      
          setMedicines(filteredMedicines);
          console.log("Filtered medicines:", filteredMedicines);
        } catch (err) {
          console.error("Error loading medicines:", err);
        }
      
    };

    getLog();
  }, [userID, id]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <PDFViewer
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      >
        <MyDocument id={id} user={user} preparedAt={preparedAt} medicines={medicines} disposalType={disposalType} position={position} shipName={shipName} IMO={IMO}/>
      </PDFViewer>
    </div>
  );
};

export default Report;