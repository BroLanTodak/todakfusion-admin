import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './BusinessCanvas.module.css';

const CANVAS_BLOCKS = [
  { type: 'key_partners', title: 'Key Partners', icon: '🤝' },
  { type: 'key_activities', title: 'Key Activities', icon: '⚡' },
  { type: 'value_propositions', title: 'Value Propositions', icon: '💎' },
  { type: 'customer_relationships', title: 'Customer Relationships', icon: '💬' },
  { type: 'customer_segments', title: 'Customer Segments', icon: '👥' },
  { type: 'key_resources', title: 'Key Resources', icon: '🔧' },
  { type: 'channels', title: 'Channels', icon: '📢' },
  { type: 'cost_structure', title: 'Cost Structure', icon: '💰' },
  { type: 'revenue_streams', title: 'Revenue Streams', icon: '💵' }
];

const BusinessCanvas = () => {
  const { user } = useAuth();
  const [canvasData, setCanvasData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState(null);
  const [newItem, setNewItem] = useState('');

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

  if (loading) {
    return <div className={styles.loading}>Loading Canvas...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Business Model Canvas</h1>
      
      <div className={styles.canvasGrid}>
        {CANVAS_BLOCKS.map(block => (
          <div key={block.type} className={styles.canvasBlock}>
            <div className={styles.blockHeader}>
              <span className={styles.blockIcon}>{block.icon}</span>
              <h3>{block.title}</h3>
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
        ))}
      </div>
    </div>
  );
};

export default BusinessCanvas;
