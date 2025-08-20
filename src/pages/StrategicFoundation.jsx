import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Heart, Columns, Users, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AIButton from '../components/AIButton';
import { improveStrategicContent } from '../lib/openai';
import styles from './StrategicFoundation.module.css';

const StrategicFoundation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('values');
  const [aiLoading, setAiLoading] = useState(false);
  
  // State for different sections
  const [coreValues, setCoreValues] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [targetMarkets, setTargetMarkets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  
  // Editing states
  const [editingValue, setEditingValue] = useState(null);
  const [editingObjective, setEditingObjective] = useState(null);
  const [editingPillar, setEditingPillar] = useState(null);
  const [editingMarket, setEditingMarket] = useState(null);
  
  // Form states
  const [newValue, setNewValue] = useState({ title: '', description: '', icon: '💎' });
  const [newObjective, setNewObjective] = useState({ title: '', description: '', timeframe: '3_years', target_date: '' });
  const [newPillar, setNewPillar] = useState({ name: '', description: '', color: '#3498db', icon: '🏛️' });
  const [newMarket, setNewMarket] = useState({ segment_name: '', description: '', priority: 'medium' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCoreValues(),
        loadStrategicObjectives(),
        loadStrategicPillars(),
        loadTargetMarkets(),
        loadMilestones()
      ]);
    } catch (error) {
      console.error('Error loading strategic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoreValues = async () => {
    const { data, error } = await supabase
      .from('core_values')
      .select('*')
      .eq('is_active', true)
      .order('order_position');
    
    if (!error && data) setCoreValues(data);
  };

  const loadStrategicObjectives = async () => {
    const { data, error } = await supabase
      .from('strategic_objectives')
      .select('*')
      .eq('status', 'active')
      .order('created_at');
    
    if (!error && data) setObjectives(data);
  };

  const loadStrategicPillars = async () => {
    const { data, error } = await supabase
      .from('strategic_pillars')
      .select('*')
      .eq('is_active', true)
      .order('order_position');
    
    if (!error && data) setPillars(data);
  };

  const loadTargetMarkets = async () => {
    const { data, error } = await supabase
      .from('target_markets')
      .select('*')
      .order('priority DESC');
    
    if (!error && data) setTargetMarkets(data);
  };

  const loadMilestones = async () => {
    const { data, error } = await supabase
      .from('strategic_milestones')
      .select('*, strategic_objectives(title)')
      .order('target_date');
    
    if (!error && data) setMilestones(data);
  };

  // Core Values CRUD
  const saveCoreValue = async () => {
    if (!newValue.title.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const valueData = {
      ...newValue,
      created_by: session.user.id,
      order_position: coreValues.length
    };

    const { error } = await supabase
      .from('core_values')
      .insert(valueData);

    if (!error) {
      setNewValue({ title: '', description: '', icon: '💎' });
      loadCoreValues();
    }
  };

  const updateCoreValue = async (id, updates) => {
    const { error } = await supabase
      .from('core_values')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setEditingValue(null);
      loadCoreValues();
    }
  };

  const deleteCoreValue = async (id) => {
    if (!confirm('Are you sure you want to delete this core value?')) return;
    
    const { error } = await supabase
      .from('core_values')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) loadCoreValues();
  };

  // Strategic Objectives CRUD
  const saveStrategicObjective = async () => {
    if (!newObjective.title.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const objectiveData = {
      ...newObjective,
      created_by: session.user.id
    };

    const { error } = await supabase
      .from('strategic_objectives')
      .insert(objectiveData);

    if (!error) {
      setNewObjective({ title: '', description: '', timeframe: '3_years', target_date: '' });
      loadStrategicObjectives();
    }
  };

  // AI Integration Handlers
  const handleAISuggest = async (type) => {
    setAiLoading(true);
    try {
      const suggestion = await improveStrategicContent(type, '', 'suggest');
      
      switch(type) {
        case 'values':
          setNewValue({ ...newValue, title: suggestion.title || '', description: suggestion.description || '' });
          break;
        case 'objectives':
          setNewObjective({ ...newObjective, title: suggestion.title || '', description: suggestion.description || '' });
          break;
        case 'pillars':
          setNewPillar({ ...newPillar, name: suggestion.title || '', description: suggestion.description || '' });
          break;
      }
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: 'values', label: 'Core Values', icon: Heart },
    { id: 'objectives', label: 'Strategic Objectives', icon: Target },
    { id: 'pillars', label: 'Strategic Pillars', icon: Columns },
    { id: 'markets', label: 'Target Markets', icon: Users },
    { id: 'timeline', label: 'Milestones', icon: Calendar }
  ];

  if (loading) {
    return <div className={styles.loading}>Loading strategic foundation...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Strategic Foundation</h1>
        <p className={styles.subtitle}>Build your company's strategic framework and long-term direction</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Core Values Tab */}
        {activeTab === 'values' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Core Values</h2>
              <p>The fundamental beliefs that guide your company's actions and decisions</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Value title (e.g., Innovation)"
                value={newValue.title}
                onChange={(e) => setNewValue({ ...newValue, title: e.target.value })}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={newValue.icon}
                onChange={(e) => setNewValue({ ...newValue, icon: e.target.value })}
                className={styles.iconInput}
              />
              <textarea
                placeholder="Description of this value..."
                value={newValue.description}
                onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
                className={styles.textarea}
                rows={2}
              />
              <div className={styles.formActions}>
                <AIButton
                  onSuggest={() => handleAISuggest('values')}
                  loading={aiLoading}
                  compact
                />
                <button onClick={saveCoreValue} className={styles.addButton}>
                  <Plus size={16} /> Add Value
                </button>
              </div>
            </div>

            <div className={styles.valuesList}>
              {coreValues.map((value, index) => (
                <div key={value.id} className={styles.valueCard}>
                  <div className={styles.valueHeader}>
                    <span className={styles.valueIcon}>{value.icon}</span>
                    {editingValue === value.id ? (
                      <input
                        value={value.title}
                        onChange={(e) => setCoreValues(prev => 
                          prev.map(v => v.id === value.id ? { ...v, title: e.target.value } : v)
                        )}
                        className={styles.editInput}
                      />
                    ) : (
                      <h3>{value.title}</h3>
                    )}
                    <div className={styles.cardActions}>
                      <button onClick={() => setEditingValue(editingValue === value.id ? null : value.id)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCoreValue(value.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {editingValue === value.id ? (
                    <div>
                      <textarea
                        value={value.description}
                        onChange={(e) => setCoreValues(prev => 
                          prev.map(v => v.id === value.id ? { ...v, description: e.target.value } : v)
                        )}
                        className={styles.textarea}
                        rows={3}
                      />
                      <button 
                        onClick={() => updateCoreValue(value.id, { 
                          title: value.title, 
                          description: value.description 
                        })}
                        className={styles.saveButton}
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <p className={styles.valueDescription}>{value.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Objectives Tab */}
        {activeTab === 'objectives' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Strategic Objectives</h2>
              <p>Long-term goals that align with your vision and mission (1-5 years)</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Objective title"
                value={newObjective.title}
                onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                className={styles.input}
              />
              <select
                value={newObjective.timeframe}
                onChange={(e) => setNewObjective({ ...newObjective, timeframe: e.target.value })}
                className={styles.select}
              >
                <option value="1_year">1 Year</option>
                <option value="3_years">3 Years</option>
                <option value="5_years">5 Years</option>
              </select>
              <input
                type="date"
                value={newObjective.target_date}
                onChange={(e) => setNewObjective({ ...newObjective, target_date: e.target.value })}
                className={styles.dateInput}
              />
              <textarea
                placeholder="Describe this strategic objective..."
                value={newObjective.description}
                onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                className={styles.textarea}
                rows={2}
              />
              <div className={styles.formActions}>
                <AIButton
                  onSuggest={() => handleAISuggest('objectives')}
                  loading={aiLoading}
                  compact
                />
                <button onClick={saveStrategicObjective} className={styles.addButton}>
                  <Plus size={16} /> Add Objective
                </button>
              </div>
            </div>

            <div className={styles.objectivesList}>
              {objectives.map(objective => (
                <div key={objective.id} className={styles.objectiveCard}>
                  <div className={styles.objectiveHeader}>
                    <h3>{objective.title}</h3>
                    <span className={styles.timeframe}>
                      {objective.timeframe.replace('_', ' ')}
                    </span>
                  </div>
                  <p>{objective.description}</p>
                  <div className={styles.objectiveMeta}>
                    <span>Target: {new Date(objective.target_date).toLocaleDateString()}</span>
                    <span className={styles.progress}>{objective.progress}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs would follow similar pattern... */}
        {activeTab === 'pillars' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Strategic Pillars</h2>
              <p>Key focus areas that support your strategic objectives</p>
            </div>
            <div className={styles.comingSoon}>
              <p>Strategic Pillars section - Implementation in progress</p>
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Target Markets</h2>
              <p>Define and prioritize your customer segments</p>
            </div>
            <div className={styles.comingSoon}>
              <p>Target Markets section - Implementation in progress</p>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Strategic Milestones</h2>
              <p>Key milestones on your strategic journey</p>
            </div>
            <div className={styles.comingSoon}>
              <p>Milestones timeline - Implementation in progress</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategicFoundation;
