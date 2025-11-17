import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import {db} from "../config/firebase";

async function copyCollection() {
  const sourceRef = collection(db, "medicine", "ihiN2D14lGcQE0W1OOXFJyJUxQi2", "stock");
  const targetRef = collection(db, "medicine", "FUJw5f8sacPz1GyFl67a8IiVFzk1", "stock");

  // 1. Read all docs from source
  const snapshot = await getDocs(sourceRef);

  // 2. Write each doc to target
  const writePromises = snapshot.docs.map((d) => {
    const targetDocRef = doc(targetRef, d.id); // keep same ID
    return setDoc(targetDocRef, d.data());
  });

  await Promise.all(writePromises);

  console.log("✅ Collection copied successfully!");

  return (
   
        <button
          onClick={copyCollection}
          className="bg-blue-500 text-white rounded px-4 hover:bg-blue-600"
        >
          Copy
        </button>
  );
}
export default copyCollection;
  
