import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiStar, FiPlay, FiMenu, FiX } from 'react-icons/fi';
import '../assets/css/Landing.css';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const features = [
    {
      icon: '💧',
      title: 'Smart Watering',
      description: 'Automated watering system that delivers the perfect amount of water based on soil moisture, plant type, and environmental conditions.',
      color: 'blue'
    },
    {
      icon: '☀️',
      title: 'Light Optimization',
      description: 'Advanced light sensors monitor and optimize lighting conditions, ensuring your plants receive the ideal spectrum and intensity.',
      color: 'yellow'
    },
    {
      icon: '🔔',
      title: 'Health Alerts',
      description: 'Instant notifications about plant health issues, diseases, or care requirements sent directly to your smartphone.',
      color: 'red'
    },
    {
      icon: '📱',
      title: 'Mobile Dashboard',
      description: 'Complete plant management from your phone with real-time monitoring, care schedules, and growth tracking.',
      color: 'green'
    },
    {
      icon: '🤖',
      title: 'AI Plant Doctor',
      description: 'Machine learning algorithms analyze your plant data to provide personalized care recommendations and predict potential issues.',
      color: 'purple'
    },
    {
      icon: '📡',
      title: 'IoT Sensors',
      description: 'Network of wireless sensors monitoring temperature, humidity, soil pH, and nutrients for comprehensive plant care.',
      color: 'gray'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      location: 'San Francisco, CA',
      avatar: '👩‍🦰',
      rating: 5,
      text: 'PlantSmart completely transformed my plant care routine. I used to kill every plant I touched, but now my apartment is a thriving jungle! The AI recommendations are incredibly accurate.',
      plants: '12 plants thriving'
    },
    {
      name: 'Marcus Rodriguez',
      location: 'Austin, TX',
      avatar: '👨‍🦱',
      rating: 5,
      text: 'As a busy entrepreneur, I never had time for proper plant care. The automated watering system is a game-changer. My plants have never looked better, and I get peace of mind.',
      plants: '8 plants saved'
    },
    {
      name: 'Emily Watson',
      location: 'Portland, OR',
      avatar: '👩‍🦳',
      rating: 5,
      text: 'The health alerts saved my fiddle leaf fig from a pest infestation I never would have caught early. The mobile app makes monitoring so convenient and actually fun!',
      plants: '15 plants monitored'
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="nav-brand">
            <div className="brand-logo">🌱</div>
            <span className="brand-name">PlantSmart</span>
          </div>
          
          <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#benefits" onClick={() => setIsMenuOpen(false)}>Benefits</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-icon">🌱</span>
                Smart Plant Care Revolution
              </div>
              
              <h1 className="hero-title">
                Never Kill<br />
                <span className="text-gradient">Another Plant</span>
              </h1>
              
              <p className="hero-description">
                Transform your home into a thriving garden with AI-powered plant monitoring.
                Get real-time alerts, automated watering, and expert care recommendations.
              </p>
              
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Start Free Trial
                  <FiArrowRight className="btn-icon" />
                </Link>
                <button className="btn btn-secondary btn-large">
                  <FiPlay className="btn-icon" />
                  Watch Demo
                </button>
              </div>
              
              <div className="hero-features">
                <div className="feature-item">
                  <FiCheck className="check-icon" />
                  <span>14-day free trial</span>
                </div>
                <div className="feature-item">
                  <FiCheck className="check-icon" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="plant-card-demo">
                <div className="plant-card">
                  <div className="plant-icon">🌿</div>
                  <div className="plant-info">
                    <h4>Monstera Deliciosa</h4>
                    <div className="plant-metrics">
                      <div className="metric">
                        <span className="metric-label">Moisture</span>
                        <div className="metric-bar">
                          <div className="metric-fill" style={{width: '85%'}}></div>
                        </div>
                        <span className="metric-value">85%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Light</span>
                        <span className="metric-status perfect">Perfect</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Health</span>
                        <span className="metric-status excellent">Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">🌟 Advanced Features</div>
            <h2 className="section-title">
              Everything You Need for<br />
              <span className="text-gradient">Perfect Plant Care</span>
            </h2>
            <p className="section-description">
              Our comprehensive smart plant management system combines cutting-edge
              technology with intuitive design to make plant care effortless and enjoyable.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon ${feature.color}`}>
                  <span>{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <button className="feature-link">
                  Learn more <FiArrowRight />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">💚 Happy Plant Parents</div>
            <h2 className="section-title">
              Loved by Thousands of<br />
              <span className="text-gradient">Plant Enthusiasts</span>
            </h2>
            <p className="section-description">
              Don't just take our word for it. See what our community of plant lovers has to say
              about their PlantSmart experience.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="user-info">
                    <div className="user-avatar">{testimonial.avatar}</div>
                    <div className="user-details">
                      <h4 className="user-name">{testimonial.name}</h4>
                      <p className="user-location">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="user-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="star filled" />
                    ))}
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-footer">
                  <div className="plants-count">
                    <span className="plants-icon">🌱</span>
                    {testimonial.plants}
                  </div>
                  <span className="verified-badge">Verified Review</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Plant Care?</h2>
            <p className="cta-description">
              Join thousands of plant parents who never worry about their green friends again.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="brand-logo">🌱</div>
              <span className="brand-name">PlantSmart</span>
              <p className="brand-description">
                The future of intelligent plant care. Never let your plants suffer again.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#security">Security</a>
                <a href="#integrations">Integrations</a>
              </div>

              <div className="footer-section">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#blog">Blog</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>

              <div className="footer-section">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#docs">Documentation</a>
                <a href="#community">Community</a>
                <a href="#status">Status</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 PlantSmart. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;