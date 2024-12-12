import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import the Link component
import './HomePage.css'; // Import the CSS file for styling
import NewsletterSignup from '../components/NewsletterSignup'; // Import the NewsletterSignup component
import { motion } from 'framer-motion'; // Add this import for smooth animations
// This useEffect hook handles the animation of the hero images and overlay
const facts = [
  {
    fact: "The Burj Khalifa uses a unique Y-shaped plan to reduce wind forces.",
    icon: "🏗️"
  },
  {
    fact: "The concrete in the Hoover Dam is still curing and gaining strength today.",
    icon: "🏊"
  },
  {
    fact: "The Golden Gate Bridge's color was originally chosen for its visibility in fog.",
    icon: "🌉"
  },
  {
    fact: "The Sydney Opera House's tiles are self-cleaning.",
    icon: "🏛️"
  },
  {
    fact: "The Millau Viaduct in France is taller than the Eiffel Tower.",
    icon: "🚗"
  },
  {
    fact: "The Empire State Building has its own ZIP code.",
    icon: "🏙️"
  },
  {
    fact: "The Channel Tunnel linking UK and France has an average depth of 50m below the seabed.",
    icon: "🚂"
  },
  {
    fact: "The Three Gorges Dam is so massive it slightly slowed the Earth's rotation.",
    icon: "⚡"
  }
];

