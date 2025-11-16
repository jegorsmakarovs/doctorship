import { useState } from "react";
import {db} from "../config/firebase";

import {getDocs, collection, doc, addDoc, deleteDoc, arrayUnion, 
    updateDoc, query, orderBy, serverTimestamp} from "firebase/firestore"

export default function MedicineInputs() {
  const [nameArr, setName] = useState([]); // name is an array
  const [nameInput, setNameInput] = useState("");
  const [qty, setQty] = useState(0);
  const [perTen, setPerTen] = useState(false);
  const [mfag, setMfag] = useState(false);

  const handleAdd = () => {
    // Put nameInput into array as [0] element (not append)
    const nameArray = [];
    nameArray.push(nameInput);
    setName(nameArray);
    //
    

    onSubmitMedicine(nameArray);
  };

  const onSubmitMedicine = async (nameArr) => {
          const medicineCollectionRef =  collection (db, "listA")
          try{
              const docRef= await addDoc(medicineCollectionRef, {
                  name: nameArr,
                  qty: qty,
                  perTen: perTen,
                  mfag: mfag,
                  
              });
              setName([]);
              setQty(0);
              setNameInput("");
              setPerTen (false);
              setMfag (false);
              console.log("Document written with ID: ", docRef.id);
              
          } catch (err) {
              console.error(err);
          }
      };

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={perTen}
            onChange={(e) => setPerTen(e.target.checked)}
          />
          perTen
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mfag}
            onChange={(e) => setMfag(e.target.checked)}
          />
          mfag
        </label>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="border p-2 rounded w-40"
        />

        <input
          type="number"
          placeholder="Qty"
          
          onChange={(e) => setQty(Number(e.target.value))}
          className="border p-2 rounded w-24"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white rounded px-4 hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      {/* Show the array value */}
      {name.length > 0 && (
        <p className="mt-2 text-sm text-gray-700">Current name array: [{name.join(", ")}]</p>
      )}
    </div>
  );
}