import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import ERDEditor from './pages/ERDEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Resolve from './pages/Resolve';
import Main from './pages/Main';
import UserProfile from './pages/UserProfile'

function App() {
  const [isAuth, setAuth] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', 'dark');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuth(true);
  }, []);

  return (
    <div className="erd-container d-flex flex-column vh-100">
      <Navbar isAuth={isAuth} setAuth={setAuth} />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/create/:id?" element={<ERDEditor />} />
          <Route path="/login" element={<Login setAuth={setAuth} />} />
          <Route path="/register" element={<Register setAuth={setAuth} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/resolve/:id" element={<Resolve />} />
        </Routes>
    </div>
  );
}

export default App;