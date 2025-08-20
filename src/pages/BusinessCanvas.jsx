import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AIButton from '../components/AIButton';
import { improveCanvasBlock } from '../lib/openai';
import styles from './BusinessCanvas.module.css';

// Business Model Canvas blocks dengan proper positioning
const CANVAS_BLOCKS = [
  { type: 'key_partners', title: 'Key Partners', icon: '🤝', position: 'kp' },
  { type: 'key_activities', title: 'Key Activities', icon: '⚡', position: 'ka' },
  { type: 'key_resources', title: 'Key Resources', icon: '🔧', position: 'kr' },
  { type: 'value_propositions', title: 'Value Propositions', icon: '💎', position: 'vp' },
  { type: 'customer_relationships', title: 'Customer Relationships', icon: '💬', position: 'cr' },
  { type: 'channels', title: 'Channels', icon: '📢', position: 'ch' },
  { type: 'customer_segments', title: 'Customer Segments', icon: '👥', position: 'cs' },
  { type: 'cost_structure', title: 'Cost Structure', icon: '💰', position: 'cost' },
  { type: 'revenue_streams', title: 'Revenue Streams', icon: '💵', position: 'revenue' }
];

const BusinessCanvas = () => {
  const { user } = useAuth();
  const [canvasData, setCanvasData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [aiLoading, setAiLoading] = useState(null);

  useEffect(() => {
    loadCanvasData();
  }, []);

  const loadCanvasData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('canvas_blocks')
        .select('*')
        .is('division_id', null); // Company-wide canvas

      if (error) throw error;

      // Convert array to object for easier access
      const dataMap = {};
      data.forEach(block => {
        dataMap[block.block_type] = block;
      });
      setCanvasData(dataMap);
    } catch (error) {
      console.error('Error loading canvas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (blockType) => {
    if (!newItem.trim()) return;

    try {
      const currentBlock = canvasData[blockType];
      const currentContent = currentBlock?.content || [];
      const updatedContent = [...currentContent, { id: Date.now(), text: newItem }];

      if (currentBlock) {
        // Update existing block
        const { error } = await supabase
          .from('canvas_blocks')
          .update({ 
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentBlock.id);

        if (error) throw error;
      } else {
        // Create new block
        const { error } = await supabase
          .from('canvas_blocks')
          .insert({
            block_type: blockType,
            content: updatedContent,
            created_by: user.id
          });

        if (error) throw error;
      }

      setNewItem('');
      setEditingBlock(null);
      loadCanvasData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error adding item. Please try again.');
    }
  };

  const removeItem = async (blockType, itemId) => {
    try {
      const currentBlock = canvasData[blockType];
      if (!currentBlock) return;

      const updatedContent = currentBlock.content.filter(item => item.id !== itemId);

      const { error } = await supabase
        .from('canvas_blocks')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBlock.id);

      if (error) throw error;

      loadCanvasData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Error removing item. Please try again.');
    }
  };

  const handleAISuggest = async (blockType, blockTitle) => {
    setAiLoading(blockType);
    setEditingBlock(blockType);
    
    try {
      const suggestions = await improveCanvasBlock(blockType, blockTitle, [], 'suggest');
      
      if (suggestions && suggestions.length > 0) {
        // Take the first suggestion and set it as the new item
        setNewItem(suggestions[0]);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error getting AI suggestions. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Canvas...</div>;
  }

  const renderCanvasBlock = (block) => (
    <div key={block.type} className={`${styles.canvasBlock} ${styles[block.position]}`}>
      <div className={styles.blockHeader}>
        <div className={styles.blockTitle}>
          <span className={styles.blockIcon}>{block.icon}</span>
          <h3>{block.title}</h3>
        </div>
        <AIButton
          onSuggest={() => handleAISuggest(block.type, block.title)}
          loading={aiLoading === block.type}
          compact
        />
      </div>
      
      <div className={styles.blockContent}>
        <ul className={styles.itemList}>
          {canvasData[block.type]?.content?.map(item => (
            <li key={item.id} className={styles.item}>
              <span>{item.text}</span>
              <button
                className={styles.deleteButton}
                onClick={() => removeItem(block.type, item.id)}
                aria-label="Delete item"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        
        {editingBlock === block.type ? (
          <div className={styles.addItemForm}>
            <input
              type="text"
              className={styles.input}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem(block.type)}
              placeholder="Add new item..."
              autoFocus
            />
            <div className={styles.formButtons}>
              <button
                className={styles.addButton}
                onClick={() => addItem(block.type)}
              >
                Add
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setEditingBlock(null);
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
            onClick={() => setEditingBlock(block.type)}
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Business Model Canvas</h1>
        <p className={styles.subtitle}>Map out your business model on a single page</p>
      </div>
      
      <div className={styles.canvasWrapper}>
        <div className={styles.canvasContainer}>
          <div className={styles.canvasGrid}>
            {CANVAS_BLOCKS.map(block => renderCanvasBlock(block))}
          </div>
          
          <div className={styles.canvasInfo}>
            <div className={styles.infoCard}>
              <h4>💡 Pro Tip</h4>
              <p>Scroll horizontally to view the entire canvas. Each section represents a key aspect of your business model.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCanvas;
