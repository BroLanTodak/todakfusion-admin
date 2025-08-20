import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { improveCanvasBlock } from '../lib/openai';
import styles from './BusinessCanvas.module.css';

// Business Model Canvas blocks in logical order
const CANVAS_BLOCKS = [
  { 
    type: 'customer_segments', 
    title: 'Customer Segments', 
    icon: '👥', 
    color: '#9b59b6',
    description: 'Groups of people or organizations you aim to reach and serve'
  },
  { 
    type: 'value_propositions', 
    title: 'Value Propositions', 
    icon: '💎', 
    color: '#e74c3c',
    description: 'Products and services that create value for your customers'
  },
  { 
    type: 'channels', 
    title: 'Channels', 
    icon: '📢', 
    color: '#f39c12',
    description: 'How you reach and deliver value to your customers'
  },
  { 
    type: 'customer_relationships', 
    title: 'Customer Relationships', 
    icon: '💬', 
    color: '#3498db',
    description: 'Types of relationships you establish with customers'
  },
  { 
    type: 'revenue_streams', 
    title: 'Revenue Streams', 
    icon: '💵', 
    color: '#27ae60',
    description: 'How your business generates income from customers'
  },
  { 
    type: 'key_resources', 
    title: 'Key Resources', 
    icon: '🔧', 
    color: '#34495e',
    description: 'Most important assets required to make your model work'
  },
  { 
    type: 'key_activities', 
    title: 'Key Activities', 
    icon: '⚡', 
    color: '#16a085',
    description: 'Most important things you must do to operate'
  },
  { 
    type: 'key_partners', 
    title: 'Key Partners', 
    icon: '🤝', 
    color: '#2c3e50',
    description: 'Network of suppliers and partners that help you'
  },
  { 
    type: 'cost_structure', 
    title: 'Cost Structure', 
    icon: '💰', 
    color: '#e67e22',
    description: 'All costs incurred to operate your business model'
  }
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
    <div 
      key={block.type} 
      className={styles.canvasBlock}
      style={{ borderTopColor: block.color }}
    >
      <div className={styles.blockHeader}>
        <h3 className={styles.blockTitle}>
          <span className={styles.blockIcon}>{block.icon}</span>
          {block.title}
        </h3>
        <button
          className={styles.aiButton}
          onClick={() => handleAISuggest(block.type, block.title)}
          disabled={aiLoading === block.type}
          title="AI Assistant"
        >
          {aiLoading === block.type ? '...' : '✨'}
        </button>
      </div>
      <p className={styles.blockDescription}>{block.description}</p>
      
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
        <p className={styles.subtitle}>Map your business model across 9 key building blocks</p>
      </div>
      
      <div className={styles.canvasWrapper}>
        <div className={styles.canvasScroll}>
          <div className={styles.canvasRow}>
            {CANVAS_BLOCKS.map(block => renderCanvasBlock(block))}
          </div>
        </div>
        
        <div className={styles.scrollIndicator}>
          <span>← Scroll horizontally to view all 9 sections →</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessCanvas;
