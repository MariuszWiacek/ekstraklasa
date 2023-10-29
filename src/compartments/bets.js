import React, { useState, useEffect } from 'react';
import gameData from './gameData.json'; // Import the JSON data

const Bets = () => {
  const [games, setGames] = useState(gameData); // Use the imported gameData
  const [username, setUsername] = useState('');
  const [submittedData, setSubmittedData] = useState({});
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  useEffect(() => {
    // Load the username from local storage if available
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }

    // Load submitted data from local storage
    const savedData = localStorage.getItem('submittedData');
    if (savedData) {
      setSubmittedData(JSON.parse(savedData));
      setIsDataSubmitted(true); // Set the flag to true
    }
  }, []);

  const handleScoreChange = (gameId, score) => {
    // Allow automatic detection of the type (1, X, or 2)
    let type = '';
    if (/^\d+:\d+$/.test(score)) {
      // Check if the score format is valid (e.g., "1:1")
      if (score === '0:0' || score === '1:1' || score === '2:2' || score === '3:3') {
        type = 'X'; // Set type to 'X' for draw
      } else if (score.startsWith('0:')) {
        type = '2'; // Set type to '2' for away win
      } else if (score.startsWith('1:') || score.startsWith('2:') || score.startsWith('3:')) {
        type = '1'; // Set type to '1' for home win
      }
    }

    const updatedGames = games.map((game) =>
      game.id === gameId ? { ...game, score: score, bet: type } : game
    );
    setGames(updatedGames);
  };

  const handleSubmit = () => {
    // Check if data has already been submitted
    if (isDataSubmitted) {
      alert(`${username}, You have already submitted your bets!`);
      return;
    }

    // Save the username to local storage
    localStorage.setItem('username', username);

    // Save the submitted data to local storage
    const newData = games
      .filter((game) => game.bet && game.score)
      .map((game) => ({
        home: game.home,
        away: game.away,
        bet: game.bet,
        score: game.score,
      }));

    const updatedData = { ...submittedData, [username]: newData };
    localStorage.setItem('submittedData', JSON.stringify(updatedData));

    // Set the submitted data and show it
    setSubmittedData(updatedData);
    setIsDataSubmitted(true);
  };

  const handleReset = () => {
    // Clear local storage and reset the state
    localStorage.removeItem('username');
    setUsername('');
    setSubmittedData({});
    setIsDataSubmitted(false);
    setGames(gameData);
  };

  const renderUserCards = () => {
    if (isDataSubmitted) {
      return Object.keys(submittedData).map((user, index) => (
        <div key={index}>
          <div className="card"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'aliceblue',
              fontSize: "12px",
              padding: '10px',
              margin: '10px',
              borderRadius: '10px',
              textAlign: 'center',
              width: '90%', // Adjust the card width as needed
            }}
          >
            <h3 style={{ color: 'red' }}>{user}: </h3>
            {submittedData[user].map((bet, index) => (
              <div key={index}>
                {`${bet.home} vs. ${bet.away}, Bet: `}
                <span style={{ color: 'red' }}>{bet.bet}</span>
                {`, Score: `}
                <span style={{ color: 'red' }}>{bet.score}</span>
              </div>
            ))}
          </div>
        </div>
      ));
    } else {
      return null;
    }
  };

  return (
    <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444' }}>Najbliższe mecze:</h2>
      <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid #444' }}>
        <input
          style={{ margin: '10px' }}
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <table style={{ width: '100%', border: '1px solid #444', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #444' }}>Home Team</th>
            <th style={{ borderBottom: '1px solid #444' }}>Away Team</th>
            <th style={{ borderBottom: '1px solid #444' }}>Result</th>
            <th style={{ borderBottom: '1px solid #444' }}>Your Bet</th>
            <th style={{ borderBottom: '1px solid #444' }}>Your Score</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id} style={{ borderBottom: '1px solid #444' }}>
              <td>{game.home}</td>
              <td>{game.away}</td>
              <td>{game.result}</td>
              <td>
                <select
                  value={game.bet}
                  onChange={(e) => handleScoreChange(game.id, game.score)}
                  disabled // Disable type selection
                >
                  <option value="1">1</option>
                  <option value="X">X</option>
                  <option value="2">2</option>
                </select>
              </td>
              <td>
                <input
                  style={{ width: '50px' }}
                  type="text"
                  placeholder="1:1"
                  value={game.score}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9:]/g, ''); // Remove non-numeric and non-colon characters
                    const score = value.replace(/(\d{1})(\d{1})/, '$1:$2'); // Insert a colon after the first digit
                    handleScoreChange(game.id, score);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          style={{
            backgroundColor: '#DC3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-block',
            margin: '10px',
            fontSize: '14px',
            transition: 'background-color 0.3s', // Add a smooth transition effect
          }}
          onClick={handleSubmit}
        >
          Submit
        </button>
        <button
          style={{
            backgroundColor: 'rgba(13, 110, 253, 0.5)',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-block',
            margin: '10px',
            fontSize: '14px',
            transition: 'background-color 0.3s', // Add a smooth transition effect
          }}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      {renderUserCards()}
    </div>
  );
};

export default Bets;
