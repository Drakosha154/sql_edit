import React from 'react';
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
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="flex-grow-1 position-relative">
      <Routes>
        <Route path="/create" element={<ERDEditor />} />
      </Routes>
      </div>
    </div>
  );
}

export default App;