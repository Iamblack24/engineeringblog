import React, { useState } from 'react';
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
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [graphType, setGraphType] = useState('line'); // Default graph type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResponse, setShowResponse] = useState(false); // New state variable

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setGraphData(null);
    setShowResponse(false); // Hide response initially

    try {
      const response = await axios.post('https://enginehub.onrender.com/api/ask', {
        question,
      });

      const aiResponse = response.data.answer;
      setAnswer(aiResponse);
      setShowResponse(true); // Show response on success

      // Attempt to extract JSON data from the AI response
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
    </div>
  );
};

export default InteractiveAI;