import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container, Table } from 'react-bootstrap';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const linkContainerStyle = {
  fontFamily: 'Rubik',
  textAlign: 'left',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const averagePointsStyle = {
  fontFamily: 'Rubik',
  color: 'aliceblue',
  backgroundColor: '#0090cdf1',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
  textAlign: 'center',
  transition: 'transform 0.3s, box-shadow 0.3s',
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
};

const calculatePoints = (bets, results) => {
  let points = 0;
  let correctTypes = 0;
  let correctResults = 0;
  let correctTypesWithResults = 0;

  bets.forEach((bet) => {
    const result = results[bet.id];
    if (result) {
      const [homeScore, awayScore] = result.split(':').map(Number);
      const betScore = bet.score.split(':').map(Number);

      if (betScore[0] === homeScore && betScore[1] === awayScore) {
        points += 3;
        correctResults++;
        correctTypes++;
        correctTypesWithResults++;
      } else if (bet.bet === (homeScore === awayScore ? 'X' : homeScore > awayScore ? '1' : '2')) {
        points += 1;
        correctTypes++;
      }
    }
  });

  return { points, correctTypes, correctResults, correctTypesWithResults };
};

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [hallOfFame, setHallOfFame] = useState([]);
  const [averagePoints, setAveragePoints] = useState([]);
  const [mostChosenFailedTeam, setMostChosenFailedTeam] = useState(null);
  const [favoriteTeams, setFavoriteTeams] = useState({});
  const [mostChosenCorrectTeam, setMostChosenCorrectTeam] = useState(null);
  const [updatedTableData, setUpdatedTableData] = useState([]);
  const [mostChosenScores, setMostChosenScores] = useState({});


  useEffect(() => {
    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      setResults(data || {});
    });

    const submittedDataRef = ref(database, 'submittedData');
    onValue(submittedDataRef, (snapshot) => {
      const data = snapshot.val();
      setSubmittedData(data || {});
    });
  }, []);

  useEffect(() => {
    const teamChoices = {};
    const teamCorrectChoices = {};
    const teamFails = {};
    const userFavoriteTeams = {};
    const scoreChoices = {}; // Track score choices globally

    const updatedTableData = Object.keys(submittedData).map((user) => {
      const bets = Object.entries(submittedData[user]).map(([id, bet]) => ({
        ...bet,
        id,
      }));

      const kolejkaPoints = {};
      bets.forEach((bet) => {
        const kolejkaId = Math.floor((bet.id - 1) / 9);
        if (!kolejkaPoints[kolejkaId]) {
          kolejkaPoints[kolejkaId] = [];
        }
        kolejkaPoints[kolejkaId].push(bet);
      });

      let maxPoints = 0;
      let bestKolejkaId = null;
      let totalPoints = 0;
      let totalKolejkas = 0;
      let mostCorrectTypes = 0;
      let mostCorrectResults = 0;
      let mostCorrectTypesWithResults = 0;

      for (const kolejkaId in kolejkaPoints) {
        const kolejekBets = kolejkaPoints[kolejkaId];
        const { points, correctTypes, correctResults, correctTypesWithResults } = calculatePoints(kolejekBets, results);

        totalPoints += points;
        totalKolejkas++;

        if (points > maxPoints) {
          maxPoints = points;
          bestKolejkaId = kolejkaId;
        }

        mostCorrectTypes = Math.max(mostCorrectTypes, correctTypes);
        mostCorrectResults = Math.max(mostCorrectResults, correctResults);
        mostCorrectTypesWithResults = Math.max(mostCorrectTypesWithResults, correctTypesWithResults);

        kolejekBets.forEach((bet) => {
          const team = bet.home || bet.away;
          const result = results[bet.id];
          if (result) {
            const [homeScore, awayScore] = result.split(':').map(Number);

            // Track score choices globally
            const score = `${homeScore}:${awayScore}`;
            if (!scoreChoices[score]) {
              scoreChoices[score] = 0;
            }
            scoreChoices[score]++;
          }
        });
      }

      const averagePoints = totalKolejkas > 0 ? (totalPoints / totalKolejkas).toFixed(2) : 0;

      return {
        user,
        points: maxPoints,
        bestKolejkaId,
        averagePoints,
        mostCorrectTypes,
        mostCorrectResults,
        mostCorrectTypesWithResults,
      };
    });

   

    const mostChosenFailedTeamData = Object.keys(teamFails).map(team => ({
      team,
      chosen: teamChoices[team],
      failed: teamFails[team],
    })).sort((a, b) => b.failed - a.failed || b.chosen - a.chosen)[0];

    setMostChosenFailedTeam(mostChosenFailedTeamData);

    Object.keys(submittedData).forEach((user) => {
      const bets = submittedData[user]?.filter(Boolean) || [];
      const teamCount = {};

      bets.forEach((bet) => {
        const team = bet.bet === '1' ? bet.home : bet.bet === '2' ? bet.away : null;
        if (team) {
          if (!teamCount[team]) {
            teamCount[team] = 0;
          }
          teamCount[team]++;
        }
      });

      const favoriteTeam = Object.keys(teamCount).reduce((a, b) => teamCount[a] > teamCount[b] ? a : b, null);
      userFavoriteTeams[user] = { team: favoriteTeam || 'Brak' };  // Default to 'Brak' if no favorite team
    });

    setFavoriteTeams(userFavoriteTeams);

    const mostChosenCorrectTeamData = Object.keys(teamCorrectChoices).map(team => ({
      team,
      correctChoices: teamCorrectChoices[team],
      totalChoices: teamChoices[team],
    })).sort((a, b) => b.correctChoices - a.correctChoices || b.totalChoices - a.totalChoices)[0];

    setMostChosenCorrectTeam(mostChosenCorrectTeamData);

    updatedTableData.sort((a, b) => b.points - a.points);

    const maxPoints = Math.max(...updatedTableData.map(entry => entry.points));
    const maxCorrectTypes = Math.max(...updatedTableData.map(entry => entry.mostCorrectTypes));
    const maxCorrectTypesWithResults = Math.max(...updatedTableData.map(entry => entry.mostCorrectTypesWithResults));

    const hallOfFameData = [
      {
        title: "Najwięcej pkt w jednej kolejce",
        value: maxPoints,
        users: updatedTableData.filter(entry => entry.points === maxPoints).map(entry => entry.user),
      },
      {
        title: "Najwięcej typów ☑️ * w jednej kolejce",
        value: maxCorrectTypes,
        users: updatedTableData.filter(entry => entry.mostCorrectTypes === maxCorrectTypes).map(entry => entry.user),
      },
      {
        title: "Najwięcej typ+wynik ✅☑️ w jednej kolejce",
        value: maxCorrectTypesWithResults,
        users: updatedTableData.filter(entry => entry.mostCorrectTypesWithResults === maxCorrectTypesWithResults).map(entry => entry.user),
      },
    ];

    const averagePointsData = updatedTableData.map(entry => ({
      value: entry.averagePoints,
      user: entry.user,
    }));

    setHallOfFame(hallOfFameData);
    setAveragePoints(averagePointsData.sort((a, b) => b.value - a.value));

    setUpdatedTableData(updatedTableData);

  }, [submittedData, results]);

  return (
    <Container fluid style={linkContainerStyle}>
      <Row>
        <Col md={12}>
          <h2 style={{ textAlign: 'center' }}>Statystyki</h2>
          <hr />
          <h3 style={{ textAlign: 'center', fontFamily: 'Rubik' }}>🏆 Rekordy ligi 🏆</h3><hr />

          <Table>
            <thead>
              <tr>
                <th>Gracz</th>
                <th>Najwięcej pkt</th>
                
                <th>Średnie Punkty</th>
                <th>Najwięcej Typów ☑️</th>
                <th>Typ + Wynik ✅☑️</th>
                <th>Najczesciej wybierany zespół</th>
              
              </tr>
            </thead>
            <tbody>
              {updatedTableData.map((entry) => {
                return (
                  <tr key={entry.user}>
                    <td>{entry.user}</td>
                    <td>{entry.points} (w kolejce nr {entry.bestKolejkaId})</td>
                    
                    <td>{entry.averagePoints}</td>
                    <td>{entry.mostCorrectTypes}</td>
                    <td>{entry.mostCorrectTypesWithResults}</td>
                    <td>{favoriteTeams[entry.user]?.team || 'Brak'}</td>
                    
                  </tr>
                );
              })}
            </tbody>
          </Table>

          

        </Col>
      </Row>
    </Container>
  );
};

export default Stats;
