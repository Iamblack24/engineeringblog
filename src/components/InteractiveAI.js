// src/components/InteractiveAI.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import './InteractiveAI.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const InteractiveAI = () => {
  const { currentUser } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [graphType, setGraphType] = useState('line'); // Default graph type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResponse, setShowResponse] = useState(false); // State to control response visibility
  const [aiUsage, setAiUsage] = useState(0); // Track AI usage count

  // Function to get today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchAiUsage = async () => {
      if (currentUser) {
        const today = getToday();
        const usageDocRef = doc(db, 'users', currentUser.uid, 'usage', 'ai');

        try {
          const usageDoc = await getDoc(usageDocRef);
          if (usageDoc.exists()) {
            const usageData = usageDoc.data();
            if (usageData.date === today) {
              setAiUsage(usageData.count);
            } else {
              // Reset usage count for a new day
              await setDoc(usageDocRef, { date: today, count: 0 });
              setAiUsage(0);
            }
          } else {
            // Initialize usage document
            await setDoc(usageDocRef, { date: today, count: 0 });
            setAiUsage(0);
          }
        } catch (err) {
          console.error('Error fetching AI usage:', err);
          setError('Failed to fetch usage data. Please try again.');
        }
      }
    };

    fetchAiUsage();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAnswer('');
    setGraphData(null);
    setShowResponse(false); // Hide response initially

    if (!currentUser) {
      setError('You need to be logged in to use the AI assistant.');
      return;
    }

    // Define usage limits 
    const USAGE_LIMIT = 50;

    try {
      // Reference to user's AI usage document
      const today = getToday();
      const usageDocRef = doc(db, 'users', currentUser.uid, 'usage', 'ai');

      // Get current usage
      const usageDoc = await getDoc(usageDocRef);
      let currentCount = 0;

      if (usageDoc.exists()) {
        const usageData = usageDoc.data();
        if (usageData.date === today) {
          currentCount = usageData.count;
        } else {
          // Reset usage count for a new day
          await setDoc(usageDocRef, { date: today, count: 0 });
          currentCount = 0;
          setAiUsage(0);
        }
      } else {
        // Initialize usage document
        await setDoc(usageDocRef, { date: today, count: 0 });
        currentCount = 0;
        setAiUsage(0);
      }

      if (currentCount >= USAGE_LIMIT) {
        setError('You have reached your daily AI usage limit. Please try again tomorrow.');
        return;
      }

      setLoading(true);

      // Send question to backend AI server
      const response = await axios.post('https://enginehub.onrender.com/api/ask', {
        question,
      });

      const aiResponse = response.data.answer;
      setAnswer(aiResponse);
      setShowResponse(true); // Show response on success

      // Increment usage count in Firestore
      await updateDoc(usageDocRef, { count: increment(1) });
      setAiUsage((prevCount) => prevCount + 1);

      // Attempt to extract JSON data from the AI response for graphing
      const jsonDataMatch = aiResponse.match(/Graph Data:\s*(\{[\s\S]*\})/);

      if (jsonDataMatch && jsonDataMatch[1]) {
        const jsonData = JSON.parse(jsonDataMatch[1]);
        setGraphData(jsonData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGraph = () => {
    if (!graphData) return null;

    const data = {
      labels: graphData.labels,
      datasets: [
        {
          label: graphData.label,
          data: graphData.values,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: graphData.label,
        },
      },
    };

    switch (graphType) {
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'line':
      default:
        return <Line data={data} options={options} />;
    }
  };

  return (
    <div className="interactive-ai">
      <h2>AI Built Environment Assistant</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the built environment..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Ask AI'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {showResponse && answer && (
        <div className="response">
          <h3>AI Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
      {graphData && (
        <div className="graph-section">
          <h3>Graphical Representation:</h3>
          <div className="graph-controls">
            <label htmlFor="graphType">Select Graph Type: </label>
            <select
              id="graphType"
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="pie">Pie</option>
            </select>
          </div>
          {renderGraph()}
        </div>
      )}
      {/* Display AI Usage Information */}
      {currentUser && (
        <div className="ai-usage">
          <p>
            AI Usage Today: {aiUsage} / 50
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveAI;