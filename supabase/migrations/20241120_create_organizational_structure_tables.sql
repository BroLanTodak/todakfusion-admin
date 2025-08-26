-- Add is_active and order_position columns to existing divisions table
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE divisions ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    head_of_department UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(division_id, code)
);

-- Units Table (Team level)
CREATE TABLE IF NOT EXISTS units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    unit_lead UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(department_id, code)
);

-- Sub-Units Table (Squad/Cell/Task Force level)
CREATE TABLE IF NOT EXISTS sub_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT CHECK (type IN ('squad', 'cell', 'task_force', 'sub_unit')) DEFAULT 'sub_unit',
    description TEXT,
    sub_unit_lead UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(unit_id, code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_divisions_order ON divisions(order_position);
CREATE INDEX IF NOT EXISTS idx_departments_div ON departments(division_id);
CREATE INDEX IF NOT EXISTS idx_units_dept ON units(department_id);
CREATE INDEX IF NOT EXISTS idx_sub_units_unit ON sub_units(unit_id);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Departments
CREATE POLICY "Authenticated users can view departments" 
ON departments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert departments" 
ON departments FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments" 
ON departments FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete departments" 
ON departments FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Units
CREATE POLICY "Authenticated users can view units" 
ON units FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert units" 
ON units FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update units" 
ON units FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete units" 
ON units FOR DELETE 
TO authenticated 
USING (true);

-- RLS Policies for Sub-Units
CREATE POLICY "Authenticated users can view sub_units" 
ON sub_units FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert sub_units" 
ON sub_units FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sub_units" 
ON sub_units FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete sub_units" 
ON sub_units FOR DELETE 
TO authenticated 
USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_org_structure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_divisions_updated_at
BEFORE UPDATE ON divisions
FOR EACH ROW
EXECUTE FUNCTION update_org_structure_updated_at();

CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_org_structure_updated_at();

CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION update_org_structure_updated_at();

CREATE TRIGGER update_sub_units_updated_at
BEFORE UPDATE ON sub_units
FOR EACH ROW
EXECUTE FUNCTION update_org_structure_updated_at();
