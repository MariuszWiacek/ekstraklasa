import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import footballLogo from '../images/icon.jpg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const menuClass = isMenuOpen ? 'collapse navbar-collapse show' : 'collapse navbar-collapse';

  const navbarStyle = {
   
    top: 0,
    width: '100%',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(255, 0, 0, 0), rgba(0, 0, 0, 0))',
    
  };
   

  const logoStyle = {
    width: '30px',
    marginRight: '10px',
    background: 'transparent',
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Impact',
    fontSize: '36px',
    fontStyle: 'italic',
    letterSpacing: '2px',
    color: 'red', // Set the text color to red
  };

  const linksStyle = {
    marginLeft: 'auto',
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-light navbar-white`} style={navbarStyle}>
      <div className="container">
        <Link to="/home" className="navbar-brand" style={brandStyle}>
          <img src={footballLogo} alt="Logo piłkarski" style={logoStyle} />
          Superliga
        </Link>
        <button
          className={`navbar-toggler ${isMenuOpen ? 'open' : ''}`}
          type="button"
          onClick={toggleMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <div className={menuClass} id="navbarNav">
          <ul className="navbar-nav" style={linksStyle}>
            <li className="nav-item">
              <Link to="/bets" className="nav-link" onClick={closeMenu}>
                Zakłady
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/table" className="nav-link" onClick={closeMenu}>
                Tabela
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/games" className="nav-link" onClick={closeMenu}>
                Wyniki
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/guestbook" className="nav-link" onClick={closeMenu}>
                Chatbox
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
