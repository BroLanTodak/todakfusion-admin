# Todak Fusion Dashboard

A modern React dashboard built with Vite, featuring Supabase authentication, responsive design, and a beautiful black, white, and gold color theme.

## Features

- 🔐 **Authentication**: Secure login/logout with Supabase Auth
- 🛡️ **Protected Routes**: Automatic route protection for authenticated users
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🌓 **Dark/Light Mode**: Toggle between light and dark themes with persistence
- 👥 **User Management**: Full CRUD operations for user management
- 🎨 **Modern UI**: Clean interface with smooth transitions and animations
- 🏃 **Fast**: Built with Vite for lightning-fast development

## Tech Stack

- **React** - UI library
- **Vite** - Build tool
- **Supabase** - Backend and authentication
- **React Router** - Routing
- **CSS Modules** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd todak-fusion
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up your Supabase database:

Create a `profiles` table with the following schema:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

6. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Main layout with sidebar and header
│   ├── Login.jsx        # Authentication component
│   └── ProtectedRoute.jsx # Route protection wrapper
├── contexts/
│   ├── AuthContext.jsx  # Authentication state management
│   └── ThemeContext.jsx # Theme state management
├── lib/
│   └── supabase.js      # Supabase client configuration
├── pages/
│   ├── Dashboard.jsx    # Main dashboard page
│   └── Users.jsx        # User management page
├── App.jsx              # Main app component with routing
├── main.jsx             # App entry point
└── index.css            # Global styles and theme variables
```

## Features Details

### Authentication
- Email/password authentication
- Persistent sessions
- Automatic redirect on login/logout

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized for all screen sizes

### Theme System
- Light and dark mode support
- Persistent theme preference
- Smooth transitions between themes
- CSS variables for easy customization

### User Management
- View all users in a responsive table
- Edit user information
- Delete users with confirmation
- Real-time updates

## Color Theme

The application uses a sophisticated black, white, and gold color scheme:
- **Primary**: Gold (#FFD700)
- **Background**: White/Black (theme dependent)
- **Text**: Black/White (theme dependent)
- **Accents**: Gold for highlights and active states

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

Feel free to submit issues and pull requests.

## License

MIT