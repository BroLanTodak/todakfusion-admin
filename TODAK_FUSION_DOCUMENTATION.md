# Dokumentasi Lengkap Sistem Todak Fusion

## Kandungan

1. [Pengenalan Sistem](#pengenalan-sistem)
2. [Teknologi Stack](#teknologi-stack)
3. [Struktur Database](#struktur-database)
4. [Implementasi AI](#implementasi-ai)
5. [Arsitektur Aplikasi](#arsitektur-aplikasi)
6. [Modul-Modul Sistem](#modul-modul-sistem)
7. [Cara Setup & Deploy](#cara-setup--deploy)
8. [API & Integration](#api--integration)
9. [Security & Permissions](#security--permissions)
10. [Future Enhancements](#future-enhancements)

---

## Pengenalan Sistem

**Todak Fusion** adalah sistem perancangan perniagaan yang komprehensif dengan integrasi AI. Sistem ini direka untuk membantu syarikat merancang, mengurus dan memantau strategi perniagaan mereka dengan lebih berkesan.

### Ciri-ciri Utama:
- 🎯 **Vision & Mission Management** - Urus pernyataan visi dan misi dengan versioning
- 📊 **Business Model Canvas** - Visualisasi model perniagaan 9-blok
- 🎯 **OKR Management** - Objectives & Key Results tracking
- 📈 **SWOT Analysis** - Analisis Strengths, Weaknesses, Opportunities, Threats
- 🤖 **AI Integration** - AI assistant untuk cadangan dan analisis
- 💬 **Smart Chatbot** - Chatbot dengan memory dan keupayaan modify database
- 🏢 **Multi-Division Support** - Sokongan untuk berbilang bahagian dalam syarikat
- 📱 **Mobile Responsive** - Berfungsi dengan baik di semua devices

---

## Teknologi Stack

### Frontend
```javascript
{
  "framework": "React 18.3.1",
  "buildTool": "Vite 7.0.6",
  "routing": "React Router DOM 7.0.3",
  "styling": "CSS Modules",
  "icons": "Lucide React",
  "httpClient": "Native Fetch API"
}
```

### Backend
```javascript
{
  "platform": "Supabase (Backend-as-a-Service)",
  "database": "PostgreSQL",
  "authentication": "Supabase Auth",
  "realtimeUpdates": "Supabase Realtime",
  "storage": "Supabase Storage",
  "rowLevelSecurity": "Disabled (untuk simplicity)"
}
```

### AI Integration
```javascript
{
  "provider": "OpenAI",
  "model": "GPT-3.5-turbo",
  "features": [
    "Content generation",
    "Content improvement",
    "Content critique",
    "Contextual chatbot",
    "Database modifications"
  ]
}
```

---

## Struktur Database

### 1. **profiles** - Maklumat pengguna
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  department TEXT,
  preferences JSONB DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  division_id UUID REFERENCES divisions(id)
);
```

### 2. **divisions** - Bahagian dalam syarikat
```sql
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES divisions(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **visions_missions** - Visi & Misi dengan versioning
```sql
CREATE TABLE visions_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('vision', 'mission')),
  content TEXT NOT NULL,
  scope TEXT DEFAULT 'company',
  division_id UUID REFERENCES divisions(id),
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  ai_enhanced BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  parent_id UUID REFERENCES visions_missions(id),
  change_reason TEXT
);

-- Unique constraint untuk ensure hanya satu current version per type
CREATE UNIQUE INDEX idx_current_vision_mission 
ON visions_missions(type, division_id) 
WHERE is_current = true;
```

### 4. **canvas_blocks** - Business Model Canvas blocks
```sql
CREATE TABLE canvas_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER,
  division_id UUID REFERENCES divisions(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block types: key_partners, key_activities, key_resources, 
-- value_propositions, customer_relationships, channels, 
-- customer_segments, cost_structure, revenue_streams
```

### 5. **objectives** - OKR Objectives
```sql
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0,
  division_id UUID REFERENCES divisions(id),
  parent_objective_id UUID REFERENCES objectives(id),
  owner_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  ai_generated BOOLEAN DEFAULT false
);
```

### 6. **key_results** - Measurable results untuk objectives
```sql
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'on_track',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. **smart_objectives** - SMART goals
```sql
CREATE TABLE smart_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  specific TEXT NOT NULL,
  measurable TEXT NOT NULL,
  achievable TEXT NOT NULL,
  relevant TEXT NOT NULL,
  time_bound TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0,
  division_id UUID REFERENCES divisions(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE
);
```

### 8. **swot_items** - SWOT analysis items
```sql
CREATE TABLE swot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('strength', 'weakness', 'opportunity', 'threat')),
  content TEXT NOT NULL,
  impact_level TEXT DEFAULT 'medium',
  division_id UUID REFERENCES divisions(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ai_generated BOOLEAN DEFAULT false
);
```

### 9. **ai_interactions** - Track AI usage
```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  interaction_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. **chat_conversations** - Chat sessions
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. **chat_messages** - Individual chat messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 12. **activity_logs** - Audit trail
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementasi AI

### 1. **OpenAI Integration Setup**

```javascript
// src/lib/openai.js
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(messages, options = {}) {
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
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 2. **AI Features Implementation**

#### a) Content Suggestion
```javascript
export async function suggestVisionMission(type, companyInfo = '') {
  const messages = [
    {
      role: 'system',
      content: 'You are a business strategy expert helping to create compelling vision and mission statements.'
    },
    {
      role: 'user',
      content: `Suggest a ${type} statement for a company. ${companyInfo ? `Company info: ${companyInfo}` : ''}`
    }
  ];
  return await callOpenAI(messages);
}
```

#### b) Content Improvement
```javascript
export async function improveVisionMission(type, currentContent) {
  const messages = [
    {
      role: 'system',
      content: 'You are a business communication expert focused on creating clear, inspiring, and actionable statements.'
    },
    {
      role: 'user',
      content: `Improve this ${type}: "${currentContent}". Make it more compelling, clear, and actionable.`
    }
  ];
  return await callOpenAI(messages);
}
```

#### c) Content Critique
```javascript
export async function critiqueVisionMission(type, content) {
  const messages = [
    {
      role: 'system',
      content: 'You are a critical business analyst who provides honest, constructive feedback.'
    },
    {
      role: 'user',
      content: `Critique this ${type}: "${content}". Identify weaknesses and suggest improvements.`
    }
  ];
  return await callOpenAI(messages);
}
```

### 3. **AI Chatbot dengan Context & Memory**

```javascript
// Context-aware chat
export async function chatWithAI(userMessage, context = {}) {
  let systemPrompt = `You are Todak AI, a helpful business planning assistant for Todak Fusion.`;
  
  // Add page-specific context
  if (context.currentPage === '/vision-mission' && context.pageData) {
    systemPrompt += `\n\nCurrent Vision & Mission data:`;
    if (context.pageData.vision) {
      systemPrompt += `\nVision: "${context.pageData.vision}"`;
    }
    if (context.pageData.mission) {
      systemPrompt += `\nMission: "${context.pageData.mission}"`;
    }
  }
  
  // Add database action instructions
  systemPrompt += `\n\nIMPORTANT: You have the ability to modify database content when the user asks. When you want to perform an action, include it in your response using these EXACT formats:
  
  - To update vision: "I'll update the vision to: \"[new vision text]\""
  - To update mission: "I'll update the mission to: \"[new mission text]\""
  - To create objective: "I'll create a new objective: \"[objective title]\""
  - To add SWOT item: "I'll add to [strength/weakness/opportunity/threat]: \"[item text]\""
  
  Always explain what you're doing and why. Ask for confirmation for major changes.`;
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  
  return await callOpenAI(messages, { max_tokens: 800 });
}
```

### 4. **AI Database Actions**

```javascript
// src/lib/aiDatabaseActions.js
const AI_ACTIONS = {
  UPDATE_VISION: 'update_vision',
  UPDATE_MISSION: 'update_mission',
  CREATE_OBJECTIVE: 'create_objective',
  ADD_SWOT_ITEM: 'add_swot_item'
};

const SAFETY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const ACTION_SAFETY = {
  [AI_ACTIONS.UPDATE_VISION]: SAFETY_LEVELS.HIGH,
  [AI_ACTIONS.UPDATE_MISSION]: SAFETY_LEVELS.HIGH,
  [AI_ACTIONS.CREATE_OBJECTIVE]: SAFETY_LEVELS.MEDIUM,
  [AI_ACTIONS.ADD_SWOT_ITEM]: SAFETY_LEVELS.LOW
};

// Parse AI intent
export function parseAIIntent(aiResponse) {
  const actionPatterns = {
    [AI_ACTIONS.UPDATE_VISION]: /(?:update|change|modify|set)\s+(?:the\s+)?vision\s+to:?\s*"([^"]+)"/i,
    [AI_ACTIONS.UPDATE_MISSION]: /(?:update|change|modify|set)\s+(?:the\s+)?mission\s+to:?\s*"([^"]+)"/i,
    [AI_ACTIONS.CREATE_OBJECTIVE]: /(?:create|add|new)\s+objective:?\s*"([^"]+)"/i,
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

// Execute with safety levels
export async function executeAIAction(action, params, userId, needsConfirmation = true) {
  // HIGH safety actions always need confirmation
  if (ACTION_SAFETY[action] === SAFETY_LEVELS.HIGH && needsConfirmation) {
    return {
      requiresConfirmation: true,
      action,
      params,
      message: 'This action requires your confirmation'
    };
  }
  
  // Execute database operation
  switch (action) {
    case AI_ACTIONS.UPDATE_VISION:
      return await updateVisionMission('vision', params.content, userId);
    case AI_ACTIONS.UPDATE_MISSION:
      return await updateVisionMission('mission', params.content, userId);
    case AI_ACTIONS.CREATE_OBJECTIVE:
      return await createObjective(params, userId);
    case AI_ACTIONS.ADD_SWOT_ITEM:
      return await addSwotItem(params, userId);
    default:
      return { success: false, error: 'Unknown action' };
  }
}
```

### 5. **Chatbot Memory Implementation**

```javascript
// Load conversation history
const loadOrCreateConversation = async () => {
  if (!user) return;
  
  setLoadingHistory(true);
  try {
    // Get active conversation
    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);
      
    let activeConversation;
    
    if (conversations?.length > 0) {
      activeConversation = conversations[0];
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: `Chat ${new Date().toLocaleDateString()}`,
          status: 'active',
          metadata: {
            startedAt: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        })
        .select()
        .single();
        
      activeConversation = newConv;
    }
    
    setConversationId(activeConversation.id);
    
    // Load messages for this conversation
    await loadMessages(activeConversation.id);
  } catch (error) {
    console.error('Error loading conversation:', error);
  } finally {
    setLoadingHistory(false);
  }
};
```

---

## Arsitektur Aplikasi

### 1. **Folder Structure**
```
todakfusion/
├── src/
│   ├── components/           # Reusable components
│   │   ├── Layout/          # Main layout wrapper
│   │   ├── Login.jsx        # Authentication
│   │   ├── ProtectedRoute.jsx
│   │   ├── AIButton.jsx     # AI action buttons
│   │   └── AIChatbot.jsx    # Floating chatbot
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── ThemeContext.jsx # Dark/light theme
│   ├── lib/                 # Utilities & integrations
│   │   ├── supabase.js     # Supabase client
│   │   ├── openai.js       # OpenAI functions
│   │   └── aiDatabaseActions.js
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── VisionMission.jsx
│   │   ├── BusinessCanvas.jsx
│   │   ├── OKR.jsx
│   │   └── SWOT.jsx
│   ├── App.jsx            # Root component & routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── .env                 # Environment variables
├── package.json         # Dependencies
└── vite.config.js      # Build configuration
```

### 2. **Component Architecture**

```javascript
// Main App Structure
<App>
  <AuthProvider>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vision-mission" element={<VisionMission />} />
              <Route path="/canvas" element={<BusinessCanvas />} />
              <Route path="/okr" element={<OKR />} />
              <Route path="/swot" element={<SWOT />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  </AuthProvider>
</App>
```

### 3. **State Management**

```javascript
// Using React Context for global state
const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: false
});

// Component state management with hooks
const [vision, setVision] = useState('');
const [mission, setMission] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 4. **Data Flow**

```
User Action → Component State → Supabase API → PostgreSQL
     ↓              ↓                ↓              ↓
   UI Event    State Update    HTTP Request    Database
     ↓              ↓                ↓              ↓
   Handler     Re-render       Response       Update/Insert
     ↓              ↓                ↓              ↓
   AI Call     Update UI       Return Data    Return Result
```

---

## Modul-Modul Sistem

### 1. **Vision & Mission Module**

**Features:**
- Create/Edit vision and mission statements
- Version control (track all changes)
- AI assistance (suggest, improve, critique)
- Scope support (company-wide or division-specific)

**Implementation:**
```javascript
// Save with versioning
const saveVisionMission = async (type, content) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  
  // Archive current version
  await supabase
    .from('visions_missions')
    .update({ is_current: false })
    .eq('type', type)
    .eq('is_current', true);
    
  // Create new version
  const { data, error } = await supabase
    .from('visions_missions')
    .insert({
      type,
      content,
      is_current: true,
      created_by: session.user.id,
      ai_enhanced: false
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

### 2. **Business Canvas Module**

**Features:**
- 9-block canvas visualization
- Drag-and-drop interface (planned)
- Export to PDF (planned)
- Collaborative editing

**Blocks:**
1. Key Partners
2. Key Activities  
3. Key Resources
4. Value Propositions
5. Customer Relationships
6. Channels
7. Customer Segments
8. Cost Structure
9. Revenue Streams

### 3. **OKR Module**

**Features:**
- Quarterly objectives setting
- Key results with measurable targets
- Progress tracking
- Cascading OKRs (parent-child relationships)
- Status indicators (on-track, at-risk, behind)

**Implementation:**
```javascript
// Calculate objective progress
const calculateProgress = (keyResults) => {
  if (!keyResults || keyResults.length === 0) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => {
    const progress = (kr.current_value / kr.target_value) * 100;
    return sum + Math.min(progress, 100);
  }, 0);
  
  return totalProgress / keyResults.length;
};

// Update objective progress
const updateObjectiveProgress = async (objectiveId) => {
  const { data: keyResults } = await supabase
    .from('key_results')
    .select('*')
    .eq('objective_id', objectiveId);
    
  const progress = calculateProgress(keyResults);
  
  await supabase
    .from('objectives')
    .update({ progress })
    .eq('id', objectiveId);
};
```

### 4. **SWOT Module**

**Features:**
- Categorized items (S/W/O/T)
- Impact level assessment
- AI-powered suggestions
- Visual matrix view

**Categories:**
- **Strengths**: Internal positive factors
- **Weaknesses**: Internal negative factors
- **Opportunities**: External positive factors
- **Threats**: External negative factors

---

## Cara Setup & Deploy

### 1. **Local Development Setup**

```bash
# Clone repository
git clone https://github.com/BroLanTodak/todakfusion-admin.git
cd todakfusion

# Create .env file
cat > .env << EOL
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-key
EOL

# Install dependencies
npm install

# Run development server
npm run dev
```

### 2. **Supabase Setup**

```sql
-- 1. Create profiles trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Run all table creation scripts
-- 3. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Insert default divisions
INSERT INTO divisions (name, description) VALUES
  ('Technology', 'Technology and IT division'),
  ('Marketing', 'Marketing and communications division'),
  ('Operations', 'Daily operations division'),
  ('Finance', 'Finance and accounting division');
```

### 3. **Production Deployment**

#### Option A: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Option B: Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables via Netlify UI
```

#### Option C: Self-hosted
```bash
# Build production
npm run build

# Serve with nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/todakfusion/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## API & Integration

### 1. **Supabase Client Setup**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### 2. **Authentication Flow**

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Sign out
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});
```

### 3. **Database Operations**

```javascript
// SELECT with filters
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .order('created_at', { ascending: false });

// INSERT single
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: value })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('table_name')
  .update({ column: newValue })
  .eq('id', id)
  .select();

// DELETE
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);

// Upsert (insert or update)
const { data, error } = await supabase
  .from('table_name')
  .upsert({ id, column: value })
  .select();
```

### 4. **Real-time Subscriptions**

```javascript
// Subscribe to changes
const subscription = supabase
  .channel('custom-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'objectives' },
    (payload) => {
      console.log('Change received!', payload);
      // Update local state
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

---

## Security & Permissions

### 1. **Row Level Security (RLS)**

Currently **DISABLED** for simplicity, but can be enabled:

```sql
-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. **API Security**

- **Supabase Anon Key**: Safe for client-side use (limited permissions)
- **Service Role Key**: Server-side only (full access - not used in this app)
- **OpenAI Key**: Should ideally be proxied through backend for production

### 3. **Best Practices**

```javascript
// Input validation
const validateInput = (input) => {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }
  if (input.length > 1000) {
    throw new Error('Input too long');
  }
  return input.trim();
};

// Error handling
try {
  const result = await someOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Log to monitoring service
  // Show user-friendly error
}

// Environment variables check
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing Supabase URL');
}
```

---

## Future Enhancements

### 1. **Planned Features**

- **Gantt Chart** untuk project planning
- **Financial Projections** module
- **Risk Management** matrix
- **Competitor Analysis** tools
- **Performance Dashboard** dengan charts
- **Email Notifications** untuk reminders
- **Export Reports** (PDF, Excel)
- **Mobile App** (React Native)
- **Multi-language Support**
- **Advanced Analytics** dengan ML

### 2. **AI Enhancements**

- **GPT-4 Integration** untuk better responses
- **Custom Fine-tuned Models** untuk business domain
- **Voice Assistant** integration
- **Automated Reports Generation**
- **Predictive Analytics**
- **Smart Recommendations** based on industry

### 3. **Technical Improvements**

```javascript
// Code splitting for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Performance optimization with memo
const MemoizedComponent = memo(Component);

// Error boundaries for better error handling
class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Progressive Web App
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 4. **Integration Possibilities**

- **Slack/Teams** notifications
- **Google Workspace** integration
- **Accounting Software** sync (QuickBooks, Xero)
- **CRM Integration** (Salesforce, HubSpot)
- **Project Management Tools** (Jira, Asana)
- **Calendar Integration** (Google Calendar, Outlook)

---

## Troubleshooting Guide

### Common Issues:

1. **404/406 Errors on Supabase**
   ```javascript
   // Solution: Check permissions
   GRANT ALL ON visions_missions TO anon, authenticated;
   
   // Or disable RLS
   ALTER TABLE visions_missions DISABLE ROW LEVEL SECURITY;
   ```

2. **AI Not Responding**
   ```javascript
   // Check API key
   console.log('API Key exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
   
   // Check quota at https://platform.openai.com/usage
   ```

3. **Data Not Saving - Foreign Key Error**
   ```sql
   -- Ensure user has profile
   INSERT INTO profiles (id, email) 
   SELECT id, email FROM auth.users 
   WHERE id NOT IN (SELECT id FROM profiles);
   ```

4. **Performance Issues**
   ```javascript
   // Implement pagination
   const { data, error } = await supabase
     .from('table')
     .select('*')
     .range(0, 9); // Get 10 items
   
   // Add indexes
   CREATE INDEX idx_created_at ON table_name(created_at);
   ```

---

## Kesimpulan

Todak Fusion adalah sistem perancangan perniagaan yang comprehensive dengan AI integration. Sistem ini direka untuk scalable, maintainable dan user-friendly. Dengan dokumentasi ini, developer boleh understand architecture, extend functionality, atau build similar systems.

### Key Takeaways:
- ✅ Modular architecture untuk easy expansion
- ✅ AI integration untuk enhance user experience  
- ✅ Comprehensive database design dengan versioning
- ✅ Security best practices implementation
- ✅ Mobile-first responsive design
- ✅ Real-time collaboration ready

### Contact & Support:
- GitHub: https://github.com/BroLanTodak/todakfusion-admin
- Email: lan@todak.com

---

**Dibina dengan ❤️ oleh Todak Fusion Team**
