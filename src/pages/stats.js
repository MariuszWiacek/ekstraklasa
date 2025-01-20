import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { Line } from 'react-chartjs-2'; // Importing Line chart from Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Firebase configuration
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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [userStats, setUserStats] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [bestPerformersByKolejka, setBestPerformersByKolejka] = useState([]);

  useEffect(() => {
    // Fetch results
    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      setResults(data || {});
    });

    // Fetch submitted data
    const submittedDataRef = ref(database, 'submittedData');
    onValue(submittedDataRef, (snapshot) => {
      const data = snapshot.val();
      setSubmittedData(data || {});
    });
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

    const userStatsData = [];
    const hallOfFameData = [];
    const kolejkaPoints = [];
    const bestPerformersData = [];

    Object.keys(submittedData).forEach((user) => {
      const bets = Object.entries(submittedData[user] || {});
      const userStats = {
        user,
        kolejki: [],
        maxPointsInOneKolejka: 0,
      };

      bets.forEach(([id, bet]) => {
        const result = results[id];
        if (!result || (!bet.home && !bet.away)) return;

        const { home: homeTeam, away: awayTeam, bet: betOutcome } = bet;
        const [homeScore, awayScore] = result.split(':').map(Number);
        const actualOutcome = homeScore === awayScore ? 'X' : homeScore > awayScore ? '1' : '2';

        const kolejkaId = Math.floor((id - 1) / 9); // assuming each kolejka has 9 games
        if (!userStats.kolejki[kolejkaId]) {
          userStats.kolejki[kolejkaId] = { points: 0 };
        }

        const userKolejka = userStats.kolejki[kolejkaId];
        const isSuccess = betOutcome === actualOutcome;
        userKolejka.points += isSuccess ? 3 : 0;

        userStats.maxPointsInOneKolejka = Math.max(userStats.maxPointsInOneKolejka, userKolejka.points);
      });

      userStatsData.push(userStats);

      if (userStats.maxPointsInOneKolejka >= 20) {
        hallOfFameData.push(userStats);
      }
    });

    const kolejkiCount = Math.max(...userStatsData.map(user => user.kolejki.length));
    for (let i = 0; i < kolejkiCount; i++) {
      let maxPoints = 0;
      const bestPerformers = [];

      userStatsData.forEach(user => {
        if (user.kolejki[i] && user.kolejki[i].points > maxPoints) {
          maxPoints = user.kolejki[i].points;
        }
      });

      userStatsData.forEach(user => {
        if (user.kolejki[i] && user.kolejki[i].points === maxPoints) {
          bestPerformers.push(user.user);
        }
      });

      bestPerformersData.push({ kolejka: i + 1, maxPoints, bestPerformers });
    }

    setUserStats(userStatsData);
    setHallOfFame(hallOfFameData);
    setBestPerformersByKolejka(bestPerformersData);
  }, [submittedData, results]);

  return (
    <Container fluid>
      <Row>
        <Col md={12}>
          <h2 style={{ textAlign: 'center' }}>Statystyki Użytkowników</h2>
          <hr />
          {userStats.length > 0 ? (
            userStats.map((userStats, idx) => (
              <div key={idx}>
                <h3>{userStats.user}</h3>
                <p><strong>🎖️ Najwięcej Punktów w Jednej Kolejce: </strong> {userStats.maxPointsInOneKolejka}</p>
                <hr />
              </div>
            ))
          ) : (
            <p>------</p>
          )}

          <h2>Najlepsi w Kolejce</h2>
          <hr />
          {bestPerformersByKolejka.map((kolejka, idx) => (
            <div key={idx}>
              <h3>Kolejka {kolejka.kolejka}</h3>
              <p><strong>Maksymalne Punkty: </strong> {kolejka.maxPoints}</p>
              <p><strong>Najlepsi: </strong> {kolejka.bestPerformers.join(', ')}</p>
              <hr />
            </div>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default Stats;