import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import usersData from '../gameData/users.json';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import ExpandableCard from '../components/expandableCard';
import Pagination from '../components/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};


initializeApp(firebaseConfig);

const auth = getAuth();
const database = getDatabase();

const groupGamesIntoKolejki = (games) => {
  const kolejki = [];
  for (let i = 0; i < games.length; i += 9) {
    kolejki.push({
      id: Math.floor(i / 9) + 1,
      games: games.slice(i, i + 9)
    });
  }
  return kolejki;
};

const Bets = () => {
  const [kolejki, setKolejki] = useState(groupGamesIntoKolejki(gameData));
  const [selectedUser, setSelectedUser] = useState('');
  const [submittedData, setSubmittedData] = useState({});
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [currentKolejkaIndex, setCurrentKolejkaIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const [areInputsEditable, setAreInputsEditable] = useState(true); 
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = () => {
    if (password === 'maniek123') {
      setIsAdmin(true);  // If correct password, show admin buttons
    } else {
      alert('Incorrect password!');
    }
  };

  

  useEffect(() => {
    const lastChosenUser = localStorage.getItem('selectedUser');
    if (lastChosenUser) {
      setSelectedUser(lastChosenUser);
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        setSelectedUser(user.displayName);
      }
    });

    const dbRef = ref(database, 'submittedData');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSubmittedData(data);
        setIsDataSubmitted(true);
      }
    });

    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setResults(data);
      }
    });

    const now = new Date();
    const nextGameIndex = gameData.findIndex(game => new Date(`${game.date}T${game.kickoff}:00+02:00`) > now);
    const kolejkaIndex = Math.floor(nextGameIndex / 9);
    setCurrentKolejkaIndex(kolejkaIndex);
  }, []);

  const isReadOnly = (selectedUser, index) => {
    return submittedData[selectedUser] && submittedData[selectedUser][index];
  };

  const gameStarted = (gameDate, gameKickoff) => {
    const currentDateTime = DateTime.now().setZone('Europe/Warsaw');
    const gameDateTime = DateTime.fromISO(`${gameDate}T${gameKickoff}:00`, { zone: 'Europe/Warsaw' });
    return currentDateTime >= gameDateTime;
  };

  const handleUserChange = (e) => {
    const user = e.target.value;
    setSelectedUser(user);
    localStorage.setItem('selectedUser', user);
  };

  const autoDetectBetType = (score) => {
    const [homeScore, awayScore] = score.split(':').map(Number);
    if (homeScore === awayScore) {
      return 'X';
    } else if (homeScore > awayScore) {
      return '1';
    } else {
      return '2';
    }
  };

  const handleScoreChange = (gameId, newScore) => {
    const cleanedScore = newScore.replace(/[^0-9:]/g, '');
    const formattedScore = cleanedScore.replace(/^(?:(\d))([^:]*$)/, '$1:$2');

    const updatedKolejki = kolejki.map(kolejka => ({
      ...kolejka,
      games: kolejka.games.map(game =>
        game.id === gameId
          ? { ...game, score: formattedScore, bet: autoDetectBetType(formattedScore) }
          : game
      )
    }));
    setKolejki(updatedKolejki);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      alert('Proszę wybrać użytkownika.');
      return;
    }

    const currentKolejka = kolejki[currentKolejkaIndex];
    const userSubmittedBets = submittedData[selectedUser] || {};

    const newBetsToSubmit = currentKolejka.games.reduce((newBets, game) => {
      if (game.score && !userSubmittedBets[game.id]) {
        newBets[game.id] = {
          home: game.home,
          away: game.away,
          score: game.score,
          bet: autoDetectBetType(game.score),
          kolejkaId: currentKolejka.id,
        };
      }
      return newBets;
    }, {});

    if (Object.keys(newBetsToSubmit).length === 0) {
      alert("Wszystkie zakłady zostały już przesłane.");
      return;
    }

    set(ref(database, `submittedData/${selectedUser}`), { ...userSubmittedBets, ...newBetsToSubmit })
      .then(() => {
        setSubmittedData({ ...submittedData, [selectedUser]: { ...userSubmittedBets, ...newBetsToSubmit } });
        setIsDataSubmitted(true);
        alert('Zakłady zostały pomyślnie przesłane!');
      })
      .catch((error) => {
        console.error('Błąd podczas przesyłania danych:', error);
        alert('Wystąpił błąd podczas przesyłania zakładów. Proszę spróbować ponownie.');
      });

    setKolejki(prevKolejki =>
      prevKolejki.map((kolejka, idx) =>
        idx === currentKolejkaIndex
          ? {
            ...kolejka,
            games: kolejka.games.map(game =>
              userSubmittedBets[game.id]
                ? { ...game, readOnly: true }
                : game
            )
          }
          : kolejka
      )
    );
  };

  const getTeamLogo = (teamName) => {
    const team = teamsData[teamName];
    return team ? team.logo : ''; // Default logo if not found
  };

  const toggleEditableOff = () => setAreInputsEditable(false);
  const toggleEditableOn = () => setAreInputsEditable(true);

  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
      <h2>
  Gratulacje ROBERT, do zobaczenia w 2025! </h2><hr></hr>
  
  <p style={{ color: 'yellow', textAlign: 'center', fontWeight: 'bolder' }} > Ciekawostki :<hr></hr><br></br>
  - najwiecej pkt w jednej kolejce - ROBERT - kolejka 18<br></br>
  - Typowalismy 162 mecze, najwiecej typów w nich zgadli - ROBERT 71/153, Alan - 70/153, Lukasz - 70/153<br></br>
  - Patrycja odgadla az 67 typow ale ze wzgledu mala liczbe dokladnych wynikow zajela dopiero 6 miejsce<br></br>
  Po wiece<br></br>
  - najwiecej pkt w jednej kolejce - ROBERT - kolejka 18<br></br>
  - najwiecej pkt w jednej kolejce - ROBERT - kolejka 18<hr></hr>
  </p>

      <p>Wybrany użytkownik : </p>
      <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', fontSize: '14px', color: 'yellow' }} />
      <select
        style={{ margin: '1px', backgroundColor: 'pink', fontWeight: 'bold', fontFamily: 'Rubik' }}
        value={selectedUser}
        onChange={handleUserChange}
      >
        <option value="">Użytkownik</option>
        {Object.keys(usersData).map((user, index) => (
          <option key={index} value={user}>{user}</option>
        ))}
      </select>
      <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', fontSize: '14px', color: 'yellow' }} />

      <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px', textAlign: 'center', marginBottom: '10px', marginTop: '5%' }}>
        <Pagination
          currentPage={currentKolejkaIndex}
          totalPages={kolejki.length}
          onPageChange={(page) => setCurrentKolejkaIndex(page)}
          label="Kolejka"
        />
        
        <table style={{ width: '100%', border: '0.5px solid #444', borderCollapse: 'collapse', marginTop: '5%' }}>
        <thead>
    <tr>
    <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}></th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>Gospodarz</th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}></th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>Gość</th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>Wynik</th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>1X2</th>
      <th style={{ borderBottom: '0.5px solid #444', textAlign: 'center' }}>Typ</th>
    </tr>
  </thead>
  <tbody>
  {/* Check if kolejki and the selected currentKolejkaIndex are valid */}
  {kolejki && kolejki[currentKolejkaIndex] && kolejki[currentKolejkaIndex].games ? (
    kolejki[currentKolejkaIndex].games.map((game, index) => (
      <React.Fragment key={index}>
        <tr
          style={{
            opacity: game.disabled ? '0.5' : '1',
            pointerEvents: game.disabled ? 'none' : 'auto',
            backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent',
          }}
        >
          <td
            colSpan="12"
            className="date"
            style={{ textAlign: 'left', color: 'gold', fontSize: '10px', paddingLeft: '10%' }}
          >
            &nbsp;&nbsp;&nbsp;
            {game.date}
            &nbsp;&nbsp;&nbsp;
            {game.kickoff}
          </td>
        </tr>
        <tr
          style={{
            borderBottom: '1px solid #444',
            opacity: game.disabled ? '0.5' : '1',
            pointerEvents: game.disabled ? 'none' : 'auto',
            backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent',
          }}
        >
          <p style={{ color: 'grey' }}>{game.id}.</p>
          <td style={{ textAlign: 'center', paddingRight: '10px', fontSize: '20px' }}>
            <img src={getTeamLogo(game.home)} className="logo" />
            {game.home}
          </td>
          <td style={{ textAlign: 'center', fontSize: '20px' }}>-</td>
          <td style={{ textAlign: 'left', paddingLeft: '10px', fontSize: '20px' }}>
            <img src={getTeamLogo(game.away)} className="logo" />
            {game.away}
          </td>
          <td style={{ textAlign: 'center', fontSize: '20px' }}>{results[game.id]}</td>
          <td style={{ textAlign: 'center' }}>
            <select value={game.bet} disabled>
              <option value="1">1</option>
              <option value="X">X</option>
              <option value="2">2</option>
            </select>
          </td>
          <td>
            <input
              style={{
                width: '50px',
                backgroundColor: game.score
                  ? isReadOnly(selectedUser, game.id)
                    ? 'transparent'
                    : 'white'
                  : 'white',
                cursor: isReadOnly(selectedUser, game.id) ? 'not-allowed' : 'text',
                color: 'red',
              }}
              type="text"
              placeholder={isReadOnly(selectedUser, game.id) ? '✔️' : 'x:x'}
              value={game.score}
              onChange={(e) => handleScoreChange(game.id, e.target.value)}
              maxLength="3"
              readOnly={areInputsEditable && isReadOnly(selectedUser, game.id)}
              title={areInputsEditable && isReadOnly(selectedUser, game.id) ? '✔️' : ''}
              disabled={areInputsEditable && gameStarted(game.date, game.kickoff)}
            />
          </td>
        </tr>
      </React.Fragment>
    ))
  ) : (
    <tr>
      <td colSpan="6" style={{ textAlign: 'center', padding:'5%' }}>
      Koniec rundy jesiennej. <br></br><br></br> Wracamy po przerwie zimowej. Dziękujemy za zaciekłą grę do końca.<br></br> Życzymy Wesołych Świąt oraz Szczęśliwego Nowego Roku!
      </td>
    </tr>
  )}
</tbody>

        </table>

        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            style={{ backgroundColor: '#DC3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'inline-block', margin: '10px', fontSize: '14px', width: '60%', transition: 'background-color 0.3s' }}
            onClick={handleSubmit}
          >
            Prześlij
          </button>
          {isDataSubmitted && Object.keys(submittedData).map((user) => (
          <ExpandableCard key={user} user={user} bets={submittedData[user]} results={results} />))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
  <button
    style={{
      backgroundColor: '#28a745', 
      color: 'white', 
      padding: '10px 20px', 
      border: 'none', 
      borderRadius: '5px', 
      marginRight: '10px', 
      cursor: 'pointer'
    }}
    onClick={toggleEditableOff}
  >
    
  </button>
  <button
    style={{
      backgroundColor: '#007bff', 
      color: 'white', 
      padding: '10px 20px', 
      border: 'none', 
      borderRadius: '5px', 
      cursor: 'pointer'
    }}
    onClick={toggleEditableOn}
  >
   
  </button>
</div>
      </div>
    </div>
  );
};

export default Bets;
