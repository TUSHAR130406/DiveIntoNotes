import { useEffect, useState } from "react";
import { useNavigate,useLocation } from "react-router-dom";

export default function Library() {
  const location = useLocation();

  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
  async function fetchDocuments() {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:8000/documents", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setDocuments(data);
  }

  fetchDocuments();
}, [location.key]);// so thatwhenever location is library it refetches the documents , and not simply on page laod
 

//download. 


function handleDownload(docId) {
  const token = localStorage.getItem("token");

  const url = `http://localhost:8000/documents/${docId}/download?token=${token}`;
  window.open(url, "_blank");
}


//delete

async function handleDelete(docId) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this file? This action cannot be undone."
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:8000/documents/${docId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }

    setDocuments(prevDocs =>
      prevDocs.filter(doc => doc._id !== docId)
    );
  } catch (err) {
    alert("Something went wrong while deleting");
  }
}





  return (
    <div style={{ padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h2>My Library</h2>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
       <hr/>
      {documents.length === 0 ? (
  <p style={{ color: "#666" }}>
    You haven’t uploaded any documents yet.
  </p>
) : (
  <div style={{ marginTop: "20px" }}>
   {documents.map(doc => (
  <div
    key={doc._id}
    style={{
      padding: "12px 16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      marginBottom: "12px",
      background: "#fafafa",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    <div >
      <strong>{doc.originalFileName}</strong>
      <div style={{ fontSize: "13px", color: "#777" }}>
        Uploaded on{" "}
        {new Date(doc.uploadedAt).toLocaleString()}
      </div>
    </div>
    <div style={{
    display: "flex",
    gap: "10px"
  }}>
    <button onClick={() => handleDownload(doc._id)}>
      Download
    </button>

    <button
      style={{ color: "red" }}
      onClick={() => handleDelete(doc._id)}
    >
      Delete
    </button>
    </div>

  </div>
))}

  </div>
)}

    </div>
  );
}
// //tolocalestring().toLocaleString()

// Formats date based on:

// user’s locale

// browser settings

