// AI Database Actions - Enable AI to modify database with safety checks
import { supabase } from './supabase';

// Define available actions and their safety levels
const AI_ACTIONS = {
  // Vision & Mission Actions
  UPDATE_VISION: 'update_vision',
  UPDATE_MISSION: 'update_mission',
  
  // Strategic Foundation Actions
  ADD_CORE_VALUE: 'add_core_value',
  ADD_STRATEGIC_OBJECTIVE: 'add_strategic_objective',
  ADD_STRATEGIC_PILLAR: 'add_strategic_pillar',
  
  // OKR Actions
  CREATE_OBJECTIVE: 'create_objective',
  UPDATE_OBJECTIVE: 'update_objective',
  DELETE_OBJECTIVE: 'delete_objective',
  CREATE_KEY_RESULT: 'create_key_result',
  UPDATE_KEY_RESULT: 'update_key_result',
  
  // SWOT Actions
  ADD_SWOT_ITEM: 'add_swot_item',
  UPDATE_SWOT_ITEM: 'update_swot_item',
  DELETE_SWOT_ITEM: 'delete_swot_item',
  
  // Canvas Actions
  UPDATE_CANVAS_BLOCK: 'update_canvas_block'
};

// Safety levels
const SAFETY_LEVELS = {
  LOW: 'low',      // Can execute immediately
  MEDIUM: 'medium', // Requires confirmation
  HIGH: 'high'     // Requires explicit approval with preview
};

// Action safety mapping
const ACTION_SAFETY = {
  [AI_ACTIONS.UPDATE_VISION]: SAFETY_LEVELS.HIGH,
  [AI_ACTIONS.UPDATE_MISSION]: SAFETY_LEVELS.HIGH,
  [AI_ACTIONS.ADD_CORE_VALUE]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.ADD_STRATEGIC_OBJECTIVE]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.ADD_STRATEGIC_PILLAR]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.CREATE_OBJECTIVE]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.UPDATE_OBJECTIVE]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.DELETE_OBJECTIVE]: SAFETY_LEVELS.HIGH,
  [AI_ACTIONS.CREATE_KEY_RESULT]: SAFETY_LEVELS.LOW,
  [AI_ACTIONS.UPDATE_KEY_RESULT]: SAFETY_LEVELS.LOW,
  [AI_ACTIONS.ADD_SWOT_ITEM]: SAFETY_LEVELS.LOW,
  [AI_ACTIONS.UPDATE_SWOT_ITEM]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.DELETE_SWOT_ITEM]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.UPDATE_CANVAS_BLOCK]: SAFETY_LEVELS.MEDIUM
};

// Parse AI intent to extract action and parameters
export function parseAIIntent(aiResponse) {
  // Look for action patterns in AI response
  const actionPatterns = {
    [AI_ACTIONS.UPDATE_VISION]: /(?:update|change|modify|set)\s+(?:the\s+)?vision\s+to:?\s*"([^"]+)"/i,
    [AI_ACTIONS.UPDATE_MISSION]: /(?:update|change|modify|set)\s+(?:the\s+)?mission\s+to:?\s*"([^"]+)"/i,
    [AI_ACTIONS.ADD_CORE_VALUE]: /(?:add|create)\s+(?:a\s+)?(?:core\s+)?value:?\s*"([^"]+)"(?:\s*-\s*"([^"]+)")?/i,
    [AI_ACTIONS.ADD_STRATEGIC_OBJECTIVE]: /(?:add|create)\s+(?:a\s+)?strategic\s+objective:?\s*"([^"]+)"(?:\s*-\s*"([^"]+)")?/i,
    [AI_ACTIONS.ADD_STRATEGIC_PILLAR]: /(?:add|create)\s+(?:a\s+)?strategic\s+pillar:?\s*"([^"]+)"(?:\s*-\s*"([^"]+)")?/i,
    [AI_ACTIONS.CREATE_OBJECTIVE]: /(?:create|add|new)\s+(?:quarterly\s+)?objective:?\s*"([^"]+)"/i,
    [AI_ACTIONS.ADD_SWOT_ITEM]: /add\s+to\s+(strength|weakness|opportunity|threat):?\s*"([^"]+)"/i,
  };

  for (const [action, pattern] of Object.entries(actionPatterns)) {
    const match = aiResponse.match(pattern);
    if (match) {
      return {
        action,
        params: extractParams(action, match),
        safetyLevel: ACTION_SAFETY[action]
      };
    }
  }

  return null;
}

