import { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './TagSelector.module.css';

const TagSelector = ({ entityType, entityId, selectedTags = [], onTagsChange }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('organizational_tags')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) {
      setAvailableTags(data);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('organizational_tags')
      .insert({
        name: newTagName.trim(),
        category: 'custom'
      })
      .select()
      .single();

    if (!error && data) {
      setAvailableTags([...availableTags, data]);
      onTagsChange([...selectedTags, data]);
      setNewTagName('');
      setShowTagInput(false);
    }
    setLoading(false);
  };

  const toggleTag = (tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className={styles.tagSelector}>
      <div className={styles.selectedTags}>
        {selectedTags.map(tag => (
          <span 
            key={tag.id} 
            className={styles.tag}
            style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
          >
            <Tag size={12} />
            {tag.name}
            <button 
              onClick={() => toggleTag(tag)}
              className={styles.removeTag}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <button 
          onClick={() => setShowTagInput(true)}
          className={styles.addTagButton}
        >
          <Plus size={14} />
          Add Tag
        </button>
      </div>

      {showTagInput && (
        <div className={styles.tagDropdown}>
          <div className={styles.tagInput}>
            <input
              type="text"
              placeholder="Create new tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTag()}
              className={styles.input}
            />
            <button 
              onClick={createTag} 
              disabled={loading || !newTagName.trim()}
              className={styles.createButton}
            >
              Create
            </button>
          </div>
          
          <div className={styles.availableTags}>
            {availableTags
              .filter(tag => !selectedTags.some(t => t.id === tag.id))
              .map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={styles.tagOption}
                  style={{ backgroundColor: tag.color + '10', borderColor: tag.color }}
                >
                  <Tag size={12} style={{ color: tag.color }} />
                  {tag.name}
                </button>
              ))}
          </div>

          <button 
            onClick={() => setShowTagInput(false)}
            className={styles.closeButton}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
