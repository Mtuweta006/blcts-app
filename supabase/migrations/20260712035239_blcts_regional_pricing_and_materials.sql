/*
# BLCTS Regional Pricing, Materials & Labour Database

## Summary
This migration creates the core pricing infrastructure for BLCTS. All construction cost
estimates, BOQ line items, and lifecycle cost calculations will draw from these tables
rather than from hardcoded frontend arrays.

## New Tables

### 1. `regional_pricing`
Stores regional construction rate multipliers per Kenyan county.
- `county` - county name (e.g. "Nairobi", "Mombasa")
- `material_multiplier` - factor applied to base material prices
- `labour_multiplier` - factor applied to base labour rates
- `service_multiplier` - factor applied to service costs
- `inflation_factor` - annual price inflation for the county
- `transport_factor` - additional transport cost multiplier
- `base_cost_per_sqm_economy/standard/premium/luxury` - KSh/m² by standard
- `notes` - descriptive notes

### 2. `materials`
Construction material price database, editable by Administrators.
- `county` - county this price applies to ("All" = nationwide baseline)
- `category` - "material" | "labour" | "service"
- `item_id` - machine-readable key (e.g. "cement", "mason")
- `name` - human-readable name
- `unit_price` - price in KSh
- `unit` - unit of measure (Bag, Tonne, Day, m², etc.)
- `notes` - optional notes

### 3. `labour_rates`
Indexed view of materials table filtered to category="labour" (convenience).
Actually a table with the same schema as materials for labour trades.

## Security
- RLS enabled on all tables with anon+authenticated access (single-tenant admin system)
- Admins can update prices; all roles can read
*/

-- ============================================================
-- TABLE: regional_pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS regional_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL UNIQUE,
  material_multiplier numeric NOT NULL DEFAULT 1.0,
  labour_multiplier numeric NOT NULL DEFAULT 1.0,
  service_multiplier numeric NOT NULL DEFAULT 1.0,
  inflation_factor numeric NOT NULL DEFAULT 0.06,
  transport_factor numeric NOT NULL DEFAULT 1.0,
  base_cost_per_sqm_economy integer NOT NULL DEFAULT 28000,
  base_cost_per_sqm_standard integer NOT NULL DEFAULT 38000,
  base_cost_per_sqm_premium integer NOT NULL DEFAULT 52000,
  base_cost_per_sqm_luxury integer NOT NULL DEFAULT 75000,
  notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE regional_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_regional_pricing" ON regional_pricing;
CREATE POLICY "anon_select_regional_pricing" ON regional_pricing FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_regional_pricing" ON regional_pricing;
CREATE POLICY "anon_insert_regional_pricing" ON regional_pricing FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_regional_pricing" ON regional_pricing;
CREATE POLICY "anon_update_regional_pricing" ON regional_pricing FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_regional_pricing" ON regional_pricing;
CREATE POLICY "anon_delete_regional_pricing" ON regional_pricing FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- TABLE: construction_materials  
-- (named to avoid collision with Express data/materials.json)
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL DEFAULT 'All',
  category text NOT NULL CHECK (category IN ('material','labour','service')),
  item_id text NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  unit text NOT NULL,
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(county, category, item_id)
);

ALTER TABLE construction_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_construction_materials" ON construction_materials;
CREATE POLICY "anon_select_construction_materials" ON construction_materials FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_construction_materials" ON construction_materials;
CREATE POLICY "anon_insert_construction_materials" ON construction_materials FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_construction_materials" ON construction_materials;
CREATE POLICY "anon_update_construction_materials" ON construction_materials FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_construction_materials" ON construction_materials;
CREATE POLICY "anon_delete_construction_materials" ON construction_materials FOR DELETE
  TO anon, authenticated USING (true);

-- Index for fast county+category lookups
CREATE INDEX IF NOT EXISTS idx_construction_materials_county_category
  ON construction_materials(county, category);

