import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Secure file-based database paths
const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const MATERIALS_FILE = path.join(DATA_DIR, "materials.json");
const COST_ENTRIES_FILE = path.join(DATA_DIR, "cost_entries.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultProjects = [
    {
      id: "prop-1",
      name: "Kilimani Crest Heights",
      location: "Lenana Road, Kilimani, Nairobi",
      type: "Mixed-Use",
      capexBudget: 145000000,
      opexBudget: 12000000,
      healthGrade: "A",
      healthStatusText: "Optimal Efficiency",
      description: "Multi-family premium development utilizing double-glazed solar defense glass, rainwater harvesting, and continuous concrete waterproofing. High durability choices yield low long-term operational expenses.",
      status: "Under Construction",
      constructionStartDate: "2025-01-15",
      completionDate: "2026-12-20",
      initialConstructionCost: 145000000,
      materialCost: 40000000,
      labourCost: 25000000,
      maintenanceCost: 12000000,
      utilityCost: 8500000,
      repairCost: 4500000,
      renovationCost: 18000000,
      otherCost: 3000000,
      expectedLifecycleYears: 50,
      floors: 14,
      units: 56,
      code: "KCH-001",
      clientName: "Wandera Investments Ltd",
      estimatedFloorArea: 5400
    },
    {
      id: "prop-2",
      name: "Thika Road Commercial Park",
      location: "Ruiru Exit 11, Thika Highway",
      type: "Commercial",
      capexBudget: 95000000,
      opexBudget: 24000000,
      healthGrade: "C",
      healthStatusText: "High Maintenance Risk",
      description: "Suburban logistics and retail hub. Uses sub-standard single-layer corrugated roofing sheets and standard low-efficiency HVAC motors. Suffers heavy 'first-cost bias' where low initial cost led to extreme utility and maintenance invoices.",
      status: "Under Construction",
      constructionStartDate: "2025-03-01",
      completionDate: "2026-11-15",
      initialConstructionCost: 95000000,
      materialCost: 30000000,
      labourCost: 18000000,
      maintenanceCost: 24000000,
      utilityCost: 19500000,
      repairCost: 8500000,
      renovationCost: 12000000,
      otherCost: 5000000,
      expectedLifecycleYears: 30,
      floors: 5,
      units: 20,
      code: "TCP-002",
      clientName: "Kenyatta Road Associates",
      estimatedFloorArea: 3200
    },
    {
      id: "prop-3",
      name: "Westlands Executive Suites",
      location: "Mvuli Road, Westlands, Nairobi",
      type: "Residential",
      capexBudget: 210000000,
      opexBudget: 18000000,
      healthGrade: "B",
      healthStatusText: "Good Standing",
      description: "Premium office suite block. Equipped with automated LED grids and smart sensor integration. Features partial rooftop solar. Good durability, with predictable minor elevator and pump repairs scheduled.",
      status: "Active",
      constructionStartDate: "2023-06-10",
      completionDate: "2025-04-18",
      initialConstructionCost: 210000000,
      materialCost: 60000000,
      labourCost: 35000000,
      maintenanceCost: 18000000,
      utilityCost: 12000000,
      repairCost: 6000000,
      renovationCost: 25000000,
      otherCost: 8000000,
      expectedLifecycleYears: 40,
      floors: 10,
      units: 40,
      code: "WES-003",
      clientName: "Westlands Suites LLC",
      estimatedFloorArea: 8000
    }
  ];

  const defaultMaterials = [
    { id: "mat-1", name: "Bamburi Powermax Cement CEM I 42.5N", category: "Concrete & Cement", price: 920, unit: "50Kg Bag", supplier: "Bamburi Special Concrete", lastUpdated: "2026-06-15" },
    { id: "mat-2", name: "Deformed High-Yield Reinforcement Steel T12", category: "Structural Metal", price: 1450, unit: "12m Bar", supplier: "Apex Steel Kenya", lastUpdated: "2026-06-20" },
    { id: "mat-3", name: "Sika Waterproofing Damp-proof Membrane Compound", category: "Chemical Additives", price: 8500, unit: "20L Jerrycan", supplier: "Bamburi Special Concrete", lastUpdated: "2026-06-10" },
    { id: "mat-4", name: "Centralized Solar Water Heating Thermal Tube Array", category: "Renewable Energy", price: 185000, unit: "System Unit", supplier: "Davis & Shirtliff", lastUpdated: "2026-06-22" },
    { id: "mat-5", name: "Double-Glazed Low-Emissivity Solar Defense Panels", category: "Windows & Glazing", price: 7800, unit: "Square Meter", supplier: "Alumil Kenya Ltd", lastUpdated: "2026-06-18" },
    { id: "mat-6", name: "High-Efficiency VRF HVAC Outdoor Condenser 10HP", category: "HVAC Machinery", price: 420000, unit: "Unit Set", supplier: "Usoni Air Conditioning", lastUpdated: "2026-06-24" }
  ];

  const defaultCostEntries = [
    {
      id: "cost-101",
      propertyId: "prop-1",
      phase: "Construction",
      component: "Foundation Waterproofing (Durability Upgrade)",
      amount: 8500000,
      date: "2024-03-12",
      contractor: "Bamburi Special Concrete",
      status: "Paid",
      description: "Waterproofing membrane additives included in foundations. Eliminated structural water ingress entirely."
    },
    {
      id: "cost-102",
      propertyId: "prop-1",
      phase: "Construction",
      component: "Double-Glazed Low-E Glass Installation",
      amount: 14200000,
      date: "2024-06-20",
      contractor: "Alumil Kenya Ltd",
      status: "Paid",
      description: "Premium glazing installed to decrease radiative heating, reducing HVAC cooling requirement by 35%."
    },
    {
      id: "cost-103",
      propertyId: "prop-1",
      phase: "Operational",
      component: "Rooftop Solar Battery Grid Power Draw",
      amount: 450000,
      date: "2026-04-10",
      contractor: "Kenya Power (Supplemental)",
      status: "Paid",
      description: "Monthly supplemental power draw grid invoice. Unusually low due to rooftop solar array contribution."
    },
    {
      id: "cost-104",
      propertyId: "prop-1",
      phase: "Maintenance",
      component: "Solar System Annual Inverter Tune-Up",
      amount: 180000,
      date: "2026-05-01",
      contractor: "Davis & Shirtliff",
      status: "Paid",
      description: "Preventative recalibration and cleaning of the centralized string inverters."
    },
    {
      id: "cost-201",
      propertyId: "prop-2",
      phase: "Construction",
      component: "Standard Corrugated Roofing (Economy Grade)",
      amount: 3200000,
      date: "2023-01-15",
      contractor: "Local Roofing Wholesalers",
      status: "Paid",
      description: "Low budget standard corrugated metal roofing installed. Resulted in minor leak alerts during monsoon cycles."
    }
  ];

  const defaultUsers = [
    {
      id: "user-admin",
      email: "wanderaabdulwahab4@gmail.com",
      name: "Abdulwahab Wandera",
      role: "Administrator",
      organization: "Wandera Investments Ltd",
      phone: "+254 712 345 678",
      passwordHash: "54b79259254eaed6593410bd63c089de0d797d2b4f020683060a21bbad6da5ed"
    },
    {
      id: "user-manager",
      email: "manager.thika@blcts.com",
      name: "Kamau Njoroge",
      role: "Facility Manager",
      organization: "Thika Block Management",
      phone: "+254 722 987 654",
      passwordHash: "276cbf1e0dd8b5d1bd515780206dfbf0257d379494feefee8503f2d85e9a7c2a"
    }
  ];

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(defaultProjects, null, 2));
  }
  if (!fs.existsSync(MATERIALS_FILE)) {
    fs.writeFileSync(MATERIALS_FILE, JSON.stringify(defaultMaterials, null, 2));
  }
  if (!fs.existsSync(COST_ENTRIES_FILE)) {
    fs.writeFileSync(COST_ENTRIES_FILE, JSON.stringify(defaultCostEntries, null, 2));
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

async function startServer() {
  ensureDatabase();
  const app = express();
  const PORT = 3000;

  // Crucial: Increase base64 transfer capability limit to enable large file scans
  app.use(express.json({ limit: "25mb" }));

  // Helper Database Read-Write Utilities
  const readJSON = (filePath: string) => {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  };

  const writeJSON = (filePath: string, data: any) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  };

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "BLCTSDatabaseGateway"
    });
  });

  // 1. Projects REST API
  app.get("/api/projects", (req, res) => {
    const list = readJSON(PROJECTS_FILE);
    res.json(list);
  });

  app.post("/api/projects", (req, res) => {
    const list = readJSON(PROJECTS_FILE);
    const newProject = req.body;
    list.push(newProject);
    writeJSON(PROJECTS_FILE, list);
    res.status(201).json(newProject);
  });

  app.put("/api/projects/:id", (req, res) => {
    const list = readJSON(PROJECTS_FILE);
    const updated = req.body;
    const index = list.findIndex((p: any) => p.id === req.params.id);
    if (index !== -1) {
      list[index] = updated;
      writeJSON(PROJECTS_FILE, list);
      res.json(updated);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    const list = readJSON(PROJECTS_FILE);
    const index = list.findIndex((p: any) => p.id === req.params.id);
    if (index !== -1) {
      list[index].isSoftDeleted = true;
      writeJSON(PROJECTS_FILE, list);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  // 2. Materials Price Index REST API
  app.get("/api/materials", (req, res) => {
    const list = readJSON(MATERIALS_FILE);
    res.json(list);
  });

  app.post("/api/materials", (req, res) => {
    const list = readJSON(MATERIALS_FILE);
    const newMat = req.body;
    list.push(newMat);
    writeJSON(MATERIALS_FILE, list);
    res.status(201).json(newMat);
  });

  app.put("/api/materials/:id", (req, res) => {
    const list = readJSON(MATERIALS_FILE);
    const updated = req.body;
    const index = list.findIndex((m: any) => m.id === req.params.id);
    if (index !== -1) {
      list[index] = updated;
      writeJSON(MATERIALS_FILE, list);
      res.json(updated);
    } else {
      res.status(404).json({ error: "Material index not found" });
    }
  });

  app.delete("/api/materials/:id", (req, res) => {
    const list = readJSON(MATERIALS_FILE);
    const filtered = list.filter((m: any) => m.id !== req.params.id);
    writeJSON(MATERIALS_FILE, filtered);
    res.json({ success: true });
  });

  // 3. Cost Transactions/Ledger API
  app.get("/api/cost-entries", (req, res) => {
    const list = readJSON(COST_ENTRIES_FILE);
    res.json(list);
  });

  app.post("/api/cost-entries", (req, res) => {
    const list = readJSON(COST_ENTRIES_FILE);
    const entry = req.body;
    list.push(entry);
    writeJSON(COST_ENTRIES_FILE, list);
    res.status(201).json(entry);
  });

  // 4. Secure Authentication API
  app.post("/api/auth/login", (req, res) => {
    const { email, passwordHash } = req.body;
    if (!email || !passwordHash) {
      return res.status(400).json({ error: "Email and secure password verification checksum required" });
    }

    const users = readJSON(USERS_FILE);
    const matched = users.find((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!matched) {
      return res.status(401).json({ error: "User account not found" });
    }

    if (matched.passwordHash === passwordHash) {
      // Omit credentials before sending to frontend
      const { passwordHash: _, ...safeUser } = matched;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ error: "Invalid password credentials provided. Access denied." });
    }
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, passwordHash, name, role, organization, phone } = req.body;
    if (!email || !passwordHash || !name || !role) {
      return res.status(400).json({ error: "Required fields missing for user secure enrollment" });
    }

    const allowedSelfRegisterRoles = ["Building Owner", "Facility Manager"];
    const assignedRole = allowedSelfRegisterRoles.includes(role) ? role : "Building Owner";

    const users = readJSON(USERS_FILE);
    const exists = users.some((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (exists) {
      return res.status(400).json({ error: "An account is already enrolled with this email" });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase().trim(),
      name,
      role: assignedRole,
      organization: organization || "General Real Estate Developer",
      phone: phone || "",
      passwordHash
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  });

  // NEW: AI Architectural Plan Analysis Endpoint
  app.post("/api/analyze-plan", async (req, res) => {
    try {
      const { image, mimeType, fileName } = req.body;
      
      if (!image || !mimeType) {
        return res.status(400).json({ 
          error: "Missing required parameters: both base64 image data and mimeType are mandatory." 
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: "AI_ANALYSIS_UNAVAILABLE",
          message: "Blueprint analysis could not be completed because the AI service is not configured. Please contact your Administrator to enable AI blueprint analysis, or enter the project specifications manually."
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const planPrompt = `You are a Senior Quantity Surveyor and Architect licensed in Kenya, specializing in construction cost estimation.

Analyze the attached architectural drawing: "${fileName || 'architectural_drawing'}".

Your job is to EXTRACT ONLY what you can actually see or measure from this drawing.
DO NOT invent or fabricate measurements. If you cannot determine something, return null for that field.

Extract the following where visible:
1. estimatedFloorArea: Gross Floor Area in m² (per floor). Null if not determinable.
2. floors: Number of floors/storeys. Null if not determinable.
3. buildingType: "Residential", "Maisonette", "Apartment", "Commercial", "Office", "Mixed-Use", "Warehouse", "School", "Hospital", "Industrial", or "Unknown" if unclear.
4. confidence: Your confidence 0.0–1.0 in the extracted measurements. Be honest. 0.5 = uncertain.
5. observations: 3–6 honest observations. For any dimension you cannot determine, state exactly: "Unable to determine [field] from uploaded drawing."
   Include: what you CAN see, what you CANNOT determine, and any quality concerns.
6. roomCount: Approximate room count if floor plan is visible. Null if not visible.
7. bedrooms: Bedroom count if visible. Null if not determinable.
8. bathrooms: Bathroom count if visible. Null if not determinable.
9. roofType: "Flat Roof", "Pitched Roof", "Trussed Roof", "Unknown" or null.
10. drawingScale: Scale string (e.g. "1:100") if marked on drawing. Null if not found.

HONESTY RULE: Never guess dimensions. Return null rather than a fabricated number.
Return strictly as JSON matching the schema.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { data: image, mimeType: mimeType } },
          planPrompt
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              estimatedFloorArea: { type: 'INTEGER', description: 'GFA per floor in m², null if not determinable' },
              floors:             { type: 'INTEGER', description: 'Number of floors, null if not determinable' },
              buildingType:       { type: 'STRING',  description: 'Building classification' },
              confidence:         { type: 'NUMBER',  description: 'Confidence 0.0–1.0' },
              observations:       { type: 'ARRAY', items: { type: 'STRING' }, description: '3–6 honest observations' },
              roomCount:          { type: 'INTEGER', description: 'Approximate rooms, null if unknown' },
              bedrooms:           { type: 'INTEGER', description: 'Bedroom count, null if unknown' },
              bathrooms:          { type: 'INTEGER', description: 'Bathroom count, null if unknown' },
              roofType:           { type: 'STRING',  description: 'Roof type or null' },
              drawingScale:       { type: 'STRING',  description: 'Scale e.g. 1:100, null if not found' },
            },
            required: ['estimatedFloorArea', 'floors', 'buildingType', 'confidence', 'observations']
          }
        }
      });

      const responseText = result.text;
      if (!responseText) {
        return res.status(500).json({ error: "Received empty response back from Gemini model." });
      }

      const planAnalysis = JSON.parse(responseText);
      res.json(planAnalysis);

    } catch (err: any) {
      return res.status(503).json({
        success: false,
        error: "AI_ANALYSIS_ERROR",
        message: "Blueprint analysis could not be completed due to a processing error. Please try again or enter specifications manually."
      });
    }
  });

  // NEW: AI-Assisted Cost Estimation Endpoint (Objective 6)
  app.post("/api/cost-estimate", async (req, res) => {
    try {
      const { property, materials = [] } = req.body;

      if (!property) {
        return res.status(400).json({ error: "Property object is mandatory." });
      }

      const area = parseFloat(property.estimatedFloorArea || property.floorArea) || 2500;
      const floorsNum = parseInt(property.floors) || 4;
      const unitsNum = parseInt(property.units) || 12;

      // Find prices from materials database if provided, else use defaults
      const findPrice = (keyword: string, def: number) => {
        const found = materials.find((m: any) => m.name.toLowerCase().includes(keyword.toLowerCase()) || m.category.toLowerCase().includes(keyword.toLowerCase()));
        return found ? found.price : def;
      };

      const cementPrice = findPrice("cement", 920);
      const steelPrice = findPrice("steel", 1450);
      const waterproofingPrice = findPrice("waterproof", 8500);
      const windowPrice = findPrice("double-glazed", 7800);
      const hvacPrice = findPrice("hvac", 420000);

      const getFallbackEstimate = () => {
        const totalArea = area * floorsNum;
        
        const items = [
          {
            category: "Foundation",
            materialUsed: "Bamburi Cement (CEM I 42.5N) + Aggregate",
            quantity: Math.round(area * 0.8),
            unit: "50Kg Bag",
            unitPrice: cementPrice,
            totalCost: Math.round(area * 0.8 * cementPrice) + Math.round(area * 3000), // add labor and aggregate
            calculationNotes: `Estimated foundation concrete volume based on slab area of ${area} SQM. Includes reinforcement cement mix.`
          },
          {
            category: "Structural Frame",
            materialUsed: "High-Yield Reinforcement Steel T12",
            quantity: Math.round(area * floorsNum * 0.15),
            unit: "12m Bar",
            unitPrice: steelPrice,
            totalCost: Math.round(area * floorsNum * 0.15 * steelPrice) + Math.round(totalArea * 4000),
            calculationNotes: `Reinforced concrete frame for ${floorsNum} floors. High tensile steel support structure calculated for load stability.`
          },
          {
            category: "Walls",
            materialUsed: "Standard Walling Block Blocks",
            quantity: Math.round(totalArea * 12),
            unit: "Sqm Blocks",
            unitPrice: 110,
            totalCost: Math.round(totalArea * 12 * 110),
            calculationNotes: `Load-bearing blockwork wall panels covering both exterior facades and partition dividing lines.`
          },
          {
            category: "Roofing",
            materialUsed: "Metal Sheet Roofing Structure",
            quantity: Math.round(area * 1.15),
            unit: "Square Meter",
            unitPrice: 1400,
            totalCost: Math.round(area * 1.15 * 1400),
            calculationNotes: `Slab or pitched metal truss roofing covering ${area} SQM footprint with standard rain runoff channel gutters.`
          },
          {
            category: "Doors",
            materialUsed: "Solid Timber & Security Steel Frames",
            quantity: unitsNum * 3 + floorsNum * 2,
            unit: "Pre-hung Set",
            unitPrice: 18500,
            totalCost: (unitsNum * 3 + floorsNum * 2) * 18500,
            calculationNotes: `Includes premium hardwood internal doors and heavy duty high-security steel front entrance doors.`
          },
          {
            category: "Windows",
            materialUsed: "Double-Glazed Low-Emissivity Glass Panels",
            quantity: Math.round(totalArea * 0.12),
            unit: "Square Meter",
            unitPrice: windowPrice,
            totalCost: Math.round(totalArea * 0.12 * windowPrice),
            calculationNotes: `Low-E heat defensive double glazing panels to reduce thermal transfer and opex cooling.`
          },
          {
            category: "Flooring",
            materialUsed: "Vitrified Porcelain Tiles (60x60)",
            quantity: Math.round(totalArea * 0.95),
            unit: "Square Meter",
            unitPrice: 2200,
            totalCost: Math.round(totalArea * 0.95 * 2200),
            calculationNotes: `High traffic porcelain tiles for common lobby stairs and residential apartment units.`
          },
          {
            category: "Plumbing",
            materialUsed: "PPR Piping, Water Pumps, & Drainage",
            quantity: unitsNum * 2,
            unit: "Wet Area Outlet",
            unitPrice: 35000,
            totalCost: (unitsNum * 2) * 35000 + Math.round(waterproofingPrice * 5),
            calculationNotes: `Water distribution lines, sewage venting, and damp-proof membrane waterproofing compound protection.`
          },
          {
            category: "Electrical Installation",
            materialUsed: "Copper Wiring, Conduit Piping, & DB Boards",
            quantity: unitsNum,
            unit: "Apartment Kit",
            unitPrice: 75000,
            totalCost: unitsNum * 75000,
            calculationNotes: `Three-phase mains intake, distribution boards, conduits, and safety circuit breakers per unit.`
          },
          {
            category: "Finishes",
            materialUsed: "Anti-fungal Interior/Exterior Paint Spec",
            quantity: Math.round(totalArea * 3),
            unit: "Square Meter",
            unitPrice: 480,
            totalCost: Math.round(totalArea * 3 * 480),
            calculationNotes: `Premium acrylic washable emulsion wall finishing and high weathering external defense paint coatings.`
          }
        ];

        const totalSum = items.reduce((sum, item) => sum + item.totalCost, 0);

        return {
          propertyId: property.id,
          breakdown: items,
          totalSum,
          isFallbackModel: true
        };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json(getFallbackEstimate());
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert Quantity Surveyor (Q.S) and Cost Engineer practicing in Nairobi, Kenya.
Analyze the following building project:
- Name: "${property.name}"
- Type: "${property.type}"
- Location: "${property.location}"
- Floor Area: ${area} SQM
- Floors: ${floorsNum}
- Units/Apartments: ${unitsNum}
- Construction Cost (Expected): KSh ${property.initialConstructionCost || property.capexBudget || "110M"}

We have a localized material cost index database containing current rates (e.g., Cement bag at KSh ${cementPrice}, Steel rebar at KSh ${steelPrice}, Glazed panels at KSh ${windowPrice}, etc.).

Estimate a realistic cost breakdown for these 10 categories:
1. Foundation
2. Structural Frame
3. Walls
4. Roofing
5. Doors
6. Windows
7. Flooring
8. Plumbing
9. Electrical Installation
10. Finishes

For each category, choose a realistic material description matching our database, estimate realistic quantities based on the floor area (${area} SQM) and floors (${floorsNum}), specify the unit of measure, appropriate unit prices in KSh, calculate the total cost, and write a brief calculationNotes explaining your engineering rationale (e.g. "Calculated as slab area of ${area} SQM multiplied by concrete curing factor...").

The total sum of these 10 categories should align closely with the expected construction cost (around KSh ${property.initialConstructionCost || "110M"}). Always return correct JSON.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              propertyId: { type: 'STRING' },
              breakdown: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    category: { type: 'STRING' },
                    materialUsed: { type: 'STRING' },
                    quantity: { type: 'INTEGER' },
                    unit: { type: 'STRING' },
                    unitPrice: { type: 'INTEGER' },
                    totalCost: { type: 'INTEGER' },
                    calculationNotes: { type: 'STRING' }
                  },
                  required: ['category', 'materialUsed', 'quantity', 'unit', 'unitPrice', 'totalCost', 'calculationNotes']
                }
              },
              totalSum: { type: 'INTEGER' }
            },
            required: ['propertyId', 'breakdown', 'totalSum']
          }
        }
      });

      const responseText = result.text;
      if (!responseText) {
        return res.json(getFallbackEstimate());
      }

      const parsedJson = JSON.parse(responseText);
      parsedJson.propertyId = property.id;
      parsedJson.isFallbackModel = false;
      res.json(parsedJson);

    } catch (err: any) {
            res.status(500).json({ error: "Could not generate cost estimate." });
    }
  });

  // NEW AI Construction Timeline & Material Usage Forecasting Endpoint
  app.post("/api/completion-forecast", async (req, res) => {
    try {
      const { property, workforceModifier = 1.0, supplyChainStatus = "Normal" } = req.body;

      if (!property) {
        return res.status(400).json({ error: "Property object is mandatory." });
      }

      const getFallbackForecast = () => {
        const costVal = property.capexBudget || 100000000;
        
        // Apply modifiers to base speed
        let speedMult = workforceModifier;
        if (supplyChainStatus === "Bottlenecked") speedMult *= 0.65;
        if (supplyChainStatus === "Accelerated") speedMult *= 1.25;

        const progressBase = Math.min(100, Math.max(0, Math.round((property.capexBudget ? 50 : 0) * speedMult)));

        const aiCompletionProgress = Math.min(100, Math.max(0, Math.round(progressBase * (speedMult > 1 ? 1 + (speedMult - 1) * 0.15 : speedMult))));
        const factorCompleteness = (100 - aiCompletionProgress) / 100;

        const originalTotalDays = 730; // ~2 years
        const aiEstimatedDaysToCompletion = aiCompletionProgress === 100 ? 0 : Math.round((originalTotalDays * factorCompleteness) / speedMult);
        
        const originalCompletionStr = property.completionDate || "2026-11-15";
        const origDate = new Date(originalCompletionStr);
        // compute adjusted date based on remaining days
        const currentDate = new Date();
        const adjustedDate = aiCompletionProgress === 100
          ? origDate
          : new Date(currentDate.getTime() + aiEstimatedDaysToCompletion * 24 * 60 * 60 * 1000);

        const aiOverrunProbability = aiCompletionProgress === 100 
          ? 0 
          : Math.min(95, Math.max(5, Math.round((property.healthGrade === "C" ? 45 : 12) * (supplyChainStatus === "Bottlenecked" ? 1.8 : 0.9) / (workforceModifier >= 1.5 ? 0.8 : 1.0))));

        // Materials List Estimations (Cement, Steel Rebars, Sand, Coarse, Bricks, Double-glazed Glass)
        const cementEst = Math.round((costVal * 0.08) / 850); // bags of cement (850 KES each)
        const steelEst = Math.round((costVal * 0.12) / 110000); // tonnes of steel rebar (110,000 KES/t)
        const stoneEst = Math.round((costVal * 0.06) / 1800); // Tonnes of building quarry stone (1800 KES/t)
        const sandEst = Math.round((costVal * 0.05) / 1500); // Tonnes of sand (1500 KES/t)
        const glassEst = Math.round((costVal * 0.04) / 4500); // SQM of double or single glazed panels

        const materialsUsage = [
          {
            materialName: "Savanna Post-Tensile Cement",
            unit: "Bags (50kg)",
            estimatedTotalBudget: cementEst,
            actualConsumed: Math.round(cementEst * (aiCompletionProgress / 100)),
            remainingNeeded: Math.round(cementEst * (1 - aiCompletionProgress / 100)),
            efficiencyStatus: property.healthGrade === "C" ? "At Risk" : "Optimal",
            forecastWastePercent: property.healthGrade === "C" ? 4.8 : 1.2
          },
          {
            materialName: "Devki Reinforcement Steel (D16/T20)",
            unit: "Tonnes",
            estimatedTotalBudget: steelEst,
            actualConsumed: Math.round(steelEst * (Math.min(100, aiCompletionProgress * 1.1) / 100)), // concrete frame starts early
            remainingNeeded: Math.round(steelEst * Math.max(0, (1 - (aiCompletionProgress * 1.1) / 100))),
            efficiencyStatus: supplyChainStatus === "Bottlenecked" ? "Exceeded" : "Optimal",
            forecastWastePercent: supplyChainStatus === "Bottlenecked" ? 6.5 : 2.0
          },
          {
            materialName: "Quarry Stonemasonry Blocks",
            unit: "Tonnes",
            estimatedTotalBudget: stoneEst,
            actualConsumed: Math.round(stoneEst * (Math.max(0, aiCompletionProgress - 20) / 80)),
            remainingNeeded: Math.round(stoneEst * (1 - Math.max(0, aiCompletionProgress - 20) / 80)),
            efficiencyStatus: "Optimal",
            forecastWastePercent: 1.5
          },
          {
            materialName: "Makueni River Concrete Sand",
            unit: "Tonnes",
            estimatedTotalBudget: sandEst,
            actualConsumed: Math.round(sandEst * (aiCompletionProgress / 100)),
            remainingNeeded: Math.round(sandEst * (1 - aiCompletionProgress / 100)),
            efficiencyStatus: "Optimal",
            forecastWastePercent: 3.1
          },
          {
            materialName: "Energy-Saving Glazed Facade Panels",
            unit: "Sqm Panels",
            estimatedTotalBudget: glassEst,
            actualConsumed: Math.round(glassEst * (Math.max(0, aiCompletionProgress - 60) / 40)),
            remainingNeeded: Math.round(glassEst * (1 - Math.max(0, aiCompletionProgress - 60) / 40)),
            efficiencyStatus: property.healthGrade === "C" ? "At Risk" : "Optimal",
            forecastWastePercent: property.healthGrade === "C" ? 8.2 : 0.8
          }
        ];

        // Ensure materials remain positive numbers
        materialsUsage.forEach(m => {
          if (m.remainingNeeded < 0) m.remainingNeeded = 0;
          if (m.actualConsumed > m.estimatedTotalBudget) m.actualConsumed = m.estimatedTotalBudget;
        });

        const msMilestones = [
          { milestoneName: "Substructure & Excavations", standardProgressPercent: 15, estimatedDate: "2025-04-10", status: aiCompletionProgress > 15 ? "Completed" : "In-Progress" },
          { milestoneName: "Superstructure Hollow Frame Post Concreting", standardProgressPercent: 45, estimatedDate: "2025-10-15", status: aiCompletionProgress > 45 ? "Completed" : aiCompletionProgress > 15 ? "In-Progress" : "Scheduled" },
          { milestoneName: "Zoning & Brickwork Masonry Work", standardProgressPercent: 65, estimatedDate: "2026-03-05", status: aiCompletionProgress > 65 ? "Completed" : aiCompletionProgress > 45 ? "In-Progress" : "Scheduled" },
          { milestoneName: "Glazing Glass, MEP Inlets, and Electrical Wiring", standardProgressPercent: 85, estimatedDate: "2026-08-20", status: aiCompletionProgress > 85 ? "Completed" : aiCompletionProgress > 65 ? "In-Progress" : "Scheduled" },
          { milestoneName: "Interior Plaster, Paint Assemblies, & Testing", standardProgressPercent: 100, estimatedDate: adjustedDate.toISOString().substring(0, 10), status: aiCompletionProgress === 100 ? "Completed" : aiCompletionProgress > 85 ? "In-Progress" : "Scheduled" }
        ];

        return {
          propertyId: property.id,
          statusFlag: aiCompletionProgress === 100 ? "Active" : aiEstimatedDaysToCompletion > 365 ? "Delayed" : "Under Construction",
          aiCompletionProgress,
          aiEstimatedDaysToCompletion,
          aiOverrunProbability,
          aiAdjustedCompletionDate: adjustedDate.toISOString().substring(0, 10),
          materialsUsage,
          completionMilestones: msMilestones,
          criticalInsights: [
            `Current workforce factor of ${workforceModifier}x directly influences foundation concreting and hollow frame block erection pacing.`,
            supplyChainStatus === "Bottlenecked" 
              ? `⚠️ Logistic Alert: Supply chain pipeline bottlenecking detected on Thika Highway causing material dispatch lateness. Forecast waste factor spiked to ${property.healthGrade === "C" ? "8.2%" : "4.5%"} on fragile glazing panels.` 
              : `✓ Logistics Fluidity: Material delivery pipeline optimized. Minimal cement wastage rates computed.`,
            property.healthGrade === "C" 
              ? `⚠️ First-Cost Bias Warning: Grade C construction spec utilizes cheaper single-layer components which increase water ingress and cement sealant wastage risk.`
              : `✓ Optimal Build Assurance: High Grade specifications (double glazing solar barrier, premium waterproof concrete additive) prevent early utility corrosion.`,
            `Nairobi material rate index recommendation: Procure Bamburi ready-mix concrete rather than site mixing to reduce sand wastage by up to 14% under wet season conditions.`
          ],
          isFallbackModel: true
        };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback model triggered gracefully
        return res.json(getFallbackForecast());
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a Senior Construction Planner and Estimator specializing in multi-million KSh developer estates in Nairobi, Kenya.
Analyze the following property information, constraints, and modifiers:
Property details:
- Name: "${property.name}"
- Type: "${property.type}"
- Location: "${property.location}"
- Initial Construction Cost / CAPEX: KSh ${property.capexBudget}
- Planned Start Date: "${property.constructionStartDate || '2025-01-15'}"
- Planned Completion Date: "${property.completionDate || '2026-12-20'}"
- Physical Specs: ${property.floors || 8} floors, ${property.units || 32} apartments/units
- Quality Specification Grade: Grade "${property.healthGrade || 'B'}" (Grade A yields high durability solar glass, rain capture, low opex; Grade C yields standard components with higher waste risk)

Simulation Modifiers:
- Workforce size adjustment factor: ${workforceModifier || 1.0}x standard (determines rate of progress; >1.0 accelerates, <1.0 decelerates)
- Supply Chain Pipeline status: "${supplyChainStatus || 'Normal'}" ("Normal", "Bottlenecked" - increases waste and probability of overrun, "Accelerated" - stabilizes schedules)

Based on these parameters and the current simulated date of June 2026, forecast the building's completion profile and material depletion logs.
Provide a fully detailed estimate of key construction materials:
- Cement Bags (50kg)
- Structural Steel Rebar (Tonnes)
- River Sand (Tonnes)
- Stone Blocks (Tonnes)
- Ventilation Glazing Facades (Sqm Panels)

Adjust consumed vs. remaining needed volumes in full alignment with the calculated completion progress percentage.
Make sure the estimatedDaysToCompletion align logically with your adjusted completion date based on June 2026.
Ensure the returned compliance structure strictly adheres to the requested JSON layout. Ensure KSh financial quantities and numbers make engineering sense for the budget.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              propertyId: { type: 'STRING' },
              statusFlag: { type: 'STRING', description: 'Under Construction, Renovation, Active, or Delayed' },
              aiCompletionProgress: { type: 'INTEGER', description: 'Percentage completed so far (0-100)' },
              aiEstimatedDaysToCompletion: { type: 'INTEGER', description: 'Days left until completion' },
              aiOverrunProbability: { type: 'INTEGER', description: 'Probability of cost or schedule overrun from 0% to 100%' },
              aiAdjustedCompletionDate: { type: 'STRING', description: 'Estimated date of completion formatted as YYYY-MM-DD' },
              materialsUsage: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    materialName: { type: 'STRING' },
                    unit: { type: 'STRING' },
                    estimatedTotalBudget: { type: 'INTEGER' },
                    actualConsumed: { type: 'INTEGER' },
                    remainingNeeded: { type: 'INTEGER' },
                    efficiencyStatus: { type: 'STRING', description: 'Optimal, At Risk, Exceeded' },
                    forecastWastePercent: { type: 'NUMBER' }
                  },
                  required: ['materialName', 'unit', 'estimatedTotalBudget', 'actualConsumed', 'remainingNeeded', 'efficiencyStatus', 'forecastWastePercent']
                }
              },
              completionMilestones: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    milestoneName: { type: 'STRING' },
                    standardProgressPercent: { type: 'INTEGER' },
                    estimatedDate: { type: 'STRING' },
                    status: { type: 'STRING', description: 'Completed, In-Progress, Scheduled, Delayed' }
                  },
                  required: ['milestoneName', 'standardProgressPercent', 'estimatedDate', 'status']
                }
              },
              criticalInsights: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            },
            required: [
              'propertyId',
              'statusFlag',
              'aiCompletionProgress',
              'aiEstimatedDaysToCompletion',
              'aiOverrunProbability',
              'aiAdjustedCompletionDate',
              'materialsUsage',
              'completionMilestones',
              'criticalInsights'
            ]
          }
        }
      });

      const responseText = result.text;
      if (!responseText) {
        return res.json(getFallbackForecast());
      }

      const parsedJson = JSON.parse(responseText);
      parsedJson.propertyId = property.id;
      parsedJson.isFallbackModel = false;
      res.json(parsedJson);

    } catch (err: any) {
            res.status(500).json({ error: "Could not generate forecast through Gemini or fallback engines." });
    }
  });

  // Setup static file loading and server redirection rules
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
      });
}

startServer();