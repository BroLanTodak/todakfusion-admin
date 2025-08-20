import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Grid3X3, Target, Activity, Users, TrendingUp, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { 
      icon: Building2, 
      label: 'Strategic Foundation', 
      path: '/strategic-foundation', 
      color: '#9b59b6', 
      description: 'Core values, long-term objectives & strategic pillars'
    },
    { 
      icon: Eye, 
      label: 'Vision & Mission', 
      path: '/vision-mission', 
      color: '#3498db', 
      description: 'Define your company purpose and direction'
    },
    { 
      icon: Grid3X3, 
      label: 'Business Canvas', 
      path: '/canvas', 
      color: '#2ecc71', 
      description: 'Map your business model on one page'
    },
    { 
      icon: Target, 
      label: 'OKR', 
      path: '/okr', 
      color: '#f39c12', 
      description: 'Set and track objectives & key results'
    },
    { 
      icon: Activity, 
      label: 'SWOT Analysis', 
      path: '/swot', 
      color: '#e74c3c', 
      description: 'Analyze strengths, weaknesses, opportunities & threats'
    },
  ];

  const quickStats = [
    { label: 'Active OKRs', value: '12', trend: '+3' },
    { label: 'Divisions', value: '4', trend: '0' },
    { label: 'Team Members', value: '45', trend: '+5' },
    { label: 'Progress', value: '68%', trend: '+12%' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Todak Fusion Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, {user?.email}</p>
      </div>

      <div className={styles.quickStats}>
        {quickStats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
            {stat.trend && (
              <span className={`${styles.statTrend} ${stat.trend.startsWith('+') ? styles.positive : ''}`}>
                {stat.trend}
              </span>
            )}
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Business Planning Modules</h2>
      <div className={styles.grid}>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div 
              key={module.path} 
              className={styles.moduleCard}
              onClick={() => navigate(module.path)}
              style={{ '--module-color': module.color }}
            >
              <div className={styles.moduleHeader}>
                <Icon className={styles.moduleIcon} size={32} />
              </div>
              <h3 className={styles.moduleTitle}>{module.label}</h3>
              <p className={styles.moduleDescription}>{module.description}</p>
              <button className={styles.moduleButton}>
                Open →
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.welcomeCard}>
        <h2 className={styles.welcomeTitle}>Welcome to Todak Fusion</h2>
        <p className={styles.welcomeText}>
          Your all-in-one business planning platform. Use the modules above to define your vision, 
          map your business model, set objectives, and analyze your strategic position. 
          All modules work together to give you a complete view of your business strategy.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;