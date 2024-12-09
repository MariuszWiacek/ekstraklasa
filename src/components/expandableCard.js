import React, { useState } from 'react';
import '../styles/card.css'; // Import your CSS file with styles
import Pagination from './Pagination';

const ExpandableCard = ({ user, bets, results }) => {
  const itemsPerPage = 9;
  const totalBets = Object.keys(bets).length;
  const totalPages = Math.ceil(totalBets / itemsPerPage);

  // Set initial page to the last page
  const [currentPage, setCurrentPage] = useState(totalPages - 1);
  const [expanded, setExpanded] = useState(false); // Start as closed by default
  if (user === "Alan" || user === "Robert" || user === "Klepka" || user === "Kuzyn") {
    return null; // Do not render the card for these users
  }
  

  const getTypeFromResult = (result) => {
    if (!result) return null;
    const [homeScore, awayScore] = result.split(':');
    if (homeScore === awayScore) return 'X';
    return homeScore > awayScore ? '1' : '2';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedBets = Object.keys(bets).slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="paper-card">
      <h4 className="header-style" onClick={() => setExpanded(!expanded)}>
        {user} {expanded ? '-' : '+'}
      </h4>
      {expanded && (
        <div className="bet-container">
          {paginatedBets.map((index) => (
            <div key={index} className="game-style">
              <div style={{ fontSize: '10px' }}>
                <span style={{ color: 'black' }}>{bets[index].home}</span>
                {' vs. '}
                <span style={{ color: 'black' }}>{bets[index].away}</span>
                {' | '}
                <span style={{ color: 'blue' }}>Typ: [ {bets[index].bet} ]</span>
                {' | '}
                <span style={{ color: 'black' }}>{bets[index].score}</span>
                <span className="results-style">Wynik: </span>
                <span>{results[index]}</span>
                {bets[index].score === results[index] && (
                  <span className="correct-score">✅</span>
                )}
                {getTypeFromResult(results[index]) === bets[index].bet && (
                  <span className="correct-type">☑️</span>
                )}
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              handlePageChange(page);
            }}
            label="Strona"
          />
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;
