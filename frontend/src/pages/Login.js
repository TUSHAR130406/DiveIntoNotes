// import { useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";

// export default function Login() {
//   const token = localStorage.getItem("token");
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   // Declarative redirect (render-time)
//   if (token) {
//     return <Navigate to="/dashboard" />;
//   }

//   //this token chekcs make sure a logged in user doesnt go to login again

  

//   async function handleSubmit(e) {
//     e.preventDefault();

//     try {
//       const res = await fetch("http://localhost:8000/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data.error || "Login failed");
//         return;
//       }

//       localStorage.setItem("token", data.token);

//       // Imperative navigation (after action)
//       navigate("/dashboard");
//     } catch (err) {
//       alert("Something went wrong");
//     }
//   }

//   return (
//     <div style={{ maxWidth: "400px", margin: "100px auto" }}>
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <br />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <br />
//         <button type="submit">Login</button>
//       </form>
//     </div>
//   );
// }


// both login an dsign up inthe sma epage
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Login() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // false → new user (signup)
  // true  → existing user (login)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  if (token) {
    return <Navigate to="/dashboard" />;
  }
  async function handleSubmit(e) {
    e.preventDefault();

    // Only new users need confirm password
    if (!isLoggedIn && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const endpoint = isLoggedIn
        ? "http://localhost:8000/auth/login"
        : "http://localhost:8000/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Authentication failed");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  const inputStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  outline: "none",
  boxSizing: "border-box"
};

  return (
  <div
  style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f6f8"
  }}
>
  <h1
  style={{
    marginBottom: "20px",
    fontSize: "28px",
    fontWeight: "600",
    color: "#111827"
  }}
>
  DiveIntoNotes
</h1>

    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#fff",
        padding: "32px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>
        {isLoggedIn ? "Login" : "Create your account"}
      </h2>

      <p style={{ marginBottom: "24px", color: "#555", fontSize: "14px" }}>
        {isLoggedIn
          ? "Welcome back. Log in to access your notes."
          : "Get started by creating your personal notes library."}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {!isLoggedIn && (
          <div style={{ marginBottom: "18px" }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            cursor: "pointer"
          }}
        >
          {loading
            ? "Please wait..."
            : isLoggedIn
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <p
        style={{
          marginTop: "20px",
          fontSize: "14px",
          textAlign: "center"
        }}
      >
        {isLoggedIn ? (
          <>
            New user?{" "}
            <span
              style={{ color: "#2563eb", cursor: "pointer" }}
              onClick={() => setIsLoggedIn(false)}
            >
              Create an account
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span
              style={{ color: "#2563eb", cursor: "pointer" }}
              onClick={() => setIsLoggedIn(true)}
            >
              Login
            </span>
          </>
        )}
      </p>
    </div>
  </div>
);
};