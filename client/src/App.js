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
    <Container fluid className="p-0">
      <Navbar />
      <Routes>
        <Route path="/create" element={<ERDEditor />} />
      </Routes>
    </Container>
  );
}

export default App;