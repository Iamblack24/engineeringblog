import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './WorkshopsPage.css';

const WorkshopsPage = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  const workshops = [
    {
      id: 1,
      title: "BIM Workshop Series",
      date: "2024-04-28T15:00:00",
      type: "Technical",
      image: "/build.jpg",
      attendees: 150,
      speaker: "John Smith",
      duration: "2 hours",
      description: "Learn advanced BIM techniques and best practices for modern construction projects. This hands-on workshop will cover the latest tools and workflows.",
      price: "Ksh 5000",
      location: "Online",
      skills: ["Revit", "AutoCAD", "BIM 360"]
    },
    {
      id: 2,
      title: "Structural Analysis Workshop",
      date: "2024-05-10T13:00:00",
      type: "Practical",
      image: "/interior4.jpg",
      attendees: 100,
      speaker: "Dr. Emily Chen",
      duration: "3 hours",
      description: "Master structural analysis techniques using modern software tools. Includes real-world case studies and practical exercises.",
      price: "Ksh 6000",
      location: "Virtual",
      skills: ["SAP2000", "ETABS", "Excel"]
    },
    {
      id: 3,
      title: "AutoCAD Masterclass",
      date: "2024-05-15T14:00:00",
      type: "Software",
      image: "/cad2.jpg",
      attendees: 200,
      speaker: "Michael Roberts",
      duration: "4 hours",
      description: "From basics to advanced techniques, learn everything you need to know about AutoCAD for engineering design.",
      price: "Ksh 4500",
      location: "Online",
      skills: ["2D Drawing", "3D Modeling", "Layout Design"]
    }
  ];

  const handleRegister = async (e, workshop) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('https://formsubmit.co/otienojohnmicheal2@gmail.com', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Registration successful! Workshop details will be sent to your email.');
        setSelectedWorkshop(null);
      }
    } catch (error) {
      alert('Registration failed. Please try again later.');
    }
  };

  return (
    <motion.div 
      className="workshops-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1>Engineering Workshops</h1>
        <p>Hands-on learning experiences to enhance your engineering skills</p>
      </div>

      <div className="workshops-grid">
        {workshops.map((workshop) => {
          const workshopDate = new Date(workshop.date);
          const isUpcoming = workshopDate > new Date();
          
          return (
            <motion.div 
              key={workshop.id}
              className="workshop-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="workshop-image-container">
                <img
                  src={workshop.image}
                  alt={workshop.title}
                  className="workshop-image"
                  loading="lazy"
                />
                <div className="workshop-type-badge">
                  {workshop.type}
                </div>
                {isUpcoming && (
                  <div className="live-badge">
                    <span className="pulse"></span>
                    Upcoming
                  </div>
                )}
              </div>
              
              <div className="workshop-content">
                <div className="workshop-meta">
                  <span className="workshop-date">
                    {workshopDate.toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="workshop-time">
                    {workshopDate.toLocaleTimeString('en-US', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="workshop-duration">{workshop.duration}</span>
                </div>
                <div className="text">  
                <h3>{workshop.title}</h3>
                <p>{workshop.description}</p>
                </div>
                
                <div className="skills-container">
                  {workshop.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>

                <div className="workshop-details">
                  <div className="workshop-speaker">
                    <i className="fas fa-user"></i>
                    {workshop.speaker}
                  </div>
                  <div className="workshop-location">
                    <i className="fas fa-map-marker-alt"></i>
                    {workshop.location}
                  </div>
                  <div className="workshop-attendees">
                    <i className="fas fa-users"></i>
                    {workshop.attendees} spots
                  </div>
                  <div className="workshop-price">
                    <i className="fas fa-ticket-alt"></i>
                    {workshop.price}
                  </div>
                </div>

                <button 
                  className="register-button"
                  onClick={() => setSelectedWorkshop(workshop)}
                >
                  Register Now
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedWorkshop && (
        <div className="registration-modal">
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => setSelectedWorkshop(null)}
            >
              ×
            </button>
            <h2>Register for {selectedWorkshop.title}</h2>
            <form onSubmit={(e) => handleRegister(e, selectedWorkshop)}>
              <input type="hidden" name="_subject" value={`New Workshop Registration: ${selectedWorkshop.title}`} />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="true" />
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="Full Name" 
                  required 
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="Email Address" 
                  required 
                  placeholder="Enter your email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="Phone Number" 
                  required 
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience">Experience Level</label>
                <select id="experience" name="Experience Level" required>
                  <option value="">Select your experience level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="expectations">What do you hope to learn?</label>
                <textarea 
                  id="expectations" 
                  name="Learning Expectations"
                  rows="3"
                  placeholder="Brief description of your learning goals"
                ></textarea>
              </div>
              <button type="submit" className="submit-button">
                Complete Registration
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WorkshopsPage;