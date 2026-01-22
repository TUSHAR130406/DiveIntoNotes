import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/DashBoard";
import Library from "./pages/Library";
import ProtectedRoute from "./utils/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

         <Route path="/" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
