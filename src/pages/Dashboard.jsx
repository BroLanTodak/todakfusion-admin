import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Grid3X3, Target, Activity, Users, TrendingUp, Building2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moduleData, setModuleData] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);

  const modules = [
    { 
      id: 'strategic',
      icon: Building2, 
      label: 'Strategic Foundation', 
      path: '/strategic-foundation', 
      color: '#9b59b6',
      tables: ['core_values', 'strategic_objectives', 'strategic_pillars', 'target_markets', 'strategic_milestones'],
      minRequired: 3 // At least 3 items across all tables
    },
    { 
      id: 'vision',
      icon: Eye, 
      label: 'Vision & Mission', 
      path: '/vision-mission', 
      color: '#3498db',
      tables: ['visions_missions'],
      checkFields: ['vision', 'mission'] // Check both vision and mission exist
    },
    { 
      id: 'canvas',
      icon: Grid3X3, 
      label: 'Business Canvas', 
      path: '/canvas', 
      color: '#2ecc71',
      tables: ['canvas_blocks'],
      minRequired: 9 // At least 1 item in each of 9 blocks
    },
    { 
      id: 'okr',
      icon: Target, 
      label: 'OKR Management', 
      path: '/okr', 
      color: '#f39c12',
      tables: ['objectives', 'key_results'],
      minRequired: 1 // At least 1 objective
    },
    { 
      id: 'swot',
      icon: Activity, 
      label: 'SWOT Analysis', 
      path: '/swot', 
      color: '#e74c3c',
      tables: ['swot_items'],
      checkCategories: ['strength', 'weakness', 'opportunity', 'threat'] // Need at least 1 in each
    },
  ];

  useEffect(() => {
    fetchModuleData();
  }, []);

  const fetchModuleData = async () => {
    setLoading(true);
    const data = {};
    let completedModules = 0;

    try {
      // Fetch data for each module
      for (const module of modules) {
        data[module.id] = { count: 0, isComplete: false, details: {} };

        if (module.id === 'vision') {
          // Check vision and mission
          const { data: visionData } = await supabase
            .from('visions_missions')
            .select('type')
            .eq('is_current', true);
          
          const hasVision = visionData?.some(item => item.type === 'vision');
          const hasMission = visionData?.some(item => item.type === 'mission');
          
          data[module.id].count = (hasVision ? 1 : 0) + (hasMission ? 1 : 0);
          data[module.id].isComplete = hasVision && hasMission;
          data[module.id].details = { vision: hasVision, mission: hasMission };
        }
        else if (module.id === 'canvas') {
          // Check canvas blocks
          const { data: canvasData } = await supabase
            .from('canvas_blocks')
            .select('block_type');
          
          const blockTypes = new Set(canvasData?.map(item => item.block_type) || []);
          data[module.id].count = blockTypes.size;
          data[module.id].isComplete = blockTypes.size >= 9;
        }
        else if (module.id === 'swot') {
          // Check SWOT categories
          const { data: swotData } = await supabase
            .from('swot_items')
            .select('category');
          
          const categories = new Set(swotData?.map(item => item.category) || []);
          data[module.id].count = swotData?.length || 0;
          data[module.id].isComplete = categories.size === 4;
          data[module.id].details = {
            strength: categories.has('strength'),
            weakness: categories.has('weakness'),
            opportunity: categories.has('opportunity'),
            threat: categories.has('threat')
          };
        }
        else if (module.id === 'okr') {
          // Check objectives and key results
          const { data: objectives } = await supabase
            .from('objectives')
            .select('id');
          
          const { data: keyResults } = await supabase
            .from('key_results')
            .select('id');
          
          data[module.id].count = objectives?.length || 0;
          data[module.id].hasKeyResults = (keyResults?.length || 0) > 0;
          data[module.id].isComplete = (objectives?.length || 0) > 0 && (keyResults?.length || 0) > 0;
        }
        else if (module.id === 'strategic') {
          // Check all strategic foundation tables
          let totalCount = 0;
          for (const table of module.tables) {
            const { count } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            totalCount += count || 0;
          }
          
          data[module.id].count = totalCount;
          data[module.id].isComplete = totalCount >= module.minRequired;
        }

        if (data[module.id].isComplete) {
          completedModules++;
        }
      }

      setModuleData(data);
      setOverallProgress(Math.round((completedModules / modules.length) * 100));
    } catch (error) {
      console.error('Error fetching module data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Track your business planning progress</p>
        </div>
        <div className={styles.overallProgress}>
          <div className={styles.progressCircle}>
            <svg width="100" height="100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#3498db"
                strokeWidth="6"
                strokeDasharray={`${overallProgress * 2.64} 264`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className={styles.progressText}>{overallProgress}%</div>
          </div>
          <div className={styles.progressLabel}>Overall Completion</div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.modulesSection}>
          <h2 className={styles.sectionTitle}>Business Planning Modules</h2>
          <div className={styles.moduleGrid}>
            {modules.map((module) => {
              const Icon = module.icon;
              const data = moduleData[module.id] || {};
              const StatusIcon = data.isComplete ? CheckCircle2 : Circle;
              
              return (
                <div 
                  key={module.path} 
                  className={`${styles.moduleCard} ${data.isComplete ? styles.complete : ''}`}
                  onClick={() => navigate(module.path)}
                  style={{ '--module-color': module.color }}
                >
                  <div className={styles.moduleHeader}>
                    <Icon size={24} style={{ color: module.color }} />
                    <StatusIcon 
                      size={20} 
                      className={data.isComplete ? styles.completeIcon : styles.incompleteIcon}
                    />
                  </div>
                  <h3 className={styles.moduleTitle}>{module.label}</h3>
                  <div className={styles.moduleStatus}>
                    {data.isComplete ? (
                      <span className={styles.statusComplete}>✓ Completed</span>
                    ) : (
                      <span className={styles.statusIncomplete}>
                        {data.count > 0 ? `In Progress (${data.count} items)` : 'Not Started'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.checklistSection}>
          <h2 className={styles.sectionTitle}>Completion Checklist</h2>
          <div className={styles.checklist}>
            {/* Vision & Mission */}
            <div className={styles.checklistItem}>
              <div className={styles.checklistHeader}>
                <Eye size={20} style={{ color: '#3498db' }} />
                <span>Vision & Mission</span>
              </div>
              <div className={styles.checklistDetails}>
                <div className={styles.checkItem}>
                  {moduleData.vision?.details?.vision ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Company Vision Statement</span>
                </div>
                <div className={styles.checkItem}>
                  {moduleData.vision?.details?.mission ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Company Mission Statement</span>
                </div>
              </div>
            </div>

            {/* Strategic Foundation */}
            <div className={styles.checklistItem}>
              <div className={styles.checklistHeader}>
                <Building2 size={20} style={{ color: '#9b59b6' }} />
                <span>Strategic Foundation</span>
              </div>
              <div className={styles.checklistDetails}>
                <div className={styles.checkItem}>
                  {moduleData.strategic?.count >= 3 ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>At least 3 strategic elements defined ({moduleData.strategic?.count || 0} items)</span>
                </div>
              </div>
            </div>

            {/* Business Canvas */}
            <div className={styles.checklistItem}>
              <div className={styles.checklistHeader}>
                <Grid3X3 size={20} style={{ color: '#2ecc71' }} />
                <span>Business Canvas</span>
              </div>
              <div className={styles.checklistDetails}>
                <div className={styles.checkItem}>
                  {moduleData.canvas?.count >= 9 ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>All 9 canvas blocks filled ({moduleData.canvas?.count || 0}/9)</span>
                </div>
              </div>
            </div>

            {/* SWOT Analysis */}
            <div className={styles.checklistItem}>
              <div className={styles.checklistHeader}>
                <Activity size={20} style={{ color: '#e74c3c' }} />
                <span>SWOT Analysis</span>
              </div>
              <div className={styles.checklistDetails}>
                <div className={styles.checkItem}>
                  {moduleData.swot?.details?.strength ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Strengths identified</span>
                </div>
                <div className={styles.checkItem}>
                  {moduleData.swot?.details?.weakness ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Weaknesses identified</span>
                </div>
                <div className={styles.checkItem}>
                  {moduleData.swot?.details?.opportunity ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Opportunities identified</span>
                </div>
                <div className={styles.checkItem}>
                  {moduleData.swot?.details?.threat ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Threats identified</span>
                </div>
              </div>
            </div>

            {/* OKR */}
            <div className={styles.checklistItem}>
              <div className={styles.checklistHeader}>
                <Target size={20} style={{ color: '#f39c12' }} />
                <span>OKR Management</span>
              </div>
              <div className={styles.checklistDetails}>
                <div className={styles.checkItem}>
                  {moduleData.okr?.count > 0 ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>At least 1 objective set</span>
                </div>
                <div className={styles.checkItem}>
                  {moduleData.okr?.hasKeyResults ? <CheckCircle2 size={16} className={styles.checked} /> : <Circle size={16} />}
                  <span>Key results defined</span>
                </div>
              </div>
            </div>
          </div>

          {overallProgress < 100 && (
            <div className={styles.tip}>
              <AlertCircle size={20} />
              <span>Complete all modules to unlock the full potential of your business planning system!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;