import React, { useState } from 'react';
import './styles/controls.css';

const RoomDescriptionInput = ({ onDescriptionSubmit, disabled }) => {
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (description.trim()) {
      onDescriptionSubmit(description);
      setDescription(''); // Clear input after submission
    }
  };

  return (
    <div className="room-description-input">
      <h3>Room Description</h3>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your room (e.g., 'A 12x15 foot bedroom with two windows on the north wall and a door on the east wall')"
        rows={4}
        disabled={disabled}
        className="description-textarea"
      />
      <button 
        onClick={handleSubmit}
        disabled={disabled || !description.trim()}
        className="generate-button"
      >
        Generate Room
      </button>
    </div>
  );
};

export default RoomDescriptionInput;