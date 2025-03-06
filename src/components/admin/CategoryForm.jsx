import { useState, useEffect } from 'react';
import styles from './CategoryForm.module.css';

const CategoryForm = ({ techTypes, onSubmit, initialData = null }) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedTechTypes, setSelectedTechTypes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCategoryName(initialData.name);
      setSelectedTechTypes(initialData.category_tech_types.map(ct => ct.tech_type_id));
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim() || selectedTechTypes.length === 0) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await onSubmit({
        id: initialData?.id,
        name: categoryName,
        techTypes: selectedTechTypes
      });

      if (!initialData) {
        // Only reset form if this was a new category creation
        setCategoryName('');
        setSelectedTechTypes([]);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };
    
  const handleTechTypeToggle = (techTypeId) => {
    setSelectedTechTypes(prev => {
      if (prev.includes(techTypeId)) {
        return prev.filter(id => id !== techTypeId);
      } else {
        return [...prev, techTypeId];
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.categoryForm}>
      <h2>{initialData ? 'Edit Category' : 'Add New Category'}</h2>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formGroup}>
        <label>Category Name</label>
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.groupLabel}>Tech Types</label>
        <div className={styles.checkboxGroup}>
          {techTypes.map(type => (
            <div key={type.id} className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    checked={selectedTechTypes.includes(type.id)}
                    onChange={() => handleTechTypeToggle(type.id)}
                    className={styles.checkbox}
                  />
                </div>
                <span className={styles.checkboxText}>{type.name}</span>
              </label>
            </div>
          ))}
        </div>
        {selectedTechTypes.length === 0 && (
          <small className={styles.errorText}>
            Select at least one tech type
          </small>
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        {initialData ? 'Save Changes' : 'Add Category'}
      </button>
    </form>
  );
};

export default CategoryForm;
