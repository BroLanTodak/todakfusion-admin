# Todak Fusion Setup Instructions

## 🚀 Quick Setup

### 1. Environment Variables
Create a `.env` file in the root directory with the following content:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://dvicxhoozipvjndxxkbq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aWN4aG9vemlwdmpuZHh4a2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkwMDgsImV4cCI6MjA3MTI0NTAwOH0.XnE_nJwzwIIaMNlA5b6LbfJh1kYdJ8nDg1OhUs-lKiM

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application
```bash
npm run dev
```

## 📱 Features Implemented

### Core Modules:
1. **Vision & Mission** - Create and manage company vision/mission with AI assistance
2. **Business Canvas** - 9-block business model canvas
3. **OKR Management** - Objectives and Key Results tracking
4. **SWOT Analysis** - Strengths, Weaknesses, Opportunities, Threats

### AI Features:
- **AI Assistant Button** - Available on Vision/Mission page to:
  - Suggest new content
  - Improve existing content
  - Critique and provide feedback
  
- **Todak AI Chatbot** - Floating chat assistant (bottom right) that can:
  - Answer questions about business planning
  - Help create content
  - Provide guidance on all modules

### Database Structure:
All tables have been created in Supabase:
- `divisions` - Company divisions
- `visions_missions` - Vision and mission statements with versioning
- `canvas_blocks` - Business model canvas blocks
- `objectives` & `key_results` - OKR management
- `smart_objectives` - SMART goals
- `swot_items` - SWOT analysis items
- `ai_interactions` - Track AI usage
- `chat_conversations` & `chat_messages` - Chatbot history
- `activity_logs` - Audit trail

### Mobile Responsive:
- All pages are mobile-friendly
- Responsive grid layouts
- Touch-friendly interfaces
- Collapsible navigation on mobile

## 🔧 Important Notes:

1. **First Time Setup**: 
   - Create a user account using the Sign Up link on login page
   - The system will automatically create your profile

2. **Divisions**: 
   - 4 default divisions created: Technology, Marketing, Operations, Finance
   - You can modify these in the database if needed

3. **AI Features**:
   - Make sure your OpenAI API key is valid
   - AI features require internet connection
   - Each AI call uses tokens from your OpenAI account

4. **Data Persistence**:
   - All data is saved to Supabase
   - Changes are saved when you click Save/Add buttons
   - Version history is maintained for vision/mission

## 🎯 How to Use:

1. **Start with Vision & Mission** - Define your company's purpose
2. **Create Business Canvas** - Map out your business model
3. **Set OKRs** - Define quarterly objectives and measurable results
4. **Do SWOT Analysis** - Analyze your strategic position
5. **Use AI Assistant** - Get help at any step

## 🛠️ Troubleshooting:

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` file is created correctly
3. Ensure Supabase project is active
4. Check OpenAI API key is valid

## 📞 Support:

For any issues or questions, please check:
- Supabase Dashboard: https://supabase.com/dashboard
- OpenAI API Usage: https://platform.openai.com/usage

---

**Happy Planning with Todak Fusion! 🚀**
