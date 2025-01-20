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
  const [teamStats, setTeamStats] = useState({
    teamChosenCount: {},
    teamSuccessCount: {},
    teamFailureCount: {},
  });
  const [userStats, setUserStats] = useState([]);
  const [kolejkaPoints, setKolejkaPoints] = useState([]); // Points for each kolejka
  const [hallOfFame, setHallOfFame] = useState([]); // Hall of Fame data

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

    // Process submitted data
    Object.keys(submittedData).forEach((user) => {
      const bets = Object.entries(submittedData[user] || {});
      const userStats = {
        user,
        chosenTeams: {},
        mostChosenTeam: '',
        mostDisappointingTeam: '',
        mostSuccessfulTeam: '',
        maxPointsInOneKolejka: 0,
        kolejki: [],
      };

      const teamFailureCountUser = {};
      const teamSuccessCountUser = {};

      // Track statistics for each bet
      bets.forEach(([id, bet]) => {
        const result = results[id];
        if (!result || (!bet.home && !bet.away)) return;

        const { home: homeTeam, away: awayTeam, bet: betOutcome } = bet;
        const [homeScore, awayScore] = result.split(':').map(Number);
        const actualOutcome = homeScore === awayScore ? 'X' : homeScore > awayScore ? '1' : '2';

        // Collect data for user stats by Kolejka
        const kolejkaId = Math.floor((id - 1) / 9); // assuming each kolejka has 9 games
        if (!userStats.kolejki[kolejkaId]) {
          userStats.kolejki[kolejkaId] = { points: 0 };
        }

        const userKolejka = userStats.kolejki[kolejkaId];
        const isSuccess = betOutcome === actualOutcome;
        userKolejka.points += isSuccess ? 3 : 0; // 3 points for correct outcome

        // Update max points in one round
        userStats.maxPointsInOneKolejka = Math.max(userStats.maxPointsInOneKolejka, userKolejka.points);

        // Track team stats
        if (betOutcome === '1') {
          userStats.chosenTeams[homeTeam] = (userStats.chosenTeams[homeTeam] || 0) + 1;
          if (actualOutcome === '1') {
            teamSuccessCountUser[homeTeam] = (teamSuccessCountUser[homeTeam] || 0) + 1;
          } else {
            teamFailureCountUser[homeTeam] = (teamFailureCountUser[homeTeam] || 0) + 1;
          }
        } else if (betOutcome === '2') {
          userStats.chosenTeams[awayTeam] = (userStats.chosenTeams[awayTeam] || 0) + 1;
          if (actualOutcome === '2') {
            teamSuccessCountUser[awayTeam] = (teamSuccessCountUser[awayTeam] || 0) + 1;
          } else {
            teamFailureCountUser[awayTeam] = (teamFailureCountUser[awayTeam] || 0) + 1;
          }
        }
      });

      // Find the most chosen team
      userStats.mostChosenTeam = Object.entries(userStats.chosenTeams)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '------';

      // Find the most disappointing team
      userStats.mostDisappointingTeam = Object.entries(userStats.chosenTeams)
        .sort((a, b) => (teamFailureCountUser[b[0]] || 0) - (teamFailureCountUser[a[0]] || 0))[0]?.[0] || '------';

      // Find the most successful team
      userStats.mostSuccessfulTeam = Object.entries(userStats.chosenTeams)
        .sort((a, b) => (teamSuccessCountUser[b[0]] || 0) - (teamSuccessCountUser[a[0]] || 0))[0]?.[0] || '------';

      userStatsData.push(userStats);

      // Add to Hall of Fame
      if (userStats.maxPointsInOneKolejka >= 20) {
        hallOfFameData.push(userStats);
      }
    });

    setUserStats(userStatsData);
    setHallOfFame(hallOfFameData);
  }, [submittedData, results]);

  // Chart for user points per kolejka
  const getUserChartData = (userKolejki) => {
    const userPoints = userKolejki.map((kolejka) => kolejka.points);
    return {
      labels: userKolejki.map((_, index) => `Kolejka ${index + 1}`),
      datasets: [
        {
          label: 'Punkty użytkownika',
          data: userPoints,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
        },
      ],
    };
  };

  return (
    <Container fluid>
      <Row>
        <Col md={12}>
          <h2 style={{ textAlign: 'center' }}>Statystyki Użytkowników</h2>
          <hr />
          {userStats.map((userStats, idx) => (
            <div key={idx}>
              <h3>{userStats.user}</h3>
              <p><strong>⚽ Najczęściej Wybierana Drużyna:</strong> {userStats.mostChosenTeam}</p>
              <p><strong>👎 Najbardziej Zawodząca Drużyna:</strong> {userStats.mostDisappointingTeam}</p>
              <p><strong>👍 Najbardziej Punktująca Drużyna:</strong> {userStats.mostSuccessfulTeam}</p>
              <p><strong>🎖️ Najwięcej Punktów w Jednej Kolejce:</strong> {userStats.maxPointsInOneKolejka}</p>
              <Line 
                      data={getUserChartData(userStats.kolejki)} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              autoSkip: true,
                              maxTicksLimit: 5,
                            },
                          },
                          y: {
                            beginAtZero: false,
                            max: 27,
                          },
                        },
                      }} 
                      style={{ height: 'auto', width: '100%', backgroundColor: 'white', opacity: '0.8', color: 'red' }} 
                    />
              <hr />
            </div>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default Stats;