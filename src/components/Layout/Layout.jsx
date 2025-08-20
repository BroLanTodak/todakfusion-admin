import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Menu, X, Home, Users, Sun, Moon, LogOut, User, Eye, Grid3X3, Target, Activity, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AIChatbot from '../AIChatbot';
import styles from './Layout.module.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { type: 'separator' },
    { path: '/strategic-foundation', icon: Building2, label: 'Strategic Foundation' },
    { path: '/vision-mission', icon: Eye, label: 'Vision & Mission' },
    { path: '/canvas', icon: Grid3X3, label: 'Business Canvas' },
    { path: '/okr', icon: Target, label: 'OKR' },
    { path: '/swot', icon: Activity, label: 'SWOT Analysis' },
    { type: 'separator' },
    { path: '/users', icon: Users, label: 'Manage Users' },
  ];

  return (
    <div className={styles.container}>
      <div
        className={`${styles.mobileOverlay} ${
          sidebarOpen && isMobile ? styles.show : ''
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>Todak Fusion</div>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className={styles.menuButton}
              style={{ color: 'white' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={`separator-${index}`} className={styles.separator} />;
            }
            
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={handleNavClick}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={toggleSidebar} className={styles.menuButton}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.themeToggle} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className={styles.userInfo}>
              <User size={20} />
              <span className={styles.userEmail}>{user?.email}</span>
            </div>

            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={18} />
              <span style={{ marginLeft: '0.5rem' }}>Logout</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      
      <AIChatbot />
    </div>
  );
};

export default Layout;