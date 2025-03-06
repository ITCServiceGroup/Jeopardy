import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import CategoryForm from './CategoryForm';
import styles from './CategoryManager.module.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [techTypes, setTechTypes] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, categoryToEdit: null });
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

  const handleSubmitCategory = async (formData) => {
    // Clear any previous error
    setError(null);

    try {
      let categoryData;
      let categoryError;

      if (formData.id) {
        // Update existing category
        const { data, error } = await supabase
          .from('categories')
          .update({ name: formData.name.trim() })
          .eq('id', formData.id)
          .select()
          .single();
        categoryData = data;
        categoryError = error;
      } else {
        // Check if a category with the same name and overlapping tech types exists
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id, category_tech_types!inner(tech_type_id)')
          .ilike('name', formData.name.trim())
          .in('category_tech_types.tech_type_id', formData.techTypes);

        if (existingCategory && existingCategory.length > 0) {
          throw new Error('A category with this name already exists for the selected tech type(s).');
        }

        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert({ name: formData.name.trim() })
          .select()
          .single();
        categoryData = data;
        categoryError = error;
      }

      if (categoryError) throw categoryError;

      // Delete existing tech type assignments if updating
      if (formData.id) {
        const { error: deleteError } = await supabase
          .from('category_tech_types')
          .delete()
          .eq('category_id', formData.id);
          
        if (deleteError) throw deleteError;
      }

      // Create tech type assignments
      const { error: techTypesError } = await supabase
        .from('category_tech_types')
        .insert(
          formData.techTypes.map(techTypeId => ({
            category_id: categoryData.id,
            tech_type_id: techTypeId
          }))
        );

      if (techTypesError) throw techTypesError;

      await fetchData();
    } catch (err) {
      setError('Error saving category: ' + err.message);
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

  if (loading) return <LoadingSpinner message="Loading categories..." theme="light" />;

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
          {error}
        </div>
      )}

      <button
        onClick={() => setModalState({ isOpen: true, categoryToEdit: null })}
        className={styles.addButton}
      >
        Add New Category
      </button>

      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false, categoryToEdit: null })}
      >
        <CategoryForm 
          techTypes={techTypes}
          initialData={modalState.categoryToEdit}
          onSubmit={async (formData) => {
            await handleSubmitCategory(formData);
            setModalState({ isOpen: false, categoryToEdit: null });
          }}
        />
      </Modal>

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
            <div className={styles.cardButtons}>
              <button
                onClick={() => setModalState({ 
                  isOpen: true, 
                  categoryToEdit: category 
                })}
                className={styles.editButton}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
