import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 100%)',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3.5rem', marginBottom: '0.7rem' }} aria-label="Lost robot">
        🤖
      </div>
      <h1 style={{
        fontSize: '2.1rem',
        marginBottom: '0.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        color: '#fff',
        textShadow: '0 2px 8px #0004'
      }}>
        Oops! We can't find that page.
      </h1>
      <p style={{
        fontSize: '1.15rem',
        marginBottom: '1.3rem',
        color: '#e0e7ef',
        maxWidth: 420,
        lineHeight: 1.6,
        textShadow: '0 1px 4px #0003'
      }}>
        This page may have been moved, deleted, or (like your socks in the laundry) just vanished mysteriously.<br />
        <span style={{ color: '#a78bfa', fontWeight: 500 }}>But don’t worry, it’s not your fault!</span>
      </p>
      <div style={{
        display: 'flex',
        gap: '0.7rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: '1.3rem'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#1e293b',
            color: '#a78bfa',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            minWidth: 110,
          }}
        >
          ⬅ Go Back
        </button>
        <Link
          to="/"
          style={{
            background: '#a78bfa',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            minWidth: 110,
            display: 'inline-block'
          }}
        >
          🏠 Home
        </Link>
        <Link
          to="/educational-resources"
          style={{
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            minWidth: 110,
            display: 'inline-block'
          }}
        >
          📄 Browse Docs
        </Link>
        <Link
          to="/contact"
          style={{
            background: '#1e293b',
            color: '#a78bfa',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            minWidth: 110,
            display: 'inline-block'
          }}
        >
          📞 Contact Us
        </Link>
        {currentUser && (
          <>
            <Link
              to="/articles"
              style={{
                background: '#0ea5e9',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.1rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '1rem',
                minWidth: 110,
                display: 'inline-block'
              }}
            >
              📰 Articles
            </Link>
            <Link
              to="/tools"
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.1rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '1rem',
                minWidth: 110,
                display: 'inline-block'
              }}
            >
              🛠️ Tools
            </Link>
            <Link
              to="/community"
              style={{
                background: '#f59e42',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.1rem',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '1rem',
                minWidth: 110,
                display: 'inline-block'
              }}
            >
              💬 Community
            </Link>
          </>
        )}
      </div>
      <div style={{
        marginTop: '1.2rem',
        color: '#a1a1aa',
        fontSize: '1.05rem',
        textShadow: '0 1px 4px #0002'
      }}>
        <span>
          Need help? <Link to="/contact" style={{ color: '#a78bfa', textDecoration: 'underline' }}>Contact our support team</Link>.
        </span>
      </div>
      <div style={{
        marginTop: '2rem',
        fontSize: '1.1rem',
        color: '#a1a1aa',
        maxWidth: 350,
        textShadow: '0 1px 4px #0002'
      }}>
        <em>
          “This page took the day off. Maybe it’s at the beach with your missing socks.” 🧦🏖️
        </em>
      </div>
      <style>
        {`
          @media (max-width: 600px) {
            h1 { font-size: 1.3rem !important; }
            p { font-size: 1rem !important; }
            div[aria-label] { font-size: 2.2rem !important; }
            .notfound-btns { flex-direction: column !important; gap: 0.5rem !important; }
          }
        `}
      </style>
    </div>
  );
};

export default NotFoundPage;