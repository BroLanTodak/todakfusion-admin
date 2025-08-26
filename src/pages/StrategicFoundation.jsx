import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Heart, Columns, Users, Calendar, X } from 'lucide-react';
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
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [newValue, setNewValue] = useState({ title: '', description: '', icon: '💎' });
  const [newObjective, setNewObjective] = useState({ title: '', description: '', timeframe: '3_years', target_date: '' });
  const [newPillar, setNewPillar] = useState({ name: '', description: '', color: '#3498db', icon: '🏛️' });
  const [newMarket, setNewMarket] = useState({ segment_name: '', description: '', priority: 'medium' });
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', objective_id: '', target_date: '', status: 'pending' });

  useEffect(() => {
    loadAllData();
  }, []);

  // Modal handlers
  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setEditingItem(null);
  };

  const handleModalSave = async () => {
    if (!editingItem) return;

    switch (modalType) {
      case 'value':
        await updateCoreValue(editingItem.id, {
          title: editingItem.title,
          description: editingItem.description,
          icon: editingItem.icon
        });
        break;
      case 'objective':
        await updateStrategicObjective(editingItem.id, {
          title: editingItem.title,
          description: editingItem.description,
          timeframe: editingItem.timeframe,
          target_date: editingItem.target_date
        });
        break;
      case 'pillar':
        await updateStrategicPillar(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description,
          color: editingItem.color,
          icon: editingItem.icon
        });
        break;
      case 'market':
        await updateTargetMarket(editingItem.id, {
          segment_name: editingItem.segment_name,
          description: editingItem.description,
          priority: editingItem.priority
        });
        break;
      case 'milestone':
        await updateMilestone(editingItem.id, {
          title: editingItem.title,
          description: editingItem.description,
          status: editingItem.status,
          target_date: editingItem.target_date,
          objective_id: editingItem.objective_id
        });
        break;
    }
    closeModal();
  };

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
      loadCoreValues();
    }
  };

  const deleteCoreValue = async (id) => {
    if (!confirm('Adakah anda pasti untuk padam nilai teras ini?')) return;
    
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

  // Update Strategic Objective
  const updateStrategicObjective = async (id, updates) => {
    const { error } = await supabase
      .from('strategic_objectives')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      loadStrategicObjectives();
    }
  };

  // Delete Strategic Objective
  const deleteStrategicObjective = async (id) => {
    if (!confirm('Adakah anda pasti untuk padam objektif strategik ini?')) return;
    
    const { error } = await supabase
      .from('strategic_objectives')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (!error) loadStrategicObjectives();
  };

  // Strategic Pillars CRUD
  const saveStrategicPillar = async () => {
    if (!newPillar.name.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const pillarData = {
      ...newPillar,
      created_by: session.user.id,
      order_position: pillars.length
    };

    const { error } = await supabase
      .from('strategic_pillars')
      .insert(pillarData);

    if (!error) {
      setNewPillar({ name: '', description: '', color: '#3498db', icon: '🏛️' });
      loadStrategicPillars();
    }
  };

  const updateStrategicPillar = async (id, updates) => {
    const { error } = await supabase
      .from('strategic_pillars')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      loadStrategicPillars();
    }
  };

  const deleteStrategicPillar = async (id) => {
    if (!confirm('Adakah anda pasti untuk padam pilar strategik ini?')) return;
    
    const { error } = await supabase
      .from('strategic_pillars')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) loadStrategicPillars();
  };

  // Target Markets CRUD
  const saveTargetMarket = async () => {
    if (!newMarket.segment_name.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const marketData = {
      ...newMarket,
      created_by: session.user.id
    };

    const { error } = await supabase
      .from('target_markets')
      .insert(marketData);

    if (!error) {
      setNewMarket({ segment_name: '', description: '', priority: 'medium' });
      loadTargetMarkets();
    }
  };

  const updateTargetMarket = async (id, updates) => {
    const { error } = await supabase
      .from('target_markets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      loadTargetMarkets();
    }
  };

  const deleteTargetMarket = async (id) => {
    if (!confirm('Adakah anda pasti untuk padam pasaran sasaran ini?')) return;
    
    const { error } = await supabase
      .from('target_markets')
      .delete()
      .eq('id', id);

    if (!error) loadTargetMarkets();
  };

  // Milestones CRUD
  const saveMilestone = async () => {
    if (!newMilestone.title.trim() || !newMilestone.objective_id) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const milestoneData = {
      ...newMilestone,
      created_by: session.user.id
    };

    const { error } = await supabase
      .from('strategic_milestones')
      .insert(milestoneData);

    if (!error) {
      setNewMilestone({ title: '', description: '', objective_id: '', target_date: '', status: 'pending' });
      loadMilestones();
    }
  };

  const updateMilestone = async (id, updates) => {
    const { error } = await supabase
      .from('strategic_milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      loadMilestones();
    }
  };

  const deleteMilestone = async (id) => {
    if (!confirm('Adakah anda pasti untuk padam pencapaian ini?')) return;
    
    const { error } = await supabase
      .from('strategic_milestones')
      .delete()
      .eq('id', id);

    if (!error) loadMilestones();
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
        case 'markets':
          setNewMarket({ ...newMarket, segment_name: suggestion.title || '', description: suggestion.description || '' });
          break;
      }
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: 'values', label: 'Nilai Teras', icon: Heart },
    { id: 'objectives', label: 'Objektif Strategik', icon: Target },
    { id: 'pillars', label: 'Pilar Strategik', icon: Columns },
    { id: 'markets', label: 'Pasaran Sasaran', icon: Users },
    { id: 'timeline', label: 'Pencapaian', icon: Calendar }
  ];

  if (loading) {
    return <div className={styles.loading}>Memuatkan asas strategik...</div>;
  }

  // Modal Component
  const EditModal = () => {
    if (!showModal || !editingItem) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              {modalType === 'value' && 'Edit Nilai Teras'}
              {modalType === 'objective' && 'Edit Objektif Strategik'}
              {modalType === 'pillar' && 'Edit Pilar Strategik'}
              {modalType === 'market' && 'Edit Pasaran Sasaran'}
              {modalType === 'milestone' && 'Edit Pencapaian'}
            </h2>
            <button onClick={closeModal} className={styles.closeButton}>
              <X size={24} />
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Core Value Modal */}
            {modalType === 'value' && (
              <>
                <div className={styles.formGroup}>
                  <label>Tajuk Nilai</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Icon</label>
                  <input
                    type="text"
                    value={editingItem.icon}
                    onChange={(e) => setEditingItem({...editingItem, icon: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Huraian</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className={styles.modalTextarea}
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Strategic Objective Modal */}
            {modalType === 'objective' && (
              <>
                <div className={styles.formGroup}>
                  <label>Tajuk Objektif</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tempoh Masa</label>
                    <select
                      value={editingItem.timeframe}
                      onChange={(e) => setEditingItem({...editingItem, timeframe: e.target.value})}
                      className={styles.modalSelect}
                    >
                      <option value="1_year">1 Tahun</option>
                      <option value="3_years">3 Tahun</option>
                      <option value="5_years">5 Tahun</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tarikh Sasaran</label>
                    <input
                      type="date"
                      value={editingItem.target_date ? editingItem.target_date.split('T')[0] : ''}
                      onChange={(e) => setEditingItem({...editingItem, target_date: e.target.value})}
                      className={styles.modalInput}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Huraian</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className={styles.modalTextarea}
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Strategic Pillar Modal */}
            {modalType === 'pillar' && (
              <>
                <div className={styles.formGroup}>
                  <label>Nama Pilar</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Icon</label>
                    <input
                      type="text"
                      value={editingItem.icon}
                      onChange={(e) => setEditingItem({...editingItem, icon: e.target.value})}
                      className={styles.modalInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Warna</label>
                    <input
                      type="color"
                      value={editingItem.color}
                      onChange={(e) => setEditingItem({...editingItem, color: e.target.value})}
                      className={styles.modalColorInput}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Huraian</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className={styles.modalTextarea}
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Target Market Modal */}
            {modalType === 'market' && (
              <>
                <div className={styles.formGroup}>
                  <label>Nama Segmen</label>
                  <input
                    type="text"
                    value={editingItem.segment_name}
                    onChange={(e) => setEditingItem({...editingItem, segment_name: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Keutamaan</label>
                  <select
                    value={editingItem.priority}
                    onChange={(e) => setEditingItem({...editingItem, priority: e.target.value})}
                    className={styles.modalSelect}
                  >
                    <option value="high">Tinggi</option>
                    <option value="medium">Sederhana</option>
                    <option value="low">Rendah</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Huraian</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className={styles.modalTextarea}
                    rows={5}
                  />
                </div>
              </>
            )}

            {/* Milestone Modal */}
            {modalType === 'milestone' && (
              <>
                <div className={styles.formGroup}>
                  <label>Tajuk Pencapaian</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                      className={styles.modalSelect}
                    >
                      <option value="pending">Belum Mula</option>
                      <option value="in_progress">Sedang Berjalan</option>
                      <option value="completed">Selesai</option>
                      <option value="delayed">Ditangguh</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tarikh Sasaran</label>
                    <input
                      type="date"
                      value={editingItem.target_date ? editingItem.target_date.split('T')[0] : ''}
                      onChange={(e) => setEditingItem({...editingItem, target_date: e.target.value})}
                      className={styles.modalInput}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Objektif Berkaitan</label>
                  <select
                    value={editingItem.objective_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, objective_id: e.target.value})}
                    className={styles.modalSelect}
                  >
                    <option value="">Pilih objektif</option>
                    {objectives.filter(o => o.status === 'active').map(obj => (
                      <option key={obj.id} value={obj.id}>{obj.title}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Huraian</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className={styles.modalTextarea}
                    rows={5}
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button onClick={closeModal} className={styles.cancelButton}>
              Batal
            </button>
            <button onClick={handleModalSave} className={styles.saveModalButton}>
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asas Strategik</h1>
        <p className={styles.subtitle}>Bina rangka kerja strategik dan hala tuju jangka panjang syarikat anda</p>
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
              <h2>Nilai Teras</h2>
              <p>Kepercayaan asas yang memandu tindakan dan keputusan syarikat anda</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Tajuk nilai (contoh: Inovasi)"
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
                placeholder="Huraian nilai ini..."
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
                  <Plus size={16} /> Tambah Nilai
                </button>
              </div>
            </div>

            <div className={styles.valuesList}>
              {coreValues.map((value, index) => (
                <div key={value.id} className={styles.valueCard}>
                  <div className={styles.valueHeader}>
                    <span className={styles.valueIcon}>{value.icon}</span>
                    <h3>{value.title}</h3>
                    <div className={styles.cardActions}>
                      <button onClick={() => openEditModal('value', value)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCoreValue(value.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className={styles.valueDescription}>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Objectives Tab */}
        {activeTab === 'objectives' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Objektif Strategik</h2>
              <p>Matlamat jangka panjang yang selaras dengan visi dan misi anda (1-5 tahun)</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Tajuk objektif"
                value={newObjective.title}
                onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                className={styles.input}
              />
              <select
                value={newObjective.timeframe}
                onChange={(e) => setNewObjective({ ...newObjective, timeframe: e.target.value })}
                className={styles.select}
              >
                <option value="1_year">1 Tahun</option>
                <option value="3_years">3 Tahun</option>
                <option value="5_years">5 Tahun</option>
              </select>
              <input
                type="date"
                value={newObjective.target_date}
                onChange={(e) => setNewObjective({ ...newObjective, target_date: e.target.value })}
                className={styles.dateInput}
              />
              <textarea
                placeholder="Huraian objektif strategik ini..."
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
                  <Plus size={16} /> Tambah Objektif
                </button>
              </div>
            </div>

            <div className={styles.objectivesList}>
              {objectives.map(objective => (
                <div key={objective.id} className={styles.objectiveCard}>
                  <div className={styles.objectiveHeader}>
                    <h3>{objective.title}</h3>
                    <div className={styles.cardActions}>
                      <span className={styles.timeframe}>
                        {objective.timeframe === '1_year' ? '1 Tahun' : objective.timeframe === '3_years' ? '3 Tahun' : '5 Tahun'}
                      </span>
                      <button onClick={() => openEditModal('objective', objective)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteStrategicObjective(objective.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p>{objective.description}</p>
                  <div className={styles.objectiveMeta}>
                    <span>Sasaran: {new Date(objective.target_date).toLocaleDateString('ms-MY')}</span>
                    <span className={styles.progress}>{objective.progress}% Selesai</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Pillars Tab */}
        {activeTab === 'pillars' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Pilar Strategik</h2>
              <p>Bidang fokus utama yang menyokong objektif strategik anda</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Nama pilar (contoh: Inovasi Teknologi)"
                value={newPillar.name}
                onChange={(e) => setNewPillar({ ...newPillar, name: e.target.value })}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={newPillar.icon}
                onChange={(e) => setNewPillar({ ...newPillar, icon: e.target.value })}
                className={styles.iconInput}
              />
              <input
                type="color"
                value={newPillar.color}
                onChange={(e) => setNewPillar({ ...newPillar, color: e.target.value })}
                className={styles.colorInput}
              />
              <textarea
                placeholder="Huraian pilar strategik ini..."
                value={newPillar.description}
                onChange={(e) => setNewPillar({ ...newPillar, description: e.target.value })}
                className={styles.textarea}
                rows={2}
              />
              <div className={styles.formActions}>
                <AIButton
                  onSuggest={() => handleAISuggest('pillars')}
                  loading={aiLoading}
                  compact
                />
                <button onClick={saveStrategicPillar} className={styles.addButton}>
                  <Plus size={16} /> Tambah Pilar
                </button>
              </div>
            </div>

            <div className={styles.pillarsList}>
              {pillars.map((pillar, index) => (
                <div key={pillar.id} className={styles.pillarCard} style={{ borderLeftColor: pillar.color }}>
                  <div className={styles.pillarHeader}>
                    <span className={styles.pillarIcon}>{pillar.icon}</span>
                    <h3>{pillar.name}</h3>
                    <div className={styles.cardActions}>
                      <button onClick={() => openEditModal('pillar', pillar)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteStrategicPillar(pillar.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className={styles.pillarDescription}>{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Markets Tab */}
        {activeTab === 'markets' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Pasaran Sasaran</h2>
              <p>Tentukan dan utamakan segmen pelanggan anda</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Nama segmen pasaran"
                value={newMarket.segment_name}
                onChange={(e) => setNewMarket({ ...newMarket, segment_name: e.target.value })}
                className={styles.input}
              />
              <select
                value={newMarket.priority}
                onChange={(e) => setNewMarket({ ...newMarket, priority: e.target.value })}
                className={styles.select}
              >
                <option value="high">Keutamaan Tinggi</option>
                <option value="medium">Keutamaan Sederhana</option>
                <option value="low">Keutamaan Rendah</option>
              </select>
              <textarea
                placeholder="Huraian segmen pasaran ini..."
                value={newMarket.description}
                onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                className={styles.textarea}
                rows={2}
              />
              <div className={styles.formActions}>
                <AIButton
                  onSuggest={() => handleAISuggest('markets')}
                  loading={aiLoading}
                  compact
                />
                <button onClick={saveTargetMarket} className={styles.addButton}>
                  <Plus size={16} /> Tambah Pasaran Sasaran
                </button>
              </div>
            </div>

            <div className={styles.marketsList}>
              {targetMarkets.map(market => (
                <div key={market.id} className={`${styles.marketCard} ${styles[market.priority]}`}>
                  <div className={styles.marketHeader}>
                    <h3>{market.segment_name}</h3>
                    <div className={styles.cardActions}>
                      <span className={`${styles.priorityBadge} ${styles[market.priority]}`}>
                        {market.priority === 'high' ? 'Tinggi' : market.priority === 'medium' ? 'Sederhana' : 'Rendah'}
                      </span>
                      <button onClick={() => openEditModal('market', market)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteTargetMarket(market.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className={styles.marketDescription}>{market.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'timeline' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Pencapaian Strategik</h2>
              <p>Pencapaian penting dalam perjalanan strategik anda</p>
            </div>

            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Tajuk pencapaian"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className={styles.input}
              />
              <select
                value={newMilestone.objective_id}
                onChange={(e) => setNewMilestone({ ...newMilestone, objective_id: e.target.value })}
                className={styles.select}
              >
                <option value="">Pilih objektif berkaitan</option>
                {objectives.filter(o => o.status === 'active').map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.title}</option>
                ))}
              </select>
              <input
                type="date"
                value={newMilestone.target_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
                className={styles.dateInput}
              />
              <select
                value={newMilestone.status}
                onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
                className={styles.select}
              >
                <option value="pending">Belum Mula</option>
                <option value="in_progress">Sedang Berjalan</option>
                <option value="completed">Selesai</option>
                <option value="delayed">Ditangguh</option>
              </select>
              <textarea
                placeholder="Huraian pencapaian ini..."
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className={styles.textarea}
                rows={2}
              />
              <button onClick={saveMilestone} className={styles.addButton}>
                <Plus size={16} /> Tambah Pencapaian
              </button>
            </div>

            <div className={styles.milestonesList}>
              {milestones.map(milestone => (
                <div key={milestone.id} className={`${styles.milestoneCard} ${styles[milestone.status]}`}>
                  <div className={styles.milestoneHeader}>
                    <h3>{milestone.title}</h3>
                    <div className={styles.cardActions}>
                      <span className={`${styles.statusBadge} ${styles[milestone.status]}`}>
                        {milestone.status === 'pending' ? 'Belum Mula' : 
                         milestone.status === 'in_progress' ? 'Sedang Berjalan' :
                         milestone.status === 'completed' ? 'Selesai' : 'Ditangguh'}
                      </span>
                      <button onClick={() => openEditModal('milestone', milestone)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteMilestone(milestone.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className={styles.milestoneDescription}>{milestone.description}</p>
                  <div className={styles.milestoneMeta}>
                    <span>Sasaran: {new Date(milestone.target_date).toLocaleDateString('ms-MY')}</span>
                    {milestone.strategic_objectives && (
                      <span>Objektif: {milestone.strategic_objectives.title}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render Modal */}
      <EditModal />
    </div>
  );
};

export default StrategicFoundation;
