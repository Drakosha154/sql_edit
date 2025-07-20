import React from 'react';
import { useEffect } from 'react';
import ERDEditor from './pages/ERDEditor.js';
import './pages/ERDEditor.css';
import Navbar from './components/navbar.js';
import { Container } from 'react-bootstrap';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Routes,
    Link,
} from 'react-router-dom'

function App() {
  useEffect(() => {
    document.body.setAttribute('data-bs-theme', 'dark');
  }, []);

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <Routes>
        <Route path="/create" element={<ERDEditor />} />
      </Routes>
    </div>
  );
}

export default App;