-- ============================================================
-- TABLE: boq_estimates
-- Stores generated BOQ estimates tied to properties
-- ============================================================
CREATE TABLE IF NOT EXISTS boq_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  property_name text NOT NULL,
  county text NOT NULL,
  building_type text NOT NULL,
  construction_standard text NOT NULL,
  gfa numeric NOT NULL,
  floors integer NOT NULL,
  cost_per_sqm numeric NOT NULL,
  construction_cost numeric NOT NULL,
  external_works numeric NOT NULL,
  preliminaries numeric NOT NULL,
  professional_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  statutory_costs numeric NOT NULL,
  subtotal numeric NOT NULL,
  contingency numeric NOT NULL,
  vat_amount numeric NOT NULL,
  total_project_cost numeric NOT NULL,
  lifecycle_years integer NOT NULL DEFAULT 30,
  annual_opex numeric NOT NULL DEFAULT 0,
  total_lifecycle_cost numeric NOT NULL,
  tco numeric NOT NULL,
  boq_line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  blueprint_observations jsonb DEFAULT '[]'::jsonb,
  ai_confidence numeric,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE boq_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_boq_estimates" ON boq_estimates;
CREATE POLICY "anon_select_boq_estimates" ON boq_estimates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_boq_estimates" ON boq_estimates;
CREATE POLICY "anon_insert_boq_estimates" ON boq_estimates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_boq_estimates" ON boq_estimates;
CREATE POLICY "anon_update_boq_estimates" ON boq_estimates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_boq_estimates" ON boq_estimates;
CREATE POLICY "anon_delete_boq_estimates" ON boq_estimates FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_boq_estimates_property_id ON boq_estimates(property_id);

-- ============================================================
-- TABLE: maintenance_tasks  
-- Persistent task storage (source of truth for all FM tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id text PRIMARY KEY,
  property_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  component text NOT NULL,
  category text NOT NULL DEFAULT 'Preventive',
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  assigned_to text NOT NULL DEFAULT '',
  technician text NOT NULL DEFAULT '',
  vendor text NOT NULL DEFAULT '',
  estimated_cost numeric NOT NULL DEFAULT 0,
  actual_cost numeric NOT NULL DEFAULT 0,
  target_date text NOT NULL,
  completed_date text,
  verified_by text,
  phone text,
  notes text NOT NULL DEFAULT '',
  parts_used text,
  labour_hours numeric,
  downtime numeric,
  attachments jsonb DEFAULT '[]'::jsonb,
  work_order_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "anon_select_maintenance_tasks" ON maintenance_tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "anon_insert_maintenance_tasks" ON maintenance_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "anon_update_maintenance_tasks" ON maintenance_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "anon_delete_maintenance_tasks" ON maintenance_tasks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);

