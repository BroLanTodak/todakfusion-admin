import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { improveSWOTCategory } from '../lib/openai';
import styles from './SWOT.module.css';

const SWOT_CATEGORIES = [
  { 
    type: 'strength', 
    title: 'Strengths', 
    icon: '💪', 
    color: '#2ECC71',
    description: 'Internal positive attributes and resources that give your company an advantage'
  },
  { 
    type: 'weakness', 
    title: 'Weaknesses', 
    icon: '⚠️', 
    color: '#E74C3C',
    description: 'Internal limitations or areas that need improvement to remain competitive'
  },
  { 
    type: 'opportunity', 
    title: 'Opportunities', 
    icon: '🚀', 
    color: '#3498DB',
    description: 'External factors or trends that could provide competitive advantages'
  },
  { 
    type: 'threat', 
    title: 'Threats', 
    icon: '⚡', 
    color: '#F39C12',
    description: 'External challenges that could negatively impact your business'
  }
];

const SWOT = () => {
  const { user } = useAuth();
  const [swotData, setSwotData] = useState({
    strength: [],
    weakness: [],
    opportunity: [],
    threat: []
  });
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [aiLoading, setAiLoading] = useState(null);

  useEffect(() => {
    loadSWOTData();
  }, []);

  const loadSWOTData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('swot_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by category
      const grouped = {
        strength: [],
        weakness: [],
        opportunity: [],
        threat: []
      };

      data.forEach(item => {
        if (grouped[item.category]) {
          grouped[item.category].push(item);
        }
      });

      setSwotData(grouped);
    } catch (error) {
      console.error('Error loading SWOT:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSWOTItem = async (category) => {
    if (!newItem.trim()) return;

    try {
      const { error } = await supabase
        .from('swot_items')
        .insert({
          category,
          content: newItem,
          created_by: user.id
        });

      if (error) throw error;

      setNewItem('');
      setEditingCategory(null);
      loadSWOTData();
    } catch (error) {
      console.error('Error adding SWOT item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const deleteSWOTItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('swot_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadSWOTData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    }
  };

  const updateImpactScore = async (itemId, score) => {
    try {
      const { error } = await supabase
        .from('swot_items')
        .update({ impact_score: score })
        .eq('id', itemId);

      if (error) throw error;
      loadSWOTData();
    } catch (error) {
      console.error('Error updating impact score:', error);
    }
  };

  const handleAISuggest = async (category) => {
    setAiLoading(category.type);
    try {
      const currentItems = swotData[category.type].map(item => item.content);
      const suggestions = await improveSWOTCategory(category.type, currentItems, 'suggest');
      
      // Parse suggestions and add them
      const lines = suggestions.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const content = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (content) {
          await supabase
            .from('swot_items')
            .insert({
              category: category.type,
              content,
              created_by: user.id
            });
        }
      }
      
      await loadSWOTData();
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      alert('Error getting AI suggestions. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading SWOT Analysis...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>SWOT Analysis</h1>
        <p className={styles.subtitle}>Analyze internal capabilities and external factors affecting your business</p>
      </div>
      
      <div className={styles.swotGrid}>
        {SWOT_CATEGORIES.map(category => (
          <div 
            key={category.type} 
            className={styles.swotQuadrant}
            style={{ borderColor: category.color }}
          >
            <div 
              className={styles.quadrantHeader}
              style={{ backgroundColor: category.color + '20' }}
            >
              <div className={styles.headerContent}>
                <div className={styles.titleRow}>
                  <span className={styles.icon}>{category.icon}</span>
                  <h3>{category.title}</h3>
                </div>
                <button
                  className={styles.aiButton}
                  onClick={() => handleAISuggest(category)}
                  disabled={aiLoading === category.type}
                  title="AI Assistant"
                >
                  {aiLoading === category.type ? '...' : '✨'}
                </button>
              </div>
              <p className={styles.categoryDescription}>{category.description}</p>
            </div>
            
            <div className={styles.quadrantContent}>
              <ul className={styles.itemList}>
                {swotData[category.type].map(item => (
                  <li key={item.id} className={styles.swotItem}>
                    <div className={styles.itemContent}>
                      <span>{item.content}</span>
                      <div className={styles.impactScore}>
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            className={`${styles.impactButton} ${
                              item.impact_score >= score ? styles.active : ''
                            }`}
                            onClick={() => updateImpactScore(item.id, score)}
                            style={{
                              backgroundColor: item.impact_score >= score 
                                ? category.color 
                                : 'transparent'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteSWOTItem(item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              
              {editingCategory === category.type ? (
                <div className={styles.addItemForm}>
                  <input
                    type="text"
                    className={styles.input}
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSWOTItem(category.type)}
                    placeholder={`Add ${category.title.toLowerCase()}...`}
                    autoFocus
                  />
                  <div className={styles.formButtons}>
                    <button
                      className={styles.addButton}
                      onClick={() => addSWOTItem(category.type)}
                    >
                      Add
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setEditingCategory(null);
                        setNewItem('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.addNewButton}
                  onClick={() => setEditingCategory(category.type)}
                  style={{ borderColor: category.color, color: category.color }}
                >
                  + Add {category.title.slice(0, -1)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <p>Impact Score: ★ = Low Impact, ★★★★★ = High Impact</p>
      </div>
    </div>
  );
};

export default SWOT;
