import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { improveVisionMission } from '../lib/openai';
import AIButton from '../components/AIButton';
import styles from './VisionMission.module.css';

const VisionMission = () => {
  const { user } = useAuth();
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [isEditingVision, setIsEditingVision] = useState(false);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadVisionMission();
  }, []);

  const loadVisionMission = async () => {
    try {
      setLoading(true);
      
      // Load vision
      const { data: visionData, error: visionError } = await supabase
        .from('visions_missions')
        .select('*')
        .eq('type', 'vision')
        .eq('is_current', true)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (visionData) setVision(visionData.content);
      
      // Load mission
      const { data: missionData, error: missionError } = await supabase
        .from('visions_missions')
        .select('*')
        .eq('type', 'mission')
        .eq('is_current', true)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (missionData) setMission(missionData.content);
    } catch (error) {
      console.error('Error loading vision/mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveVisionMission = async (type, content) => {
    try {
      setSaving(true);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to save.');
      }
      
      // Archive current version (if exists)
      const { data: existingData } = await supabase
        .from('visions_missions')
        .select('id')
        .eq('type', type)
        .eq('is_current', true)
        .maybeSingle();
      
      if (existingData) {
        await supabase
          .from('visions_missions')
          .update({ is_current: false })
          .eq('id', existingData.id);
      }
      
      // Insert new version
      const { data, error } = await supabase
        .from('visions_missions')
        .insert({
          type,
          content,
          created_by: session.user.id,
          is_current: true,
          scope: 'company',
          division_id: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Reset editing state
      if (type === 'vision') setIsEditingVision(false);
      if (type === 'mission') setIsEditingMission(false);
      
      // Reload data
      await loadVisionMission();
    } catch (error) {
      console.error('Error saving:', error);
      console.error('Error details:', error.message, error.details);
      alert(`Error saving: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  // AI Handler Functions
  const handleAISuggest = async (type) => {
    try {
      setAiLoading(true);
      const suggestion = await improveVisionMission(type, '', 'suggest');
      
      if (type === 'vision') {
        setVision(suggestion);
        if (!isEditingVision) setIsEditingVision(true);
      } else {
        setMission(suggestion);
        if (!isEditingMission) setIsEditingMission(true);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error getting AI suggestion. Please check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIImprove = async (type) => {
    try {
      const content = type === 'vision' ? vision : mission;
      if (!content.trim()) {
        alert('Please write some content first before improving.');
        return;
      }
      
      setAiLoading(true);
      const improved = await improveVisionMission(type, content, 'improve');
      
      if (type === 'vision') {
        setVision(improved);
      } else {
        setMission(improved);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error improving content. Please check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAICritique = async (type) => {
    try {
      const content = type === 'vision' ? vision : mission;
      if (!content.trim()) {
        alert('Please write some content first before critiquing.');
        return;
      }
      
      setAiLoading(true);
      const critique = await improveVisionMission(type, content, 'critique');
      
      // Show critique in an alert (you can improve this UI later)
      alert(`AI Feedback:\n\n${critique}`);
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error getting AI critique. Please check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Vision & Mission</h1>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Vision</h2>
          <div className={styles.headerButtons}>
            <AIButton
              onSuggest={() => handleAISuggest('vision')}
              onImprove={() => handleAIImprove('vision')}
              onCritique={() => handleAICritique('vision')}
              loading={aiLoading}
            />
            {!isEditingVision && (
              <button 
                className={styles.editButton}
                onClick={() => setIsEditingVision(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        
        {isEditingVision ? (
          <div className={styles.editSection}>
            <textarea
              className={styles.textarea}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Enter your company vision..."
              rows={4}
            />
            <div className={styles.buttonGroup}>
              <button 
                className={styles.saveButton}
                onClick={() => saveVisionMission('vision', vision)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditingVision(false);
                  loadVisionMission();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.content}>
            {vision || 'No vision statement yet. Click edit to add one.'}
          </p>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Mission</h2>
          <div className={styles.headerButtons}>
            <AIButton
              onSuggest={() => handleAISuggest('mission')}
              onImprove={() => handleAIImprove('mission')}
              onCritique={() => handleAICritique('mission')}
              loading={aiLoading}
            />
            {!isEditingMission && (
              <button 
                className={styles.editButton}
                onClick={() => setIsEditingMission(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        
        {isEditingMission ? (
          <div className={styles.editSection}>
            <textarea
              className={styles.textarea}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Enter your company mission..."
              rows={4}
            />
            <div className={styles.buttonGroup}>
              <button 
                className={styles.saveButton}
                onClick={() => saveVisionMission('mission', mission)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditingMission(false);
                  loadVisionMission();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.content}>
            {mission || 'No mission statement yet. Click edit to add one.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default VisionMission;