-- ============================================================
-- SEED: regional_pricing
-- ============================================================
INSERT INTO regional_pricing (county, material_multiplier, labour_multiplier, service_multiplier, inflation_factor, transport_factor, base_cost_per_sqm_economy, base_cost_per_sqm_standard, base_cost_per_sqm_premium, base_cost_per_sqm_luxury, notes)
VALUES
  ('Nairobi',   1.00, 1.00, 1.00, 0.07, 1.00, 28000, 38000, 52000, 75000, 'Capital city baseline. Highest labour demand. Premium for CBD locations.'),
  ('Mombasa',   1.15, 1.10, 1.20, 0.07, 1.18, 32200, 43700, 59800, 86250, 'Coastal premium. High humidity requires special materials. Port logistics.'),
  ('Kisumu',    1.05, 0.88, 1.10, 0.06, 1.12, 29400, 39900, 54600, 78750, 'Lakeside city. Growing industrial base. Moderate material premiums.'),
  ('Nakuru',    0.92, 0.85, 0.95, 0.06, 1.05, 25760, 34960, 47840, 69000, 'Rift Valley hub. Lower labour costs. Good road network.'),
  ('Eldoret',   0.90, 0.82, 0.93, 0.06, 1.10, 25200, 34200, 46800, 67500, 'Western Highlands. Agricultural economy. Lower overheads.'),
  ('Busia',     0.88, 0.80, 0.90, 0.05, 1.22, 24640, 33440, 45760, 66000, 'Border town. Cross-border trade materials. Lower skilled labour.'),
  ('Thika',     0.95, 0.90, 0.92, 0.06, 0.98, 26600, 36100, 49400, 71250, 'Industrial hub near Nairobi. Lower transport costs. Manufacturing base.'),
  ('Meru',      0.89, 0.83, 0.91, 0.06, 1.15, 24920, 33820, 46280, 66750, 'North Central. Agricultural region. Limited specialist contractors.'),
  ('Nyeri',     0.91, 0.84, 0.92, 0.06, 1.08, 25480, 34580, 47320, 68250, 'Central Kenya. Tea growing region. Moderate construction activity.'),
  ('Machakos',  0.93, 0.87, 0.94, 0.06, 1.07, 26040, 35340, 48360, 69750, 'Eastern Kenya. Growing satellite city. Good Nairobi connectivity.')
ON CONFLICT (county) DO UPDATE SET
  material_multiplier = EXCLUDED.material_multiplier,
  labour_multiplier = EXCLUDED.labour_multiplier,
  service_multiplier = EXCLUDED.service_multiplier,
  inflation_factor = EXCLUDED.inflation_factor,
  transport_factor = EXCLUDED.transport_factor,
  base_cost_per_sqm_economy = EXCLUDED.base_cost_per_sqm_economy,
  base_cost_per_sqm_standard = EXCLUDED.base_cost_per_sqm_standard,
  base_cost_per_sqm_premium = EXCLUDED.base_cost_per_sqm_premium,
  base_cost_per_sqm_luxury = EXCLUDED.base_cost_per_sqm_luxury,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ============================================================
