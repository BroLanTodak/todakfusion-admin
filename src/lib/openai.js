// OpenAI API configuration and helper functions

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Check if API key is available
if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables');
}

// Helper function to make OpenAI API calls
export async function callOpenAI(messages, options = {}) {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Response:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Specific AI functions for different modules

// Vision/Mission AI Helper
export async function improveVisionMission(type, content, action = 'improve') {
  const prompts = {
    improve: `Improve this company ${type} statement to be more clear, inspiring, and impactful. Keep it concise:\n\n"${content}"`,
    
    suggest: `Generate a compelling ${type} statement for a company. Make it inspiring and memorable.`,
    
    critique: `Analyze this ${type} statement and provide constructive feedback on its strengths and areas for improvement:\n\n"${content}"`
  };

  const messages = [
    {
      role: 'system',
      content: `You are a business strategy expert helping to craft excellent ${type} statements. Respond in a professional, constructive manner.`
    },
    {
      role: 'user',
      content: prompts[action] || prompts.improve
    }
  ];

  return await callOpenAI(messages);
}

// SWOT Analysis AI Helper
export async function analyzeSWOT(category, existingItems = [], action = 'suggest') {
  const categoryNames = {
    strength: 'strengths',
    weakness: 'weaknesses',
    opportunity: 'opportunities',
    threat: 'threats'
  };

  const prompts = {
    suggest: `Based on modern business analysis, suggest 3-5 potential ${categoryNames[category]} for a company. Be specific and actionable.${existingItems.length > 0 ? `\n\nExisting items: ${existingItems.join(', ')}` : ''}`,
    
    analyze: `Analyze these ${categoryNames[category]} and provide insights on their impact and how to address them:\n\n${existingItems.join('\n')}`,
    
    prioritize: `Rank these ${categoryNames[category]} by importance and explain why:\n\n${existingItems.join('\n')}`
  };

  const messages = [
    {
      role: 'system',
      content: 'You are a strategic business analyst expert in SWOT analysis. Provide practical, actionable insights.'
    },
    {
      role: 'user',
      content: prompts[action] || prompts.suggest
    }
  ];

  return await callOpenAI(messages);
}

// OKR AI Helper
export async function generateOKR(objective, existingKRs = [], action = 'suggest') {
  const prompts = {
    suggest: `For the objective "${objective}", suggest 3-5 measurable key results. Each should be specific, time-bound, and have clear metrics.`,
    
    improve: `Improve this objective to be more ambitious and inspiring while keeping it achievable:\n\n"${objective}"`,
    
    validate: `Analyze if these key results properly support the objective "${objective}":\n\n${existingKRs.join('\n')}`
  };

  const messages = [
    {
      role: 'system',
      content: 'You are an OKR expert. Help create effective Objectives and Key Results following best practices.'
    },
    {
      role: 'user',
      content: prompts[action] || prompts.suggest
    }
  ];

  return await callOpenAI(messages);
}

// Business Canvas AI Helper
export async function analyzeCanvas(blockType, currentItems = [], action = 'suggest') {
  const blockDescriptions = {
    key_partners: 'key partners and suppliers',
    key_activities: 'key activities',
    key_resources: 'key resources',
    value_propositions: 'value propositions',
    customer_relationships: 'customer relationship strategies',
    channels: 'distribution channels',
    customer_segments: 'customer segments',
    cost_structure: 'cost structure elements',
    revenue_streams: 'revenue streams'
  };

  const prompts = {
    suggest: `Suggest 3-5 ${blockDescriptions[blockType]} for a modern business. Be specific and practical.`,
    
    analyze: `Analyze these ${blockDescriptions[blockType]} and suggest improvements:\n\n${currentItems.join('\n')}`,
    
    expand: `Based on these ${blockDescriptions[blockType]}, suggest additional complementary items:\n\n${currentItems.join('\n')}`
  };

  const messages = [
    {
      role: 'system',
      content: 'You are a business model expert familiar with the Business Model Canvas framework. Provide practical suggestions.'
    },
    {
      role: 'user',
      content: prompts[action] || prompts.suggest
    }
  ];

  return await callOpenAI(messages);
}

// General business planning chatbot
export async function chatWithAI(userMessage, context = {}) {
  // Build context-aware system prompt
  let systemPrompt = `You are Todak AI, a helpful business planning assistant for Todak Fusion. You help users with their vision, mission, OKRs, SWOT analysis, and business model canvas.`;

  // Add page-specific context
  if (context.currentPage === '/vision-mission' && context.pageData) {
    systemPrompt += `\n\nCurrent Vision & Mission data:`;
    if (context.pageData.vision) {
      systemPrompt += `\nVision: "${context.pageData.vision}"`;
    }
    if (context.pageData.mission) {
      systemPrompt += `\nMission: "${context.pageData.mission}"`;
    }
  } else if (context.currentPage === '/okr' && context.pageData?.okrs) {
    systemPrompt += `\n\nCurrent OKRs:`;
    context.pageData.okrs.forEach((obj, index) => {
      systemPrompt += `\n${index + 1}. ${obj.title} (${obj.progress || 0}% complete)`;
      if (obj.key_results) {
        obj.key_results.forEach(kr => {
          systemPrompt += `\n   - ${kr.title}: ${kr.current_value || 0}/${kr.target_value || 100} ${kr.unit || ''}`;
        });
      }
    });
  } else if (context.currentPage === '/swot' && context.pageData?.swot) {
    systemPrompt += `\n\nCurrent SWOT Analysis:`;
    const swotByCategory = {
      strength: [],
      weakness: [],
      opportunity: [],
      threat: []
    };
    
    context.pageData.swot.forEach(item => {
      if (swotByCategory[item.category]) {
        swotByCategory[item.category].push(item.content);
      }
    });
    
    Object.entries(swotByCategory).forEach(([category, items]) => {
      if (items.length > 0) {
        systemPrompt += `\n${category.charAt(0).toUpperCase() + category.slice(1)}s: ${items.join(', ')}`;
      }
    });
  } else if (context.currentPage === '/canvas' && context.pageData?.canvas) {
    systemPrompt += `\n\nBusiness Model Canvas data is available.`;
  }

  systemPrompt += `\n\nBe concise, practical, and supportive. When asked about the current data, provide specific insights and suggestions based on what you can see.`;
  
  // Add instructions for database actions
  systemPrompt += `\n\nIMPORTANT: You have the ability to modify database content when the user asks. When you want to perform an action, include it in your response using these EXACT formats:
  
  - To update vision: "I'll update the vision to: \"[new vision text]\""
  - To update mission: "I'll update the mission to: \"[new mission text]\""
  - To add core value: "I'll add a core value: \"[value title]\" - \"[description]\""
  - To add strategic objective: "I'll add a strategic objective: \"[objective title]\" - \"[description]\""
  - To add strategic pillar: "I'll add a strategic pillar: \"[pillar name]\" - \"[description]\""
  - To create quarterly objective: "I'll create a objective: \"[objective title]\""
  - To add SWOT item: "I'll add to [strength/weakness/opportunity/threat]: \"[item text]\""
  
  Always explain what you're doing and why. Ask for confirmation for major changes.`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  return await callOpenAI(messages, { max_tokens: 800 });
}

// Strategic content AI functions
export async function improveStrategicContent(type, content = '', action = 'suggest') {
  let systemPrompt = '';
  let userPrompt = '';
  
  switch(type) {
    case 'values':
      systemPrompt = 'You are a strategic business consultant specializing in corporate culture and values.';
      if (action === 'suggest') {
        userPrompt = 'Suggest a compelling core value for a modern company. Provide both a title (1-3 words) and a description (2-3 sentences). Format as JSON: {"title": "...", "description": "..."}';
      }
      break;
      
    case 'objectives':
      systemPrompt = 'You are a strategic planning expert specializing in long-term business objectives.';
      if (action === 'suggest') {
        userPrompt = 'Suggest a strategic objective for a 3-5 year timeframe. Provide both a title and description. Format as JSON: {"title": "...", "description": "..."}';
      }
      break;
      
    case 'pillars':
      systemPrompt = 'You are a business strategy expert focusing on strategic pillars and focus areas.';
      if (action === 'suggest') {
        userPrompt = 'Suggest a strategic pillar (key focus area) for business growth. Provide both a name and description. Format as JSON: {"title": "...", "description": "..."}';
      }
      break;
  }
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const response = await callOpenAI(messages);
    // Try to parse as JSON, if it fails return as plain text
    try {
      return JSON.parse(response);
    } catch {
      return { title: response, description: '' };
    }
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}

// SWOT Analysis AI functions
export async function improveSWOTCategory(category, currentItems = [], action = 'suggest') {
  const categoryDescriptions = {
    strength: "Internal positive attributes and resources that give the company an advantage",
    weakness: "Internal limitations or areas that need improvement",
    opportunity: "External factors that could provide competitive advantages",
    threat: "External challenges that could negatively impact the business"
  };

  const prompts = {
    suggest: `Suggest 3-5 ${category}s for a business in the technology/software industry. Consider ${categoryDescriptions[category]}. Current items: ${currentItems.join(', ') || 'None'}. Return as a simple list.`,
    improve: `Review and improve these ${category}s: ${currentItems.join(', ')}. Make them more specific, actionable, and impactful. Return as a simple list.`,
    critique: `Critically analyze these ${category}s: ${currentItems.join(', ')}. Identify gaps, overlaps, or areas that need more clarity. Provide constructive feedback.`
  };

  const response = await callOpenAI(prompts[action], 150);
  return response;
}

// OKR AI functions
export async function improveOKR(type, content = '', context = '', action = 'suggest') {
  const prompts = {
    objective: {
      suggest: `Suggest a clear, ambitious, and inspiring objective for the quarter. It should be qualitative and motivating. Context: ${context || 'Technology company focused on business planning solutions'}`,
      improve: `Improve this objective to make it more clear, ambitious, and inspiring: "${content}". Ensure it's qualitative and time-bound.`,
      critique: `Critique this objective: "${content}". Is it ambitious enough? Is it clear and inspiring? Does it align with best OKR practices?`
    },
    keyResult: {
      suggest: `Suggest 3-4 specific, measurable key results for this objective: "${context}". Each should be quantifiable with clear metrics and targets.`,
      improve: `Improve these key results to be more specific and measurable: "${content}". Ensure each has clear metrics and ambitious targets.`,
      critique: `Critique these key results: "${content}". Are they measurable? Are the targets ambitious but achievable? Do they truly indicate success of the objective?`
    }
  };

  const prompt = prompts[type]?.[action];
  if (!prompt) throw new Error('Invalid OKR parameters');

  const response = await callOpenAI(prompt, 200);
  return response;
}

// Business Canvas AI functions
export async function improveCanvasBlock(blockType, blockTitle, currentItems = [], action = 'suggest') {
  const systemPrompt = 'You are a business model canvas expert helping to build comprehensive business models.';
  
  let userPrompt = '';
  
  const blockContext = {
    key_partners: 'Key Partners are the network of suppliers and partners that make the business model work.',
    key_activities: 'Key Activities are the most important actions a company must take to operate successfully.',
    key_resources: 'Key Resources are the most important assets required to make a business model work.',
    value_propositions: 'Value Propositions are the bundle of products and services that create value for a specific Customer Segment.',
    customer_relationships: 'Customer Relationships describe the types of relationships a company establishes with specific Customer Segments.',
    channels: 'Channels describe how a company communicates with and reaches its Customer Segments to deliver a Value Proposition.',
    customer_segments: 'Customer Segments define the different groups of people or organizations an enterprise aims to reach and serve.',
    cost_structure: 'Cost Structure describes all costs incurred to operate a business model.',
    revenue_streams: 'Revenue Streams represent the cash a company generates from each Customer Segment.'
  };
  
  if (action === 'suggest') {
    userPrompt = `For the ${blockTitle} section of a Business Model Canvas: ${blockContext[blockType]}
    
    Current items: ${currentItems.length > 0 ? currentItems.join(', ') : 'None'}
    
    Suggest 3 relevant items for this section. Return as a JSON array of strings, each item should be concise (1-2 lines).
    Format: ["item1", "item2", "item3"]`;
  }
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    const response = await callOpenAI(messages);
    // Try to parse as JSON array
    try {
      return JSON.parse(response);
    } catch {
      // If not JSON, split by newlines and return as array
      return response.split('\n').filter(item => item.trim().length > 0);
    }
  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}
