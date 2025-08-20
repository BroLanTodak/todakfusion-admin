import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { improveOKR } from '../lib/openai';
import styles from './OKR.module.css';

const OKR = () => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Q1-2024');
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [newObjective, setNewObjective] = useState({ title: '', description: '' });
  const [expandedObjectives, setExpandedObjectives] = useState({});
  const [aiLoading, setAiLoading] = useState(null);

  useEffect(() => {
    loadOKRs();
  }, [selectedPeriod]);

  const loadOKRs = async () => {
    try {
      setLoading(true);
      
      // Load objectives with their key results
      const { data: objectivesData, error } = await supabase
        .from('objectives')
        .select(`
          *,
          key_results (*)
        `)
        .eq('period', selectedPeriod)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObjectives(objectivesData || []);
    } catch (error) {
      console.error('Error loading OKRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleObjective = (objectiveId) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  const createObjective = async () => {
    if (!newObjective.title.trim()) return;

    try {
      const { error } = await supabase
        .from('objectives')
        .insert({
          title: newObjective.title,
          description: newObjective.description,
          period: selectedPeriod,
          owner_id: user.id
        });

      if (error) throw error;

      setNewObjective({ title: '', description: '' });
      setShowAddObjective(false);
      loadOKRs();
    } catch (error) {
      console.error('Error creating objective:', error);
      alert('Error creating objective. Please try again.');
    }
  };

  const updateKeyResultProgress = async (keyResultId, newValue) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update({ 
          current_value: parseFloat(newValue),
          updated_at: new Date().toISOString()
        })
        .eq('id', keyResultId);

      if (error) throw error;
      loadOKRs();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const addKeyResult = async (objectiveId, title) => {
    if (!title.trim()) return;

    try {
      const { error } = await supabase
        .from('key_results')
        .insert({
          objective_id: objectiveId,
          title,
          start_value: 0,
          target_value: 100,
          current_value: 0,
          unit: '%',
          assigned_to: user.id
        });

      if (error) throw error;
      loadOKRs();
    } catch (error) {
      console.error('Error adding key result:', error);
      alert('Error adding key result. Please try again.');
    }
  };

  const handleAISuggestObjective = async () => {
    setAiLoading('objective');
    try {
      const suggestion = await improveOKR('objective', '', selectedPeriod, 'suggest');
      setNewObjective({ 
        title: suggestion.trim().split('\n')[0].replace(/^[-*•]\s*/, ''), 
        description: '' 
      });
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      alert('Error getting AI suggestion. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAISuggestKeyResults = async (objective) => {
    setAiLoading(`kr-${objective.id}`);
    try {
      const suggestions = await improveOKR('keyResult', '', objective.title, 'suggest');
      const lines = suggestions.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const krTitle = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (krTitle) {
          await addKeyResult(objective.id, krTitle);
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      alert('Error getting AI suggestions. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  const periods = ['Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024'];

  if (loading) {
    return <div className={styles.loading}>Loading OKRs...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Objectives & Key Results (OKR)</h1>
          <p className={styles.subtitle}>Set ambitious goals and track measurable outcomes</p>
        </div>
        <div className={styles.controls}>
          <select 
            className={styles.periodSelect}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddObjective(true)}
          >
            + Add Objective
          </button>
        </div>
      </div>

      {showAddObjective && (
        <div className={styles.addObjectiveForm}>
          <div className={styles.formHeader}>
            <h3>New Objective</h3>
            <button
              className={styles.aiButton}
              onClick={handleAISuggestObjective}
              disabled={aiLoading === 'objective'}
              title="AI Suggestion"
            >
              {aiLoading === 'objective' ? '...' : '✨'}
            </button>
          </div>
          <p className={styles.formDescription}>Define a clear, ambitious goal for this quarter</p>
          <input
            type="text"
            className={styles.input}
            placeholder="Objective title"
            value={newObjective.title}
            onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
          />
          <textarea
            className={styles.textarea}
            placeholder="Description (optional)"
            value={newObjective.description}
            onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
            rows={3}
          />
          <div className={styles.formButtons}>
            <button className={styles.saveButton} onClick={createObjective}>
              Create
            </button>
            <button 
              className={styles.cancelButton} 
              onClick={() => {
                setShowAddObjective(false);
                setNewObjective({ title: '', description: '' });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.okrList}>
        {objectives.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No objectives for {selectedPeriod}</p>
            <p>Click "Add Objective" to get started</p>
          </div>
        ) : (
          objectives.map(objective => (
            <div key={objective.id} className={styles.objectiveCard}>
              <div 
                className={styles.objectiveHeader}
                onClick={() => toggleObjective(objective.id)}
              >
                <div className={styles.objectiveInfo}>
                  <span className={styles.expandIcon}>
                    {expandedObjectives[objective.id] ? '▼' : '▶'}
                  </span>
                  <div>
                    <h3>{objective.title}</h3>
                    {objective.description && (
                      <p className={styles.description}>{objective.description}</p>
                    )}
                  </div>
                </div>
                <div className={styles.objectiveActions}>
                  <button
                    className={styles.aiSmallButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAISuggestKeyResults(objective);
                    }}
                    disabled={aiLoading === `kr-${objective.id}`}
                    title="Suggest Key Results"
                  >
                    {aiLoading === `kr-${objective.id}` ? '...' : '+ KR ✨'}
                  </button>
                </div>
                <div className={styles.progressContainer}>
                  <span className={styles.progressText}>{objective.progress || 0}%</span>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${objective.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {expandedObjectives[objective.id] && (
                <div className={styles.keyResults}>
                  {objective.key_results?.map(kr => (
                    <div key={kr.id} className={styles.keyResultItem}>
                      <div className={styles.krInfo}>
                        <span className={styles.krTitle}>{kr.title}</span>
                        <div className={styles.krProgress}>
                          <input
                            type="range"
                            min="0"
                            max={kr.target_value || 100}
                            value={kr.current_value || 0}
                            onChange={(e) => updateKeyResultProgress(kr.id, e.target.value)}
                            className={styles.slider}
                          />
                          <span className={styles.krValue}>
                            {kr.current_value || 0}/{kr.target_value || 100} {kr.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <AddKeyResult 
                    objectiveId={objective.id} 
                    onAdd={(title) => addKeyResult(objective.id, title)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Simple component for adding key results
const AddKeyResult = ({ objectiveId, onAdd }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    onAdd(title);
    setTitle('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button 
        className={styles.addKrButton}
        onClick={() => setAdding(true)}
      >
        + Add Key Result
      </button>
    );
  }

  return (
    <div className={styles.addKrForm}>
      <input
        type="text"
        className={styles.krInput}
        placeholder="Key Result title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        autoFocus
      />
      <button onClick={handleAdd}>Add</button>
      <button onClick={() => { setAdding(false); setTitle(''); }}>Cancel</button>
    </div>
  );
};

export default OKR;
