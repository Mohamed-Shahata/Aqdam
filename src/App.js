import { Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyCode from "./pages/VerifyCode";

function App() {
  return (
    <Router>
      <Box>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/create-post" element={<ProtectedRoute element={<CreatePost />} />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Box>
    </Router>
  );
}



export default App;

