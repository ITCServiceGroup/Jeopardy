import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import styles from './CategoryManager.module.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [techTypes, setTechTypes] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedTechTypes, setSelectedTechTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tech types
      const { data: techTypesData, error: techTypesError } = await supabase
        .from('tech_types')
        .select('*')
        .order('name');

      if (techTypesError) throw techTypesError;
      setTechTypes(techTypesData);
      
      // Fetch categories with tech type information
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          category_tech_types (
            tech_type_id,
            tech_types (
              id,
              name
            )
          ),
          questions!left (
            id
          )
        `)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch statistics for each category's questions
      const categoriesWithStats = await Promise.all(
        categoriesData.map(async category => {
          const questionIds = category.questions?.map(q => q.id) || [];
          
          if (questionIds.length === 0) {
            return {
              ...category,
              stats: []
            };
          }

          const { data: statsData } = await supabase
            .from('game_statistics')
            .select('correct')
            .in('question_id', questionIds);

          return {
            ...category,
            stats: statsData || []
          };
        })
      );

      setCategories(categoriesWithStats);
    } catch (err) {
      setError('Error fetching data: ' + err.message);
      console.error('Detailed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim() || selectedTechTypes.length === 0) return;

    try {
      // First create the category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: newCategory.trim()
        })
        .select('id')
        .single();

      if (categoryError) throw categoryError;

      // Then create the tech type assignments
      const { error: techTypesError } = await supabase
        .from('category_tech_types')
        .insert(
          selectedTechTypes.map(techTypeId => ({
            category_id: categoryData.id,
            tech_type_id: techTypeId
          }))
        );

      if (techTypesError) throw techTypesError;

      setNewCategory('');
      setSelectedTechTypes([]);
      await fetchData();
    } catch (err) {
      setError('Error adding category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? All associated questions will be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      setError('Error deleting category: ' + err.message);
    }
  };

  const calculateSuccessRate = (category) => {
    if (!category.stats || category.stats.length === 0) return 0;
    
    const correctAnswers = category.stats.filter(stat => stat.correct).length;
    return Math.round((correctAnswers / category.stats.length) * 100);
  };

  const filteredCategories = categories.filter(category => {
    if (filter === 'all') return true;
    return category.category_tech_types?.some(
      ctt => ctt.tech_type_id.toString() === filter
    );
  });

  const getTechTypeNames = (category) => {
    return category.category_tech_types
      ?.map(ctt => ctt.tech_types.name)
      .join(' & ') || 'No type';
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

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div className={styles.categoryManager}>
      <div className={styles.header}>
        <h2>Category Management</h2>
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Filter by Tech Type:</span>
          <select 
            className={styles.filterSelect}
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {techTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      <form onSubmit={handleAddCategory} className={styles.addCategoryForm}>
        <div className={styles.formGroup}>
          <label>Category Name</label>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tech Types</label>
          <div className={styles.checkboxGroup}>
            {techTypes.map(type => (
              <label key={type.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedTechTypes.includes(type.id)}
                  onChange={() => handleTechTypeToggle(type.id)}
                />
                {type.name}
              </label>
            ))}
          </div>
          {selectedTechTypes.length === 0 && (
            <small className={styles.errorText}>
              Select at least one tech type
            </small>
          )}
        </div>
        <button type="submit" className={styles.addButton}>
          Add Category
        </button>
      </form>

      <div className={styles.categoriesGrid}>
        {filteredCategories.map(category => (
          <div key={category.id} className={styles.categoryCard}>
            <h3 className={styles.categoryName}>{category.name}</h3>
            <div className={styles.techTypeBadges}>
              {category.category_tech_types?.map(ctt => (
                <span key={ctt.tech_type_id} className={styles.techTypeBadge}>
                  {ctt.tech_types.name}
                </span>
              ))}
            </div>
            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Questions</span>
                <span className={styles.statValue}>
                  {category.questions?.length || 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Success Rate</span>
                <span className={styles.statValue}>
                  {calculateSuccessRate(category)}%
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className={styles.deleteButton}
            >
              Delete Category
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