const HomePage = () => {
  const [randomFact, setRandomFact] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFactRotating, setIsFactRotating] = useState(false);

  const images = [
    '/interior1.webp',
    '/interior2.webp',
    '/interior3.webp',
  ];  

  const valuePropositions = [
    "Build Better with Engineering Hub",
    "Your Engineering Career Companion",
    "Tools, Resources, Community - All in One Place",
  ];

  const [currentProposition, setCurrentProposition] = useState(0);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * facts.length);
    setRandomFact(facts[randomIndex]);
  
    const interval = setInterval(() => {
      setShowOverlay(false);
      setTimeout(() => {
        setShowOverlay(true);
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Increased from 3000 to 5000 - text stays longer
      }, 3000);
    }, 8000); // Increased from 6000 to 8000 - overall cycle longer

    const propositionInterval = setInterval(() => {
      setCurrentProposition((prev) => (prev + 1) % valuePropositions.length);
    }, 4000); // Change every 4 seconds

    return () => {
      clearInterval(interval);
      clearInterval(propositionInterval);
    };
  }, [images.length, valuePropositions.length]);

  const featuredTools = [
    {
      id: 1,
      name: "Beam Calculator",
      description: "Calculate beam deflection, moment, and shear force",
      icon: "🏗️",
      usageCount: "2.5k",
      category: "Structural",
      link: "/tools/beam-calculator"
    },
    {
      id: 2,
      name: "Unit Converter",
      description: "Convert between different engineering units",
      icon: "⚖️",
      usageCount: "3.8k",
      category: "General",
      link: "/tools/unit-conversion"
    },
    {
      id: 3,
      name: "Steel Section Database",
      description: "Comprehensive database of steel sections and properties",
      icon: "🔧",
      usageCount: "1.9k",
      category: "Materials",
      link: "/tools/steel-sections"
    },
    {
      id: 4,
      name: "Concrete Mix Designer",
      description: "Design optimal concrete mixes for your projects",
      icon: "🧱",
      usageCount: "2.1k",
      category: "Materials",
      link: "/tools/concrete-mix-design"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Sustainable Engineering Practices Webinar",
      date: "2024-04-15T14:00:00",
      type: "Webinar",
      image: "/front.jpeg",
      attendees: 234,
      speaker: "Dr. Sarah Chen",
      duration: "1.5 hours",
      link: "/webinars"
    },
    {
      id: 2,
      title: "Annual Engineering Conference 2024",
      date: "2024-05-20T09:00:00",
      type: "Conference",
      image: "/interior4.jpg",
      attendees: 500,
      location: "Virtual Event",
      duration: "2 days",
      link: "/events"
    },
    {
      id: 3,
      title: "BIM Workshop Series",
      date: "2024-04-28T15:00:00",
      type: "Workshop",
      image: "/build.jpg",
      attendees: 150,
      speaker: "John Smith",
      duration: "2 hours",
      link: "/workshops"
    }
  ];

  const featuredArticles = [
    {
      id: 1,
      title: "Engineering behind Kenya's iconic projects",
      excerpt: "Discover the latest advancements in construction technology and how they are revolutionizing the industry.",
      image: "/suez.jpeg", // Using WebP for better performance
      readTime: "5 min",
      category: "Technology",
      link: "/articles/11"
    },
    {
      id: 2,
      title: "Sustainable Engineering Practices",
      excerpt: "Learn about sustainable engineering practices that are helping to create a greener future.",
      image: "/sustainable.jpg",
      readTime: "7 min",
      category: "Sustainability",
      link: "/articles/2"
    },
    {
      id: 3,
      title: "Understanding structural loads",
      excerpt: "A comprehensive guide to understanding structural loads. Their types, effects and how to calculate them",
      image: "/louvre.jpeg",
      readTime: "6 min",
      category: "Innovation",
      link: "/articles/5"
    }
  ];

  const rotateFact = () => {
    if (!isFactRotating) {
      setIsFactRotating(true);
      const randomIndex = Math.floor(Math.random() * facts.length);
      setRandomFact(facts[randomIndex]);
      setTimeout(() => setIsFactRotating(false), 500);
    }
  };

  return (
    <>
      {/* Preload the hero image */}
      <link
        rel="preload"
        href={images[currentImageIndex]}
        as="image"
        type="image/webp"
        crossOrigin="anonymous"
      />
      <div className="home-page">
        <motion.section 
          className="hero-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {images.map((image, index) => (
            <motion.img
              key={index}
              src={image}
              alt={`Hero ${index + 1}`}
              className={`hero-image ${index === currentImageIndex ? 'active' : ''}`}
              initial={{ scale: 1.1 }}
              animate={{ 
                scale: index === currentImageIndex ? 1 : 1.1,
                opacity: index === currentImageIndex ? 1 : 0 
              }}
              transition={{ duration: 2, ease: "easeOut" }} // Increased duration
            />
          ))}
          
          <motion.div 
            className={`hero-overlay ${showOverlay ? 'active' : ''}`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: showOverlay ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="hero-content">
              <motion.h1
                key={currentProposition}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="hero-title"
              >
                {valuePropositions[currentProposition]}
              </motion.h1>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="hero-description"
              >
                Access professional engineering tools, resources, and a global community
                of engineers ready to collaborate and grow together.
              </motion.p>
              
              <motion.div
                className="hero-cta-group"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 1 }}
              >
                <Link to="/community" className="cta-link primary">
                  <motion.button 
                    className="cta-button primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Join Community
                  </motion.button>
                </Link>
                <Link to="/tools" className="cta-link secondary">
                  <motion.button 
                    className="cta-button secondary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Tools
                  </motion.button>
                </Link>
              </motion.div>

              <div className="hero-stats">
                <motion.div 
                  className="stat-item"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <span className="stat-number">5000+</span>
                  <span className="stat-label">Community Members</span>
                </motion.div>
                <motion.div 
                  className="stat-item"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <span className="stat-number">200+</span>
                  <span className="stat-label">Engineering Tools</span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="scroll-indicator"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 1.5 },
              opacity: { repeat: Infinity, duration: 1.5 }
            }}
          >
            <span className="scroll-arrow">↓</span>
            <span className="scroll-text">Scroll to explore</span>
          </motion.div>
        </motion.section>
        <motion.section 
          className="featured-tools-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2>Popular Engineering Tools</h2>
            <Link to="/tools" className="view-all-link">
              View All Tools <span>→</span>
            </Link>
          </div>
          
          <div className="tools-grid">
            {featuredTools.map((tool) => (
              <motion.div 
                key={tool.id}
                className="tool-card"
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 8px 30px rgba(100, 255, 218, 0.15)"
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-usage">{tool.usageCount} uses</div>
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
                <div className="tool-footer">
                  <span className="tool-category">{tool.category}</span>
                  <Link to={tool.link} className="try-tool-link">
                    Try Tool →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
        <motion.section 
          className="random-fact-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="fact-container">
            <h2>Did You Know?</h2>
            <motion.div 
              className="fact-content"
              animate={{ opacity: isFactRotating ? 0 : 1, y: isFactRotating ? 10 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="fact-icon">{randomFact.icon}</span>
              <p>{randomFact.fact}</p>
            </motion.div>
            <motion.button 
              className="rotate-fact-button"
              onClick={rotateFact}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isFactRotating}
            >
              <span className="button-text">Another Fact</span>
              <span className="button-icon">🔄</span>
            </motion.button>
          </div>
        </motion.section>
        <motion.section 
          className="content-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2>Learning Resources</h2>
            <p>Everything you need to advance your engineering career</p>
          </div>

          <div className="resources-grid">
            {[
              {
                title: "Articles",
                description: "Expert insights on construction, sustainability and project management",
                icon: "📚",
                image: "/articles.jpg",
                link: "/articles",
                category: "Knowledge",
                cta: "Read More"
              },
              {
                title: "Design Materials",
                description: "CAD designs, AI tools and comprehensive material properties guide",
                icon: "✏️",
                image: "/designmaterials.jpg",
                link: "/design-materials",
                category: "Tools",
                cta: "Explore"
              },
              {
                title: "Case Studies",
                description: "Real-world engineering projects and innovative solutions",
                icon: "🏗️",
                image: "/cad2.jpg",
                link: "/case-studies",
                category: "Practice",
                cta: "Learn More"
              },
              {
                title: "Engineering Tools",
                description: "Interactive calculators and visualization tools",
                icon: "🔧",
                image: "/cad3.jpg",
                link: "/tools",
                category: "Tools",
                cta: "Use Tools"
              },
              {
                title: "Revision Materials",
                description: "Exam preparation resources and practice questions",
                icon: "📝",
                image: "/build.jpg",
                link: "/revision-materials",
                category: "Study",
                cta: "Start Learning"
              },
              {
                title: "Career Guides",
                description: "Career paths, interview tips, and skill development",
                icon: "💼",
                image: "/last.jpg",
                link: "/career-guides",
                category: "Career",
                cta: "Explore Careers"
              }
            ].map((resource, index) => (
              <motion.div 
                key={resource.title}
                className="resource-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <div className="resource-image-container">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="resource-image"
                    loading={index > 2 ? "lazy" : "eager"}
                  />
                  <span className="resource-category">{resource.category}</span>
                  <span className="resource-icon">{resource.icon}</span>
                </div>
                
                <div className="resource-content">
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  
                  <Link to={resource.link} className="resource-link">
                    {resource.cta}
                    <motion.span 
                      className="arrow"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
        <motion.section 
          className="events-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="view-all-link">
              View Calendar <span>→</span>
            </Link>
          </div>

          <div className="events-grid">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isUpcoming = eventDate > new Date();
              
              return (
                <motion.div 
                  key={event.id}
                  className="event-card"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="event-image-container">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="event-image"
                      loading="lazy"
                    />
                    <div className="event-type-badge">
                      {event.type}
                    </div>
                    {isUpcoming && (
                      <div className="live-badge">
                        <span className="pulse"></span>
                        Upcoming
                      </div>
                    )}
                  </div>
                  
                  <div className="event-content">
                    <div className="event-meta">
                      <span className="event-date">
                        {eventDate.toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="event-time">
                        {eventDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="event-duration">{event.duration}</span>
                    </div>

                    <h3>{event.title}</h3>
                    
                    <div className="event-details">
                      {event.speaker && (
                        <div className="event-speaker">
                          <i className="fas fa-user"></i>
                          {event.speaker}
                        </div>
                      )}
                      {event.location && (
                        <div className="event-location">
                          <i className="fas fa-map-marker-alt"></i>
                          {event.location}
                        </div>
                      )}
                      <div className="event-attendees">
                        <i className="fas fa-users"></i>
                        {event.attendees} attending
                      </div>
                    </div>

                    <Link to={event.link} className="event-cta">
                      Register Now
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
        <section className="testimonials-section">
          <h2>What Our Readers Say</h2>
          <div className="testimonials-grid">
            <motion.div 
              className="testimonial"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p>"This site has been an invaluable resource for my studies. The articles and tools are top-notch!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  BM
                </div>
                <div className="author-info">
                  <div className="author-name">Bravin Michweya</div>
                  <div className="author-title">Civil Engineering Student</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="testimonial"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p>"The case studies provide great insights into real-world engineering challenges and solutions."</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  FB
                </div>
                <div className="author-info">
                  <div className="author-name">Fred Biya</div>
                  <div className="author-title">Structural Engineer</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        <motion.section 
          className="featured-articles-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-header">
            <h2>Featured Articles</h2>
            <Link to="/articles" className="view-all-link">
              Browse Library <span>→</span>
            </Link>
          </div>

          <div className="articles-grid">
            {featuredArticles.map((article, index) => (
              <motion.article 
                key={article.id}
                className="article-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="article-image-container">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    width="400"
                    height="225"
                  />
                  <span className="article-category">{article.category}</span>
                </div>
                
                <div className="article-content">
                  <div className="article-meta">
                    <span className="read-time">
                      <i className="far fa-clock"></i> {article.readTime}
                    </span>
                  </div>
                  
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  
                  <Link to={article.link} className="read-more-link">
                    Read Article
                    <motion.span 
                      className="arrow"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>
        <motion.section 
          className="founders-developers-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Team</h2>
          <div className="founders-grid">
            <motion.div 
              className="founder-developer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="founder-content">
                <h3>John Micheal</h3>
                <p>Founder and developer of Engineering Hub</p>
                <div className="social-links">
                  <motion.a 
                    href="https://www.linkedin.com/in/john-micheal-736bb71b4" 
                    target="_blank" 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-linkedin'></i>
                  </motion.a>
                  <motion.a 
                    href="https://x.com/gacharua?t=QQ2R-UjV2VmgHnkVfBD8OQ&s=08" 
                    target="_blank" 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-twitter'></i>
                  </motion.a>
                  <motion.a 
                    href="https://www.instagram.com/john.michael4228?igsh=YzljYTk1ODg3Zg==" 
                    target='_blank' 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-instagram'></i>
                  </motion.a>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="founder-developer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="founder-content">
                <h3>Owen Richard</h3>
                <p>Co-founder of Engineering Hub</p>
                <div className="social-links">
                  <motion.a 
                    href="https://www.linkedin.com/in/owen-richard-93737433a" 
                    target="_blank" 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-linkedin'></i>
                  </motion.a>
                  <motion.a 
                    href="https://x.com/richar94366?t=Btpo4QaAI6j_zGtEGw73PA&s=09" 
                    target='_blank' 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-twitter'></i>
                  </motion.a>
                  <motion.a 
                    href="https://www.instagram.com/_si.lento/profilecard/?igsh=d2ZlMm55ZG9xdHVy" 
                    target='_blank' 
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <i className='fab fa-instagram'></i>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
        <section className="newsletter-section">
          <NewsletterSignup />
        </section>
      </div>
    </>
  );
};

export default HomePage;