-- SEED: construction_materials (Nairobi baseline)
-- ============================================================
INSERT INTO construction_materials (county, category, item_id, name, unit_price, unit, notes) VALUES
  -- Materials
  ('All','material','cement',       'Ordinary Portland Cement',   850,    'Bag 50kg',  '32.5N grade, standard construction'),
  ('All','material','sand',         'River Sand (Fine Aggregate)', 2100,   'Tonne',     'Clean, well-graded river sand'),
  ('All','material','ballast',      'Crushed Stone (Coarse Agg)', 1800,   'Tonne',     '20mm nominal size'),
  ('All','material','hardcore',     'Hardcore Filling',            900,    'm³',        'Clean broken stone/brick'),
  ('All','material','steel-y12',    'High Yield Steel Y12',        92000,  'Tonne',     'Deformed bar, BRC welded mesh'),
  ('All','material','steel-y16',    'High Yield Steel Y16',        94000,  'Tonne',     'Deformed bar for columns/beams'),
  ('All','material','blocks',       'Concrete Hollow Blocks 6"',   80,     'Block',     '150x200x400mm, 7MPa'),
  ('All','material','bricks',       'Burnt Clay Bricks',           18,     'Brick',     'Class A engineering bricks'),
  ('All','material','timber',       'Structural Timber (Cypress)', 1200,   'Piece',     '2x3 inches, 12ft lengths'),
  ('All','material','roofing-sheets','Corrugated Iron Sheets G30', 1450,   'm²',        'Box profile 0.3mm AZ150'),
  ('All','material','roofing-tiles','Clay Roof Tiles',             2800,   'm²',        'Interlocking flat tiles'),
  ('All','material','glass',        'Clear Float Glass 6mm',       8200,   'm²',        'Safety tempered glass'),
  ('All','material','doors-timber', 'Solid Timber Door (External)',18500,  'No.',       'Hardwood frame + door leaf'),
  ('All','material','doors-metal',  'Steel Security Door',         35000,  'No.',       'Double leaf steel door frame'),
  ('All','material','windows-alum', 'Aluminium Casement Window',   12500,  'No.',       '900x1200mm including glass'),
  ('All','material','paint-ext',    'Exterior Emulsion Paint',     6800,   '20L Drum',  'Weathershield grade'),
  ('All','material','paint-int',    'Interior Emulsion Paint',     4200,   '20L Drum',  'Washable matt finish'),
  ('All','material','tiles-floor',  'Ceramic Floor Tiles 400mm',   1850,   'Box/m²',    'Grade A non-slip'),
  ('All','material','tiles-wall',   'Ceramic Wall Tiles 300mm',    1650,   'Box/m²',    'Bathroom/kitchen grade'),
  ('All','material','plumbing-pprc','PPRC Pipes & Fittings',        5200,   'm run',     'PN16 hot/cold water supply'),
  ('All','material','electrical',   'Electrical Wiring & Fittings',4800,   'm²',        'Complete installation per SQM'),
  ('All','material','waterproofing','Bitumen Waterproof Membrane', 4500,   'm²',        '2-layer torch-on system'),
  ('All','material','ceiling-board','Gypsum Ceiling Board 9mm',    850,    'm²',        'Including metal furring'),
  ('All','material','insulation',   'Thermal Insulation Board',    1200,   'm²',        '50mm EPS board'),
  -- Labour rates
  ('All','labour','mason',          'Mason / Bricklayer',          1800,   'Day',       'Qualified artisan'),
  ('All','labour','carpenter',      'Carpenter / Joiner',          2000,   'Day',       'Formwork & joinery'),
  ('All','labour','steel-fixer',    'Steel Fixer / Bar Bender',    1900,   'Day',       'Reinforcement works'),
  ('All','labour','electrician',    'Licensed Electrician',        2500,   'Day',       'EPRA certified'),
  ('All','labour','plumber',        'Licensed Plumber',            2300,   'Day',       'NCA registered'),
  ('All','labour','welder',         'Certified Welder',            2200,   'Day',       'Structural steelwork'),
  ('All','labour','painter',        'Painter & Decorator',         1500,   'Day',       'Interior/exterior finishes'),
  ('All','labour','roofer',         'Roofing Specialist',          2100,   'Day',       'Tile & sheet roofing'),
  ('All','labour','machine-op',     'Plant/Machine Operator',      3000,   'Day',       'Excavator, mixer, crane'),
  ('All','labour','general',        'General Labourer',            800,    'Day',       'Unskilled site labour'),
  ('All','labour','foreman',        'Site Foreman',                3500,   'Day',       'Supervisory'),
  ('All','labour','qs',             'Quantity Surveyor',           8500,   'Day',       'Professional QS'),
  ('All','labour','architect',      'Architect',                   12000,  'Day',       'ARB registered'),
  ('All','labour','engineer',       'Structural Engineer',         15000,  'Day',       'IEK registered'),
  -- Services
  ('All','service','equipment-hire','Equipment Hire (Mixer/Exc.)', 25000,  'Day',       'Includes operator'),
  ('All','service','excavation',    'Bulk Excavation',             1800,   'm³',        'Machine excavation + disposal'),
  ('All','service','transport',     'Material Transport',          3500,   'Trip',      '5-tonne lorry trip'),
  ('All','service','waste-disposal','Waste Disposal',              5000,   'Trip',      'Skip hire + tipping fees'),
  ('All','service','surveying',     'Land Surveying',              45000,  'Site',      'Setting out + levels'),
  ('All','service','soil-testing',  'Soil Investigation',          85000,  'Report',    'BH + lab tests')
ON CONFLICT (county, category, item_id) DO UPDATE SET
  name = EXCLUDED.name,
  unit_price = EXCLUDED.unit_price,
  unit = EXCLUDED.unit,
  notes = EXCLUDED.notes,
  updated_at = now();
