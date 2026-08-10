import { Link } from 'react-router-dom';
import { ArrowLeft, Code, Briefcase, Mail, GraduationCap, Award, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Developers() {
  return (
    <div className="dev-page-container">

      <div className="dev-content">
        <motion.div
          className="dev-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="dev-title">
            Meet the <span>Developer</span>
            <div className="title-underline"></div>
          </h1>
          <p className="dev-subtitle">
            Passionate about crafting intelligent web solutions and leveraging AI technologies to solve real-world challenges with innovation.
          </p>
        </motion.div>

        <motion.div
          className="dev-profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="dev-profile-image">
            <img src="/Profile - Phtoto.jpg" alt="Palash Rai" className="dev-photo" />
          </div>
          <div className="dev-profile-info">
            <h2>Palash Rai</h2>
            <div className="dev-tags">
              <span className="dev-tag">{'<>'} Software Developer</span>
              <span className="dev-separator">|</span>
              <span className="dev-tag">🎓 Computer Science and Engineering</span>
            </div>
            <div className="dev-social-buttons">
              <a href="https://github.com/Palash-r26" target="_blank" rel="noreferrer" className="social-btn github">
                <Code size={16} /> GitHub <ExternalLink size={14} className="ext-icon" />
              </a>
              <a href="https://linkedin.com/in/palash-rai2612" target="_blank" rel="noreferrer" className="social-btn linkedin">
                <Briefcase size={16} /> LinkedIn <ExternalLink size={14} className="ext-icon" />
              </a>
              <a href="mailto:palashr2612@gmail.com" className="social-btn email">
                <Mail size={16} /> Email
              </a>
            </div>
          </div>
        </motion.div>

        <div className="dev-grid">
          <motion.div
            className="dev-grid-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <GraduationCap size={20} className="card-icon" />
              <h3>EDUCATION</h3>
            </div>
            <div className="card-body">
              <h4 className="school-name">Madhav Institute of Technology & Science</h4>
              <p className="school-location">Gwalior, Madhya Pradesh</p>

              <div className="education-row">
                <span className="label">Degree</span>
                <span className="value font-medium">B.Tech</span>
              </div>
              <div className="education-row">
                <span className="label">Duration</span>
                <span className="value font-medium">2024 - 2028</span>
              </div>
              <div className="education-row">
                <span className="label">Branch</span>
                <span className="value branch-highlight">Computer Science & Design</span>
              </div>
              <div className="cgpa-box">
                <span className="cgpa-label">CGPA</span>
                <span className="cgpa-value">8.92</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="dev-grid-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-header">
              <Award size={20} className="card-icon" />
              <h3>KEY ACHIEVEMENTS & CONTRIBUTIONS</h3>
            </div>
            <div className="card-body">
              <ul className="achievements-list">
                <li>
                  <span className="bullet">🌟</span>
                  <span>Architected the core ApplyBuddy Chrome Extension integration and dynamic profile Vault from scratch.</span>
                </li>
                <li>
                  <span className="bullet">🌟</span>
                  <span>Maintained outstanding academic performance with a consistent 8.88 CGPA in engineering.</span>
                </li>
                <li>
                  <span className="bullet">🌟</span>
                  <span>Engineered the robust PostgreSQL backend for secure, scalable user profile and field management.</span>
                </li>
                <li>
                  <span className="bullet">🌟</span>
                  <span>Implemented responsive React UI with seamless dark mode support and interactive layout controls.</span>
                </li>
                <li>
                  <span className="bullet">🌟</span>
                  <span>Built fully-secured JWT session workflows and robust authentication endpoints for Vault access.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="dev-portfolio-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="portfolio-icon">
            <ExternalLink size={24} />
          </div>
          <h3>Explore My Portfolio</h3>
          <p>
            Beyond the highlighted projects, my portfolio showcases case studies, technical insights, core skills, tech stacks, and my professional journey.
          </p>
          <a href="https://palashrai.me/" target="_blank" rel="noreferrer" className="portfolio-btn interactive">
            <ExternalLink size={18} />
            Visit Portfolio <ExternalLink size={14} className="ext-icon" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
