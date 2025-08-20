import { useState } from 'react';
import { Sparkles, Wand2, MessageSquare } from 'lucide-react';
import styles from './AIButton.module.css';

const AIButton = ({ 
  onSuggest, 
  onImprove, 
  onCritique,
  loading = false,
  type = 'default' 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleAction = async (action) => {
    setShowMenu(false);
    
    switch (action) {
      case 'suggest':
        onSuggest && onSuggest();
        break;
      case 'improve':
        onImprove && onImprove();
        break;
      case 'critique':
        onCritique && onCritique();
        break;
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.mainButton}
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
      >
        <Sparkles size={18} />
        {loading ? 'AI Processing...' : 'AI Assistant'}
      </button>

      {showMenu && !loading && (
        <div className={styles.menu}>
          {onSuggest && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction('suggest')}
            >
              <Wand2 size={16} />
              Suggest Content
            </button>
          )}
          {onImprove && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction('improve')}
            >
              <Sparkles size={16} />
              Improve Content
            </button>
          )}
          {onCritique && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction('critique')}
            >
              <MessageSquare size={16} />
              Review & Critique
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIButton;
