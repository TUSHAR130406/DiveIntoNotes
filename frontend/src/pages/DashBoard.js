import { useNavigate } from "react-router-dom";
import { useState } from "react";


export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
const [uploadStatus, setUploadStatus] = useState("");
const [uploading, setUploading] = useState(false);
const [query, setQuery] = useState("");
const [answer, setAnswer] = useState("");
const [confidence, setConfidence] = useState(null);
const [sourceFile, setSourceFile] = useState("");
const [querying, setQuerying] = useState(false);
const [showGeminiPrompt, setShowGeminiPrompt] = useState(false);
const [contextForGemini, setContextForGemini] = useState("");
const [excerpts, setExcerpts] = useState([]);

  const navigate = useNavigate();


//logout


  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }


  //upload


  async function handleUpload() {
  if (!selectedFile) {
    alert("Please select a file first");
    return;
  }

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    setUploading(true);
    setUploadStatus("");

    const res = await fetch("http://localhost:8000/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      setUploadStatus(data.error || "Upload failed");
      return;
    }

    setUploadStatus("Upload successful ");
    setSelectedFile(null);
  } catch (err) {
    setUploadStatus("Something went wrong");
  } finally {
    setUploading(false);
  }
}




//query

async function handleQuery() {
  if (!query.trim()) {
    alert("Please enter a query");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    setQuerying(true);
    setAnswer("");
    setConfidence(null);
    setShowGeminiPrompt(false);

    const res = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Query failed");
      return;
    }

    if (data.confidence === "low") {
      setConfidence("low");
      setSourceFile(data.fileName || "");
      setContextForGemini(data.context || "");
      setShowGeminiPrompt(true);
      setAnswer("");
      setExcerpts([]);

    } else {
      setConfidence("high");
setSourceFile(data.source || "");
setAnswer(data.answer);
setExcerpts(data.evidence || []);

    }
  } catch (err) {
    alert("Something went wrong while querying");
  } finally {
    setQuerying(false);
  }
}

//query llm


async function handleGemini() {
  const token = localStorage.getItem("token");

  try {
    setQuerying(true);

    const res = await fetch("http://localhost:8000/query/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        context: contextForGemini
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "External AI failed");
      return;
    }

    setAnswer(data.answer);
    setConfidence("external");
    setShowGeminiPrompt(false);
  } catch (err) {
    alert("Something went wrong with external AI");
  } finally {
    setQuerying(false);
  }
}





  return (
    <div style={{ minHeight: "100vh", background: "#f5f6f8" }}>
      
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 24px",
          borderBottom: "1px solid #ddd",
          background: "#fff"
        }}
      >
        <h2>DiveIntoNotes</h2>

        <div>
          <button
            onClick={() => navigate("/library")}
            style={{ marginRight: "10px" }}
          >
            My Library
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          gap: "30px",
          padding: "30px",


          
        }}
      >
        
        {/* LEFT PANEL */}
        <div
          style={{
            width: "30%",
            background: "#fff",
            borderRadius: "10px",
            padding: "24px",
            border: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
           {/* UPLOAD CARD */}
<div
  style={{
    marginTop: "10px",
    padding: "16px",
    background: "#f3f5f9",
    borderRadius: "8px",
    border: "1px solid #dcdfe6"
  }}
>
  <h3 style={{ marginBottom: "6px" }}>Upload Notes</h3>

  <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
    Add PDFs or PPTs to your library so you can query them anytime.
  </p>

  <input
    type="file"
    accept=".pdf,.ppt,.pptx"
    onChange={(e) => setSelectedFile(e.target.files[0])}
    style={{ marginBottom: "10px",maxWidth: "100%",
    overflow: "hidden" }}
  />

  <br />

  <button onClick={handleUpload} disabled={uploading}>
    {uploading ? "Uploading..." : "Upload to Library"}
  </button>

  {uploadStatus && (
    <p style={{ marginTop: "10px", fontSize: "14px" }}>
      {uploadStatus}
    </p>
  )}
  
</div>



          <div>
            <hr/>
            <h4>Your Personal Knowledge Library</h4>

            <p style={{ color: "#555", lineHeight: "1.6" }}>
              DiveIntoNotes helps you build a personal library of your own
              notes — PDFs, PPTs, and study material — collected over time.
            </p>

            <p style={{ color: "#555", lineHeight: "1.6" }}>
              Upload your notes as you progress through, and query them anytime
              without manually searching files or skimming documents.
            </p>

            
          </div>

          <div>
            <hr />
            <p style={{ fontSize: "13px", color: "#777" }}>
              Your notes remain your primary source of truth.
            </p>
          </div>

        

        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            width: "70%",
            background: "#fff",
            borderRadius: "10px",
            padding: "24px",
            border: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <h3>Query Your Notes</h3>

          <input
            type="text"
            placeholder="What do you want to recall today?"
            style={{
              width: "96%",
              padding: "12px",
              fontSize: "15px",
              marginBottom: "12px"
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

         <button style={{width:"15%",marginBottom:"10px"}} onClick={handleQuery} disabled={querying}>
  {querying ? "Searching..." : "Query Notes"}
</button>



          <div
            style={{
              flexGrow: 1,
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fafafa"
            }}
          >
            
            {confidence === "high" && (
  <>
    <p><strong>Answer from your notes</strong></p>
    <p>{answer}</p>

    {excerpts.length > 0 && (
      <div style={{ marginTop: "16px" }}>
        <p style={{ fontWeight: "600", marginBottom: "6px" }}>
          Relevant excerpts from your notes
        </p>
        <ul style={{ paddingLeft: "18px", color: "#555" }}>
          {excerpts.map((line, idx) => (
            <li key={idx} style={{ marginBottom: "6px" }}>
              {line}
            </li>
          ))}
        </ul>
      </div>
    )}

    {sourceFile && (
      <p style={{ marginTop: "12px", fontSize: "13px", color: "#777" }}>
        Source: {sourceFile}
      </p>
    )}
  </>
)}


{confidence === "low" && showGeminiPrompt && (
  <>
    <p style={{ color: "#b45309" }}>
      Your notes may not fully cover this query.
    </p>
    <button onClick={handleGemini}>
      Consult external AI using my notes
    </button>
  </>
)}

{!confidence && (
  <>
    <p><strong>Relevant explanation will appear here</strong></p>
    <p style={{ color: "#777" }}>
      Results are retrieved directly from your uploaded notes.
    </p>
  </>
)}

{confidence === "external" && (
  <>
    <p><strong>Answer (via external AI but using your notes, more meticulous search):</strong></p>
    <p>{answer}</p>
  </>
)}


          </div>
        </div>
      </div>
    </div>
  );
}
