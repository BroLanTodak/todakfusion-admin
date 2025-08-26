-- Create Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    head_of_division UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_divisions_is_active ON divisions(is_active);
CREATE INDEX IF NOT EXISTS idx_divisions_order ON divisions(order_position);

-- Enable RLS
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Divisions
CREATE POLICY "Authenticated users can view divisions" 
ON divisions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert divisions" 
ON divisions FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update divisions" 
ON divisions FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete divisions" 
ON divisions FOR DELETE 
TO authenticated 
USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_divisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for divisions table
CREATE TRIGGER update_divisions_updated_at
BEFORE UPDATE ON divisions
FOR EACH ROW
EXECUTE FUNCTION update_divisions_updated_at();
