import { Box, Center, Spinner } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyCode from "./pages/VerifyCode";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import EditProfile from "./pages/EditProfile";
import CreateJob from "./pages/CreateJob";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import FollowList from "./pages/FollowList";

function App() {
  const { isLoading, isAuthenticated } = useContext(AuthContext);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }
  return (
    <Router>
      <Box>
        <Navbar />
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <Register />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/profile/:id" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/profile/:id/:type" element={<ProtectedRoute element={<FollowList />} />} />
          <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
          <Route path="/edit-profile" element={<ProtectedRoute element={<EditProfile />} />} />
          <Route path="/create-post" element={<ProtectedRoute element={<CreatePost />} />} />
          <Route path="/create-job" element={<ProtectedRoute element={<CreateJob />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
        </Routes>
      </Box>
    </Router>
  );
}



export default App;

