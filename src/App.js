import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/home';
import Navbar from './components/navbar';
import Table from './pages/table';
import Admin from './pages/admin';
import Footer from './components/footer';
import Guestbook from './pages/chatbox';
import Results from './pages/results';
import Bets from './pages/bets';
import Rules from './pages/rules';
import Loading from './components/loading'; // Import the Loading component

import pitch from './images/pitc.jpeg'; // Ensure this is the correct path to your image

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleImageLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Ensure the loading screen is shown for at least 3 seconds
    };

    const img = new Image();
    img.src = pitch;
    img.onload = handleImageLoad;

    return () => {
      img.onload = null; // Cleanup in case the component unmounts
    };
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {isLoading ? (
          <Loading onLoaded={() => setIsLoading(false)} key="loading" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '15%', paddingTop: '5%' }}>
              <Routes>
                <Route path="/" element={<Home />} /> 
                <Route path="/rules" element={<Rules />} />
                <Route path="/table" element={<Table />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/results" element={<Results />} />
                <Route path="/guestbook" element={<Guestbook />} />
                <Route path="/bets" element={<Bets />} />
              </Routes>
            </div>
            <Footer />
          </div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
