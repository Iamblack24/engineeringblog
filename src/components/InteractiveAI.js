import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AuthContext } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure you import the Firestore instance
import './InteractiveAI.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const InteractiveAI = () => {
  const { currentUser } = useContext(AuthContext);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResponse, setShowResponse] = useState(false); // State to control response visibility
  const [aiUsage, setAiUsage] = useState(0); // Track AI usage count

  // Function to get today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchAiUsage = async () => {
      if (!currentUser) return;

      const today = getToday();
      const usageDocRef = doc(db, 'users', currentUser.uid, 'usage', 'ai');

      try {
        const usageDoc = await getDoc(usageDocRef);
        if (usageDoc.exists()) {
          const usageData = usageDoc.data();
          if (usageData.date === today) {
            setAiUsage(usageData.count);
          } else {
            await setDoc(usageDocRef, { date: today, count: 0 });
            setAiUsage(0);
          }
        } else {
          await setDoc(usageDocRef, { date: today, count: 0 });
          setAiUsage(0);
        }
      } catch (error) {
        console.error('Error fetching AI usage:', error);
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
    const USAGE_LIMIT = 30;

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
        }
      } else {
        // Initialize usage document if it doesn't exist
        await setDoc(usageDocRef, { date: today, count: 0 });
      }

      if (currentCount >= USAGE_LIMIT) {
        setError('You have reached your daily AI usage limit. Please try again tomorrow.');
        return;
      }

      setLoading(true);

      // Send question to backend AI server
      const response = await axios.post('https://enginehub.onrender.com/api/ask', {
        question,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is valid
      const aiResponse = response.data.answer;
      const graphData = response.data.graphData;

      setAnswer(aiResponse);

      if (graphData) {
        setGraphData({
          labels: graphData.labels,
          datasets: graphData.datasets.map(dataset => ({
            ...dataset,
            fill: false,
            borderWidth: 2,
          })),
        });
      }

      // Update usage count in Firestore
      await setDoc(usageDocRef, { date: today, count: currentCount + 1 }, { merge: true });

      setShowResponse(true); // Show the response
    } catch (err) {
      console.error(err);
      setError('Failed to communicate with the AI service.');
    } finally {
      setLoading(false);
    }
  };

  const renderGraph = () => {
    if (!graphData) return null;

    return (
      <Line
        data={graphData}
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Shear Force Diagram',
            },
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Shear Force (kN)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Length of beam (m)',
              },
            },
          },
        }}
      />
    );
  };

  const renderStructuredResponse = (response) => {
    const paragraphs = response.split('\n\n').map((para, index) => {
      if (para.startsWith('- ')) {
        const items = para.split('\n').map((item, idx) => <li key={idx}>{item.replace('- ', '')}</li>);
        return <ul key={index}>{items}</ul>;
      } else if (para.match(/^\d+\.\s/)) {
        const items = para.split('\n').map((item, idx) => <li key={idx}>{item.replace(/^\d+\.\s/, '')}</li>);
        return <ol key={index}>{items}</ol>;
      } else {
        return <p key={index}>{para}</p>;
      }
    });
    return paragraphs;
  };

  return (
    <div className="interactive-ai">
      <h1>Engineering AI Assistant</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your engineering question..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Interact'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {showResponse && answer && (
        <div className="response">
          {renderStructuredResponse(answer.replace(/```json[\s\S]*?```/, '').trim())}
        </div>
      )}

      {graphData && (
        <div className="graph-section">
          {renderGraph()}
        </div>
      )}

      {/* Display AI Usage Information */}
      {currentUser && (
        <div className="ai-usage">
          <p>
            AI Usage Today: {aiUsage} / 30
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveAI;