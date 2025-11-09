import React, { useEffect, useState } from "react";
import { db, auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ComponentCSS/History.css"; 


const History = () => {
  const [userId, setUserId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingDiagnosisId, setEditingDiagnosisId] = useState(null);
  const [editingDiagnosisValue, setEditingDiagnosisValue] = useState("");
  const navigate = useNavigate();

  const startEditRecipient = (log) => {
  setEditingId(log.id);
  setEditingValue(log.recipientName || "");
};

const cancelEditRecipient = () => {
  setEditingId(null);
  setEditingValue("");
};

const saveRecipient = async (log) => {
  try {
    if (!userId) return;
    const usageDocRef = doc(db, "medicine", userId, "stock", log.medId, "usage", log.id);
    await updateDoc(usageDocRef, { recipientName: editingValue.trim() });

    setLogs((prev) =>
      prev.map((l) => (l.id === log.id ? { ...l, recipientName: editingValue.trim() } : l))
    );
    cancelEditRecipient();
  } catch (e) {
    console.error(e);
    alert("Failed to save the recipient name. Please try again.");
  }
};  

const startEditDiagnosis = (log) => {
  setEditingDiagnosisId(log.id);
  setEditingDiagnosisValue(log.diagnosis || "");
};

const cancelEditDiagnosis = () => {
  setEditingDiagnosisId(null);
  setEditingDiagnosisValue("");
};

const saveDiagnosis = async (log) => {
  try {
    if (!userId) return;
    const usageDocRef = doc(db, "medicine", userId, "stock", log.medId, "usage", log.id);
    await updateDoc(usageDocRef, { diagnosis: editingDiagnosisValue.trim() });

    setLogs((prev) =>
      prev.map((l) => (l.id === log.id ? { ...l, diagnosis: editingDiagnosisValue.trim() } : l))
    );
    cancelEditDiagnosis();
  } catch (e) {
    console.error(e);
    alert("Failed to save the diagnosis. Please try again.");
  }
};


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else navigate("/auth");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      setLoading(true);
      const medicineColRef = collection(db, "medicine", userId, "stock");
      const medicineSnap = await getDocs(medicineColRef);

      let allLogs = [];
      for (const medDoc of medicineSnap.docs) {
        const usageColRef = collection(db, "medicine", userId, "stock", medDoc.id, "usage");
        const usageQuery = query(usageColRef, orderBy("takenAt", "desc"));
        const usageSnap = await getDocs(usageQuery);
        usageSnap.forEach((logDoc) => {
          allLogs.push({
            id: logDoc.id,
            medId: medDoc.id,
            medName: logDoc.data().name,
            ...logDoc.data(),
          });
        });
      }

      allLogs.sort((a, b) => b.takenAt?.seconds - a.takenAt?.seconds);
      setLogs(allLogs);
      setLoading(false);
    };

    fetchHistory();
  }, [userId]);

    const formatDate = (ts) => {
    if (!ts) return "";
    const date = new Date(ts.seconds * 1000);
    return date.toUTCString();
    };


  return (
    <div className="history-page">
      <h2>Usage History</h2>
      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Taken</th>
              <th>Before</th>
              <th>After</th>
              <th>Recipient</th>
              <th>Diagnosis</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.medName}</td>
                <td>{log.taken}</td>
                <td>{log.before}</td>
                <td>{log.after}</td>
                <td className="recipient-cell">
                    {editingId === log.id ? (
                        <div className="recipient-edit">
                        <input
                            className="recipient-input"
                            value={editingValue}
                            placeholder="Name Surname"
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === "Enter") saveRecipient(log);
                            if (e.key === "Escape") cancelEditRecipient();
                            }}
                            autoFocus
                        />
                        <button className="icon-btn" title="Save" onClick={() => saveRecipient(log)}>✅</button>
                        <button className="icon-btn" title="Cancel" onClick={cancelEditRecipient}>✖️</button>
                        </div>
                    ) : (
                        <div className="recipient-view">
                        <span>{log.recipientName && log.recipientName.length ? log.recipientName : "-"}</span>
                        <button
                            className="icon-btn"
                            title="Edit recipient"
                            onClick={() => startEditRecipient(log)}
                        >
                            ✏️
                        </button>
                        </div>
                    )}
                    </td>
                    <td className="diagnosis-cell">
                        {editingDiagnosisId === log.id ? (
                            <div className="diagnosis-edit">
                            <input
                                className="diagnosis-input"
                                value={editingDiagnosisValue}
                                placeholder="Diagnosis"
                                onChange={(e) => setEditingDiagnosisValue(e.target.value)}
                                onKeyDown={(e) => {
                                if (e.key === "Enter") saveDiagnosis(log);
                                if (e.key === "Escape") cancelEditDiagnosis();
                                }}
                                autoFocus
                            />
                            <button className="icon-btn" title="Save" onClick={() => saveDiagnosis(log)}>✅</button>
                            <button className="icon-btn" title="Cancel" onClick={cancelEditDiagnosis}>✖️</button>
                            </div>
                        ) : (
                            <div className="diagnosis-view">
                            <span>{log.diagnosis && log.diagnosis.length ? log.diagnosis : "-"}</span>
                            <button
                                className="icon-btn"
                                title="Edit diagnosis"
                                onClick={() => startEditDiagnosis(log)}
                            >
                                ✏️
                            </button>
                            </div>
                        )}
                    </td>
                <td>{formatDate(log.takenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
};

export default History;
