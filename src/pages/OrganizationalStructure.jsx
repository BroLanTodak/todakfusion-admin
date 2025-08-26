import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Users, UsersRound, ChevronRight, ChevronDown, X, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import styles from './OrganizationalStructure.module.css';
import TagSelector from '../components/TagSelector';
import MultiDepartmentSelector from '../components/MultiDepartmentSelector';

const OrganizationalStructure = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('hierarchy'); // 'hierarchy' or 'list'
  
  // State for different levels
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  
  // Expanded states for hierarchy view
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDivisions(),
        loadDepartments(),
        loadUnits(),
        loadSubUnits()
      ]);
    } catch (error) {
      console.error('Error loading organizational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDivisions = async () => {
    console.log('Loading divisions...');
    const { data, error } = await supabase
      .from('divisions')
      .select('*, head_of_division:profiles(full_name)')
      .eq('is_active', true)
      .order('order_position');
    
    if (error) {
      console.error('Error loading divisions:', error);
      // Try loading without profile join
      const { data: divisionsOnly, error: simpleError } = await supabase
        .from('divisions')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      
      if (!simpleError && divisionsOnly) {
        console.log('Loaded divisions without profiles:', divisionsOnly);
        setDivisions(divisionsOnly);
      }
    } else if (data) {
      console.log('Loaded divisions with profiles:', data);
      setDivisions(data);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*, head_of_department:profiles(full_name)')
      .eq('is_active', true)
      .order('order_position');
    
    if (error) {
      console.error('Error loading departments:', error);
      const { data: deptsOnly, error: simpleError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      if (!simpleError && deptsOnly) setDepartments(deptsOnly);
    } else if (data) {
      setDepartments(data);
    }
  };

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*, unit_lead:profiles(full_name)')
      .eq('is_active', true)
      .order('order_position');
    
    if (error) {
      console.error('Error loading units:', error);
      const { data: unitsOnly, error: simpleError } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      if (!simpleError && unitsOnly) setUnits(unitsOnly);
    } else if (data) {
      setUnits(data);
    }
  };

  const loadSubUnits = async () => {
    const { data, error } = await supabase
      .from('sub_units')
      .select('*, sub_unit_lead:profiles(full_name)')
      .eq('is_active', true)
      .order('order_position');
    
    if (error) {
      console.error('Error loading sub units:', error);
      const { data: subUnitsOnly, error: simpleError } = await supabase
        .from('sub_units')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      if (!simpleError && subUnitsOnly) setSubUnits(subUnitsOnly);
    } else if (data) {
      setSubUnits(data);
    }
  };

  // Modal handlers
  const openAddModal = (type, parent = null) => {
    setModalType(type);
    setSelectedParent(parent);
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setSelectedParent(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setEditingItem(null);
    setSelectedParent(null);
  };

  const handleSave = async (formData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let table, data;
    
    switch (modalType) {
      case 'division':
        table = 'divisions';
        data = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          head_of_division: formData.head_id || null,
          created_by: session.user.id
        };
        break;
      case 'department':
        table = 'departments';
        data = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          division_id: selectedParent?.id || editingItem?.division_id,
          head_of_department: formData.head_id || null,
          created_by: session.user.id
        };
        break;
      case 'unit':
        table = 'units';
        data = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          department_id: formData.selectedDepartments?.[0]?.id || selectedParent?.id || editingItem?.department_id,
          primary_department_id: formData.primaryDepartmentId,
          is_shared: formData.is_shared || false,
          unit_lead: formData.head_id || null,
          created_by: session.user.id
        };
        break;
      case 'sub_unit':
        table = 'sub_units';
        data = {
          name: formData.name,
          code: formData.code,
          type: formData.type || 'sub_unit',
          description: formData.description,
          unit_id: formData.selectedUnits?.[0]?.id || selectedParent?.id || editingItem?.unit_id,
          primary_unit_id: formData.primaryUnitId,
          is_shared: formData.is_shared || false,
          sub_unit_lead: formData.head_id || null,
          created_by: session.user.id
        };
        break;
    }

    try {
      let entityId;
      
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        
        if (error) throw error;
        entityId = editingItem.id;
      } else {
        // Insert
        console.log('Inserting data:', { table, data });
        const { data: insertedData, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        
        if (error) throw error;
        console.log('Successfully inserted:', insertedData);
        entityId = insertedData.id;
      }

      // Handle many-to-many relationships for units
      if (modalType === 'unit' && formData.selectedDepartments) {
        // Delete existing relationships
        await supabase
          .from('unit_departments')
          .delete()
          .eq('unit_id', entityId);

        // Insert new relationships
        if (formData.selectedDepartments.length > 0) {
          const unitDeptData = formData.selectedDepartments.map(dept => ({
            unit_id: entityId,
            department_id: dept.id,
            is_primary: dept.id === formData.primaryDepartmentId,
            assigned_by: session.user.id
          }));

          const { error: relError } = await supabase
            .from('unit_departments')
            .insert(unitDeptData);
          
          if (relError) console.error('Error saving unit-department relationships:', relError);
        }
      }

      // Handle many-to-many relationships for sub-units
      if (modalType === 'sub_unit' && formData.selectedUnits) {
        // Delete existing relationships
        await supabase
          .from('sub_unit_units')
          .delete()
          .eq('sub_unit_id', entityId);

        // Insert new relationships
        if (formData.selectedUnits.length > 0) {
          const subUnitData = formData.selectedUnits.map(unit => ({
            sub_unit_id: entityId,
            unit_id: unit.id,
            is_primary: unit.id === formData.primaryUnitId,
            assigned_by: session.user.id
          }));

          const { error: relError } = await supabase
            .from('sub_unit_units')
            .insert(subUnitData);
          
          if (relError) console.error('Error saving sub_unit-unit relationships:', relError);
        }
      }

      // Handle tags
      if (formData.selectedTags) {
        // Delete existing tag assignments
        await supabase
          .from('tag_assignments')
          .delete()
          .eq('entity_type', modalType)
          .eq('entity_id', entityId);

        // Insert new tag assignments
        if (formData.selectedTags.length > 0) {
          const tagData = formData.selectedTags.map(tag => ({
            tag_id: tag.id,
            entity_type: modalType,
            entity_id: entityId,
            assigned_by: session.user.id
          }));

          const { error: tagError } = await supabase
            .from('tag_assignments')
            .insert(tagData);
          
          if (tagError) console.error('Error saving tags:', tagError);
        }
      }

      closeModal();
      loadAllData();
    } catch (error) {
      console.error('Error saving:', error);
      alert(`Error saving ${modalType}: ${error.message}`);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    let table;
    switch (type) {
      case 'division':
        table = 'divisions';
        break;
      case 'department':
        table = 'departments';
        break;
      case 'unit':
        table = 'units';
        break;
      case 'sub_unit':
        table = 'sub_units';
        break;
    }

    const { error } = await supabase
      .from(table)
      .update({ is_active: false })
      .eq('id', id);

    if (!error) loadAllData();
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render hierarchy item
  const renderHierarchyItem = (item, type, level = 0) => {
    const hasChildren = type !== 'sub_unit';
    const isExpanded = expandedItems[item.id];
    
    let children = [];
    let childType = null;
    
    switch (type) {
      case 'division':
        children = departments.filter(d => d.division_id === item.id);
        childType = 'department';
        break;
      case 'department':
        children = units.filter(u => u.department_id === item.id);
        childType = 'unit';
        break;
      case 'unit':
        children = subUnits.filter(s => s.unit_id === item.id);
        childType = 'sub_unit';
        break;
    }

    const Icon = type === 'division' ? Building2 :
                 type === 'department' ? Users :
                 type === 'unit' ? UsersRound :
                 Users;

    return (
      <div key={item.id} className={styles.hierarchyItem} style={{ marginLeft: `${level * 2}rem` }}>
        <div className={styles.itemHeader}>
          {hasChildren && (
            <button
              className={styles.expandButton}
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <Icon size={20} className={styles.itemIcon} />
          <div className={styles.itemInfo}>
            <h4>{item.name}</h4>
            {item.code && <span className={styles.code}>({item.code})</span>}
            {item.description && <p className={styles.description}>{item.description}</p>}
          </div>
          <div className={styles.itemActions}>
            {childType && (
              <button
                onClick={() => openAddModal(childType, item)}
                className={styles.addChildButton}
                title={`Add ${childType.replace('_', ' ')}`}
              >
                <Plus size={16} />
              </button>
            )}
            <button onClick={() => openEditModal(type, item)} className={styles.editButton}>
              <Edit2 size={16} />
            </button>
            <button onClick={() => handleDelete(type, item.id)} className={styles.deleteButton}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {isExpanded && children.length > 0 && (
          <div className={styles.children}>
            {children.map(child => renderHierarchyItem(child, childType, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading organizational structure...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Organizational Structure</h1>
        <p className={styles.subtitle}>Manage and visualize your company's organizational hierarchy</p>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={activeView === 'hierarchy' ? styles.active : ''}
              onClick={() => setActiveView('hierarchy')}
            >
              Hierarchy
            </button>
            <button
              className={activeView === 'list' ? styles.active : ''}
              onClick={() => setActiveView('list')}
            >
              List
            </button>
          </div>
          <button
            onClick={() => openAddModal('division')}
            className={styles.primaryButton}
          >
            <Plus size={20} />
            Add Division
          </button>
        </div>
      </div>

      {/* Hierarchy View */}
      {activeView === 'hierarchy' && (
        <div className={styles.hierarchyView}>
          {divisions.map(div => renderHierarchyItem(div, 'division'))}
          {divisions.length === 0 && (
            <div className={styles.emptyState}>
              <Building2 size={48} />
              <p>No divisions found. Start by adding a division.</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <div className={styles.listView}>
          <div className={styles.listSection}>
            <h3>Divisions</h3>
            <div className={styles.listGrid}>
              {divisions.map(div => (
                <div key={div.id} className={styles.listCard}>
                  <h4>{div.name}</h4>
                  {div.code && <span className={styles.code}>{div.code}</span>}
                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal('division', div)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('division', div.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.listSection}>
            <h3>Departments</h3>
            <div className={styles.listGrid}>
              {departments.map(dept => (
                <div key={dept.id} className={styles.listCard}>
                  <h4>{dept.name}</h4>
                  {dept.code && <span className={styles.code}>{dept.code}</span>}
                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal('department', dept)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('department', dept.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.listSection}>
            <h3>Units</h3>
            <div className={styles.listGrid}>
              {units.map(unit => (
                <div key={unit.id} className={styles.listCard}>
                  <h4>{unit.name}</h4>
                  {unit.code && <span className={styles.code}>{unit.code}</span>}
                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal('unit', unit)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('unit', unit.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.listSection}>
            <h3>Sub-Units</h3>
            <div className={styles.listGrid}>
              {subUnits.map(sub => (
                <div key={sub.id} className={styles.listCard}>
                  <h4>{sub.name}</h4>
                  {sub.code && <span className={styles.code}>{sub.code}</span>}
                  <span className={styles.badge}>{sub.type}</span>
                  <div className={styles.cardActions}>
                    <button onClick={() => openEditModal('sub_unit', sub)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('sub_unit', sub.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EditModal
          type={modalType}
          item={editingItem}
          parent={selectedParent}
          onClose={closeModal}
          onSave={handleSave}
          divisions={divisions}
          departments={departments}
          units={units}
        />
      )}
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ type, item, parent, onClose, onSave, divisions, departments, units }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    code: item?.code || '',
    description: item?.description || '',
    type: item?.type || 'sub_unit',
    head_id: item?.head_of_division || item?.head_of_department || item?.unit_lead || item?.sub_unit_lead || '',
    is_shared: item?.is_shared || false
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [primaryDepartmentId, setPrimaryDepartmentId] = useState(item?.primary_department_id || null);
  const [primaryUnitId, setPrimaryUnitId] = useState(item?.primary_unit_id || null);
  const [loading, setLoading] = useState(false);

  // Load existing tags and relationships
  useEffect(() => {
    if (item?.id) {
      loadExistingData();
    }
  }, [item]);

  const loadExistingData = async () => {
    if (!item?.id) return;

    // Load tags
    const { data: tagData } = await supabase
      .from('tag_assignments')
      .select('*, tag:organizational_tags(*)')
      .eq('entity_type', type)
      .eq('entity_id', item.id);
    
    if (tagData) {
      setSelectedTags(tagData.map(ta => ta.tag));
    }

    // Load department relationships for units
    if (type === 'unit') {
      const { data: deptData } = await supabase
        .from('unit_departments')
        .select('*, department:departments(*)')
        .eq('unit_id', item.id);
      
      if (deptData) {
        setSelectedDepartments(deptData.map(ud => ud.department));
      }
    }

    // Load unit relationships for sub-units
    if (type === 'sub_unit') {
      const { data: unitData } = await supabase
        .from('sub_unit_units')
        .select('*, unit:units(*)')
        .eq('sub_unit_id', item.id);
      
      if (unitData) {
        setSelectedUnits(unitData.map(su => su.unit));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const saveData = {
      ...formData,
      selectedTags,
      selectedDepartments: type === 'unit' ? selectedDepartments : undefined,
      selectedUnits: type === 'sub_unit' ? selectedUnits : undefined,
      primaryDepartmentId: type === 'unit' ? primaryDepartmentId : undefined,
      primaryUnitId: type === 'sub_unit' ? primaryUnitId : undefined
    };

    await onSave(saveData);
    setLoading(false);
  };

  const getTitle = () => {
    const titles = {
      division: 'Division',
      department: 'Department',
      unit: 'Unit',
      sub_unit: 'Sub-Unit'
    };
    return `${item ? 'Edit' : 'Add'} ${titles[type]}`;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{getTitle()}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className={styles.input}
              placeholder="Example: IT, HR, FIN"
            />
          </div>

          {type === 'sub_unit' && (
            <div className={styles.formGroup}>
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={styles.select}
              >
                <option value="sub_unit">Sub-Unit</option>
                <option value="squad">Squad</option>
                <option value="cell">Cell</option>
                <option value="task_force">Task Force</option>
              </select>
            </div>
          )}

          {/* Multi-department selector for units */}
          {type === 'unit' && (
            <>
              <MultiDepartmentSelector
                departments={departments}
                selectedDepartments={selectedDepartments}
                onDepartmentsChange={setSelectedDepartments}
                primaryDepartmentId={primaryDepartmentId}
                onPrimaryChange={setPrimaryDepartmentId}
              />
              
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  />
                  {' '}Shared Unit (operates across multiple departments)
                </label>
              </div>
            </>
          )}

          {/* Multi-unit selector for sub-units */}
          {type === 'sub_unit' && (
            <>
              <MultiDepartmentSelector
                departments={units} // Reusing component but passing units
                selectedDepartments={selectedUnits}
                onDepartmentsChange={setSelectedUnits}
                primaryDepartmentId={primaryUnitId}
                onPrimaryChange={setPrimaryUnitId}
              />
              
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  />
                  {' '}Shared Sub-Unit (operates across multiple units)
                </label>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className={styles.formGroup}>
            <label>Tags</label>
            <TagSelector
              entityType={type}
              entityId={item?.id}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationalStructure;
