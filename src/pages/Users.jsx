import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      setError('Failed to fetch users: ' + error.message);
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      setError('Failed to delete user: ' + error.message);
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading users...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <button className={styles.addButton}>
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>No users found</h3>
          <p className={styles.emptyText}>
            Get started by adding your first user.
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>User</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Created</th>
                <th className={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {user.full_name || 'Unnamed User'}
                      </span>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span
                      className={`${styles.badge} ${
                        user.status === 'active'
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        title="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(user.id)}
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;