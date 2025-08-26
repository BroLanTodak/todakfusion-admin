-- Core Values table
CREATE TABLE IF NOT EXISTS core_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💎',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Strategic Objectives table
CREATE TABLE IF NOT EXISTS strategic_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    timeframe TEXT CHECK (timeframe IN ('1_year', '3_years', '5_years')) DEFAULT '3_years',
    target_date DATE,
    progress INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')) DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Strategic Pillars table
CREATE TABLE IF NOT EXISTS strategic_pillars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3498db',
    icon TEXT DEFAULT '🏛️',
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Target Markets table
CREATE TABLE IF NOT EXISTS target_markets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_name TEXT NOT NULL,
    description TEXT,
    characteristics TEXT[],
    size_estimate TEXT,
    growth_rate TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Strategic Milestones table
CREATE TABLE IF NOT EXISTS strategic_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    objective_id UUID REFERENCES strategic_objectives(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')) DEFAULT 'pending',
    completion_date DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for all tables
ALTER TABLE core_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Core Values
CREATE POLICY "Authenticated users can view core values" 
ON core_values FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert core values" 
ON core_values FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update core values" 
ON core_values FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete core values" 
ON core_values FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Strategic Objectives
CREATE POLICY "Authenticated users can view strategic objectives" 
ON strategic_objectives FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert strategic objectives" 
ON strategic_objectives FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update strategic objectives" 
ON strategic_objectives FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete strategic objectives" 
ON strategic_objectives FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Strategic Pillars
CREATE POLICY "Authenticated users can view strategic pillars" 
ON strategic_pillars FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert strategic pillars" 
ON strategic_pillars FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update strategic pillars" 
ON strategic_pillars FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete strategic pillars" 
ON strategic_pillars FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Target Markets
CREATE POLICY "Authenticated users can view target markets" 
ON target_markets FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert target markets" 
ON target_markets FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update target markets" 
ON target_markets FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete target markets" 
ON target_markets FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Strategic Milestones
CREATE POLICY "Authenticated users can view strategic milestones" 
ON strategic_milestones FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert strategic milestones" 
ON strategic_milestones FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update strategic milestones" 
ON strategic_milestones FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete strategic milestones" 
ON strategic_milestones FOR DELETE 
TO authenticated 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS core_values_order_idx ON core_values(order_position);
CREATE INDEX IF NOT EXISTS strategic_objectives_status_idx ON strategic_objectives(status);
CREATE INDEX IF NOT EXISTS strategic_pillars_order_idx ON strategic_pillars(order_position);
CREATE INDEX IF NOT EXISTS target_markets_priority_idx ON target_markets(priority);
CREATE INDEX IF NOT EXISTS strategic_milestones_date_idx ON strategic_milestones(target_date);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_strategic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_core_values_updated_at
BEFORE UPDATE ON core_values
FOR EACH ROW
EXECUTE FUNCTION update_strategic_updated_at();

CREATE TRIGGER update_strategic_objectives_updated_at
BEFORE UPDATE ON strategic_objectives
FOR EACH ROW
EXECUTE FUNCTION update_strategic_updated_at();

CREATE TRIGGER update_strategic_pillars_updated_at
BEFORE UPDATE ON strategic_pillars
FOR EACH ROW
EXECUTE FUNCTION update_strategic_updated_at();

CREATE TRIGGER update_target_markets_updated_at
BEFORE UPDATE ON target_markets
FOR EACH ROW
EXECUTE FUNCTION update_strategic_updated_at();

CREATE TRIGGER update_strategic_milestones_updated_at
BEFORE UPDATE ON strategic_milestones
FOR EACH ROW
EXECUTE FUNCTION update_strategic_updated_at();
