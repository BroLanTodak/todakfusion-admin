import { useState, useEffect } from 'react';
import { Plus, X, Building2, Star } from 'lucide-react';
import styles from './MultiDepartmentSelector.module.css';

const MultiDepartmentSelector = ({ 
  departments = [], 
  selectedDepartments = [], 
  onDepartmentsChange,
  primaryDepartmentId,
  onPrimaryChange 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const addDepartment = (dept) => {
    if (selectedDepartments.some(d => d.id === dept.id)) return;
    
    const newSelection = [...selectedDepartments, dept];
    onDepartmentsChange(newSelection);
    
    // If this is the first department, make it primary
    if (newSelection.length === 1 && onPrimaryChange) {
      onPrimaryChange(dept.id);
    }
  };

  const removeDepartment = (deptId) => {
    const newSelection = selectedDepartments.filter(d => d.id !== deptId);
    onDepartmentsChange(newSelection);
    
    // If removing primary department, set first remaining as primary
    if (deptId === primaryDepartmentId && newSelection.length > 0 && onPrimaryChange) {
      onPrimaryChange(newSelection[0].id);
    }
  };

  const setPrimary = (deptId) => {
    if (onPrimaryChange) {
      onPrimaryChange(deptId);
    }
  };

  const availableDepartments = departments.filter(
    dept => !selectedDepartments.some(d => d.id === dept.id)
  );

  return (
    <div className={styles.container}>
      <label className={styles.label}>Departments</label>
      
      <div className={styles.selectedDepartments}>
        {selectedDepartments.length === 0 && (
          <div className={styles.placeholder}>No departments assigned</div>
        )}
        
        {selectedDepartments.map(dept => (
          <div key={dept.id} className={styles.departmentTag}>
            <Building2 size={14} />
            <span>{dept.name}</span>
            {dept.code && <span className={styles.code}>({dept.code})</span>}
            
            {primaryDepartmentId === dept.id ? (
              <Star size={14} className={styles.primaryIcon} fill="currentColor" />
            ) : (
              <button
                onClick={() => setPrimary(dept.id)}
                className={styles.setPrimaryButton}
                title="Set as primary department"
              >
                <Star size={14} />
              </button>
            )}
            
            <button
              onClick={() => removeDepartment(dept.id)}
              className={styles.removeButton}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {availableDepartments.length > 0 && (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={styles.addButton}
          >
            <Plus size={14} />
            Add Department
          </button>
        )}
      </div>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Available Departments</span>
            <button 
              onClick={() => setShowDropdown(false)}
              className={styles.closeDropdown}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className={styles.departmentList}>
            {availableDepartments.map(dept => (
              <button
                key={dept.id}
                onClick={() => {
                  addDepartment(dept);
                  setShowDropdown(false);
                }}
                className={styles.departmentOption}
              >
                <Building2 size={16} />
                <span>{dept.name}</span>
                {dept.code && <span className={styles.code}>({dept.code})</span>}
              </button>
            ))}
            
            {availableDepartments.length === 0 && (
              <div className={styles.emptyMessage}>
                All departments have been assigned
              </div>
            )}
          </div>
        </div>
      )}
      
      {selectedDepartments.length > 1 && (
        <div className={styles.hint}>
          <Star size={12} /> indicates primary department
        </div>
      )}
    </div>
  );
};

export default MultiDepartmentSelector;