// Extract parameters based on action type
function extractParams(action, match) {
  switch (action) {
    case AI_ACTIONS.UPDATE_VISION:
    case AI_ACTIONS.UPDATE_MISSION:
      return { content: match[1] };
    
    case AI_ACTIONS.ADD_CORE_VALUE:
      return { 
        title: match[1],
        description: match[2] || ''
      };
    
    case AI_ACTIONS.ADD_STRATEGIC_OBJECTIVE:
      return { 
        title: match[1],
        description: match[2] || '',
        timeframe: '3_years'
      };
    
    case AI_ACTIONS.ADD_STRATEGIC_PILLAR:
      return { 
        name: match[1],
        description: match[2] || ''
      };
    
    case AI_ACTIONS.CREATE_OBJECTIVE:
      return { title: match[1] };
    
    case AI_ACTIONS.ADD_SWOT_ITEM:
      return { 
        category: match[1].toLowerCase(),
        content: match[2]
      };
    
    default:
      return {};
  }
}

// Execute database action with safety checks
export async function executeAIAction(action, params, userId, needsConfirmation = true) {
  try {
    // High safety actions always need confirmation
    if (ACTION_SAFETY[action] === SAFETY_LEVELS.HIGH && needsConfirmation) {
      return {
        success: false,
        requiresConfirmation: true,
        action,
        params,
        message: 'This action requires your confirmation'
      };
    }

    // Execute based on action type
    switch (action) {
      case AI_ACTIONS.UPDATE_VISION:
        return await updateVisionMission('vision', params.content, userId);
      
      case AI_ACTIONS.UPDATE_MISSION:
        return await updateVisionMission('mission', params.content, userId);
      
      case AI_ACTIONS.ADD_CORE_VALUE:
        return await addCoreValue(params, userId);
      
      case AI_ACTIONS.ADD_STRATEGIC_OBJECTIVE:
        return await addStrategicObjective(params, userId);
      
      case AI_ACTIONS.ADD_STRATEGIC_PILLAR:
        return await addStrategicPillar(params, userId);
      
      case AI_ACTIONS.CREATE_OBJECTIVE:
        return await createObjective(params, userId);
      
      case AI_ACTIONS.ADD_SWOT_ITEM:
        return await addSwotItem(params, userId);
      
      default:
        return {
          success: false,
          error: 'Unknown action'
        };
    }
  } catch (error) {
    console.error('AI Action Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Database operation functions
async function updateVisionMission(type, content, userId) {
  // First, set all existing ones to not current
  await supabase
    .from('visions_missions')
    .update({ is_current: false })
    .eq('type', type)
    .eq('is_current', true);

  // Insert new version
  const { data, error } = await supabase
    .from('visions_missions')
    .insert({
      type,
      content,
      is_current: true,
      created_by: userId,
      ai_enhanced: true,
      change_reason: 'Updated by AI assistant'
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: `ai_update_${type}`,
      entity_type: 'vision_mission',
      entity_id: data.id,
      description: `AI updated ${type}`,
      metadata: { content }
    });

  return {
    success: true,
    data,
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
  };
}

async function createObjective(params, userId) {
  const { data, error } = await supabase
    .from('objectives')
    .insert({
      title: params.title,
      description: params.description || '',
      quarter: getCurrentQuarter(),
      year: new Date().getFullYear(),
      status: 'active',
      created_by: userId,
      ai_generated: true
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data,
    message: 'Objective created successfully'
  };
}

async function addSwotItem(params, userId) {
  const { data, error } = await supabase
    .from('swot_items')
    .insert({
      category: params.category,
      content: params.content,
      impact_level: params.impactLevel || 'medium',
      created_by: userId,
      ai_generated: true
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data,
    message: `Added to ${params.category}s`
  };
}

// Helper function to get current quarter
function getCurrentQuarter() {
  const month = new Date().getMonth() + 1;
  return `Q${Math.ceil(month / 3)}`;
}

// Add core value
async function addCoreValue(params, userId) {
  const { data, error } = await supabase
    .from('core_values')
    .insert({
      title: params.title,
      description: params.description,
      icon: '💎',
      created_by: userId,
      order_position: 999 // Will be at the end
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data,
    message: `Core value "${params.title}" added successfully`
  };
}

// Add strategic objective
async function addStrategicObjective(params, userId) {
  // Calculate target date based on timeframe
  const targetDate = new Date();
  const years = params.timeframe === '1_year' ? 1 : params.timeframe === '5_years' ? 5 : 3;
  targetDate.setFullYear(targetDate.getFullYear() + years);

  const { data, error } = await supabase
    .from('strategic_objectives')
    .insert({
      title: params.title,
      description: params.description,
      timeframe: params.timeframe,
      target_date: targetDate.toISOString().split('T')[0],
      created_by: userId,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data,
    message: `Strategic objective "${params.title}" created for ${years} year timeframe`
  };
}

// Add strategic pillar
async function addStrategicPillar(params, userId) {
  const { data, error } = await supabase
    .from('strategic_pillars')
    .insert({
      name: params.name,
      description: params.description,
      icon: '🏛️',
      color: '#3498db',
      created_by: userId,
      order_position: 999
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data,
    message: `Strategic pillar "${params.name}" added successfully`
  };
}

// Format action for display
export function formatActionForConfirmation(action, params) {
  switch (action) {
    case AI_ACTIONS.UPDATE_VISION:
      return {
        title: 'Update Vision Statement',
        description: 'The AI wants to update your vision to:',
        content: params.content,
        warning: 'This will create a new version of your vision statement.'
      };
    
    case AI_ACTIONS.UPDATE_MISSION:
      return {
        title: 'Update Mission Statement',
        description: 'The AI wants to update your mission to:',
        content: params.content,
        warning: 'This will create a new version of your mission statement.'
      };
    
    case AI_ACTIONS.ADD_CORE_VALUE:
      return {
        title: 'Add Core Value',
        description: 'The AI wants to add a new core value:',
        content: `${params.title}${params.description ? ' - ' + params.description : ''}`,
        warning: 'This will add a fundamental value that guides your company\'s actions.'
      };
    
    case AI_ACTIONS.ADD_STRATEGIC_OBJECTIVE:
      return {
        title: 'Add Strategic Objective',
        description: 'The AI wants to add a long-term strategic objective:',
        content: `${params.title}${params.description ? ' - ' + params.description : ''}`,
        warning: `This will create a ${params.timeframe.replace('_', ' ')} strategic goal.`
      };
    
    case AI_ACTIONS.ADD_STRATEGIC_PILLAR:
      return {
        title: 'Add Strategic Pillar',
        description: 'The AI wants to add a strategic focus area:',
        content: `${params.name}${params.description ? ' - ' + params.description : ''}`,
        warning: 'This will add a key focus area for your business strategy.'
      };
    
    case AI_ACTIONS.CREATE_OBJECTIVE:
      return {
        title: 'Create New Objective',
        description: 'The AI wants to create a new objective:',
        content: params.title,
        warning: null
      };
    
    default:
      return {
        title: 'AI Action',
        description: 'The AI wants to perform an action',
        content: JSON.stringify(params),
        warning: null
      };
  }
}
