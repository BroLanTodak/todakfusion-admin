import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './SWOT.module.css';

const SWOT_CATEGORIES = [
  { type: 'strength', title: 'Strengths', icon: '💪', color: '#2ECC71' },
  { type: 'weakness', title: 'Weaknesses', icon: '⚠️', color: '#E74C3C' },
  { type: 'opportunity', title: 'Opportunities', icon: '🚀', color: '#3498DB' },
  { type: 'threat', title: 'Threats', icon: '⚡', color: '#F39C12' }
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

  if (loading) {
    return <div className={styles.loading}>Loading SWOT Analysis...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>SWOT Analysis</h1>
      
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
              <span className={styles.icon}>{category.icon}</span>
              <h3>{category.title}</h3>
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
