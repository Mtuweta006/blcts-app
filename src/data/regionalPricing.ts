import { RegionalPricingDatabase, RegionalPricing, PricingItem } from "../types";

const nairobiMaterials: PricingItem[] = [
  { id: "cement", name: "Portland Cement (50kg)", basePrice: 850, unit: "Bag", notes: "Bamburi/Savanna standard grade" },
  { id: "sand", name: "River Sand (Fine)", basePrice: 2100, unit: "Tonne", notes: "Machakos quarry, delivered" },
  { id: "ballast", name: "Ballast (3/4 inch)", basePrice: 1800, unit: "Tonne", notes: "Nairobi quarry source" },
  { id: "steel-y12", name: "Reinforcement Steel Y12", basePrice: 92000, unit: "Tonne", "notes": "Tata/Devki standard" },
  { id: "timber", name: "Timber (Softwood 4x2)", basePrice: 1200, unit: "Piece", notes: "Cypress, 14ft length" },
  { id: "roofing", name: "Pre-Painted Alu-Zinc Roofing", basePrice: 1450, unit: "m²", notes: "Mabati Rolling Mills gauge 30" },
  { id: "plumbing", name: "Plumbing Pipes & Fittings", basePrice: 5200, unit: "SQM", notes: "PPR + PVC combined index" },
  { id: "electrical", name: "Electrical Installation", basePrice: 4800, unit: "SQM", notes: "Conduit cabling + DB board" },
  { id: "paint", name: "Interior Paint (20L)", basePrice: 6800, unit: "Drum", notes: "Crown/Berger premium emulsion" },
  { id: "tiles", name: "Ceramic Floor Tiles (600x600)", basePrice: 1850, unit: "Box", notes: "Sicilia/Goodwill imported" },
  { id: "glass", name: "Double-Glazed Low-E Glass", basePrice: 8200, unit: "m²", notes: "Alumil Kenya premium" },
  { id: "waterproofing", name: "Waterproofing Membrane", basePrice: 4500, unit: "m²", notes: "Foundation grade membrane" },
  { id: "hvac", name: "VFD HVAC Unit (15kW)", basePrice: 385000, unit: "Unit", notes: "Daikin/Usoni inverter" }
];

const nairobiLabour: PricingItem[] = [
  { id: "mason", name: "Mason (Skilled)", basePrice: 1800, unit: "Day", notes: "Standard masonry wage" },
  { id: "carpenter", name: "Carpenter (Skilled)", basePrice: 2000, unit: "Day", notes: "Formwork & finishing" },
  { id: "electrician", name: "Electrician (Licensed)", basePrice: 2500, unit: "Day", notes: "EPRA certified" },
  { id: "plumber", name: "Plumber (Licensed)", basePrice: 2300, unit: "Day", notes: "NCA registered" },
  { id: "welder", name: "Welder/Fabricator", basePrice: 2200, unit: "Day", notes: "Structural steel fabrication" },
  { id: "painter", name: "Painter", basePrice: 1500, unit: "Day", notes: "Interior & exterior" },
  { id: "qs", name: "Quantity Surveyor", basePrice: 8500, unit: "Day", notes: "ISK registered" },
  { id: "architect", name: "Architect", basePrice: 12000, unit: "Day", notes: "BORAQS registered" },
  { id: "engineer", name: "Structural Engineer", basePrice: 15000, unit: "Day", notes: "ERB registered" },
  { id: "foreman", name: "Site Foreman", basePrice: 3500, unit: "Day", notes: "Site supervision" }
];

const nairobiServices: PricingItem[] = [
  { id: "equipment-hire", name: "Equipment Hire (Crane/Mixer)", basePrice: 25000, unit: "Day", notes: "Standard construction equipment" },
  { id: "excavation", name: "Excavation & Earthworks", basePrice: 1800, unit: "m³", notes: "Site preparation & foundation" },
  { id: "transport", name: "Transport & Logistics", basePrice: 3500, unit: "Trip", notes: "Material delivery within county" },
  { id: "waste-disposal", name: "Waste Disposal", basePrice: 5000, unit: "Trip", notes: "Construction debris removal" }
];

function buildCounty(
  materials: PricingItem[],
  labour: PricingItem[],
  services: PricingItem[],
  materialMultiplier: number,
  labourMultiplier: number,
  serviceMultiplier: number,
  notes: string
): RegionalPricing {
  return {
    materials: materials.map(m => ({
      ...m,
      basePrice: Math.round(m.basePrice * materialMultiplier)
    })),
    labour: labour.map(l => ({
      ...l,
      basePrice: Math.round(l.basePrice * labourMultiplier)
    })),
    services: services.map(s => ({
      ...s,
      basePrice: Math.round(s.basePrice * serviceMultiplier)
    })),
    notes
  };
}

export const regionalPricingDatabase: RegionalPricingDatabase = {
  Nairobi: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 1.0, 1.0, 1.0, "Baseline index - capital city pricing"),
  Thika: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.95, 0.90, 0.92, "5% material discount, 10% labour discount - industrial hub"),
  Mombasa: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 1.15, 1.10, 1.20, "15% material premium, 10% labour premium - coastal port city"),
  Kisumu: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 1.05, 0.88, 1.10, "5% material premium, 12% labour discount - lakeside city"),
  Nakuru: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.92, 0.85, 0.95, "8% material discount, 15% labour discount - rift valley"),
  Eldoret: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.90, 0.82, 0.93, "10% material discount, 18% labour discount - western highlands"),
  Busia: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.88, 0.80, 0.90, "12% material discount, 20% labour discount - border town"),
  Machakos: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.93, 0.87, 0.94, "7% material discount, 13% labour discount - eastern Kenya"),
  Nyeri: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.91, 0.84, 0.92, "9% material discount, 16% labour discount - central Kenya"),
  Meru: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.89, 0.83, 0.91, "11% material discount, 17% labour discount - northern central"),
  Kakamega: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.87, 0.80, 0.89, "13% material discount, 20% labour discount - western Kenya"),
  Kisii: buildCounty(nairobiMaterials, nairobiLabour, nairobiServices, 0.88, 0.81, 0.90, "12% material discount, 19% labour discount - south Nyanza")
};

export const countyList = Object.keys(regionalPricingDatabase);

export const countyCities: Record<string, string[]> = {
  Nairobi: ["Nairobi CBD", "Westlands", "Kilimani", "Karen", "Embakasi", "Kasarani", "Ruaka"],
  Thika: ["Thika Town", "Ruiru", "Juja", "Gatundu"],
  Mombasa: ["Mombasa Island", "Nyali", "Likoni", "Mtwapa", "Bamburi"],
  Kisumu: ["Kisumu City", "Maseno", "Ahero", "Kondele"],
  Nakuru: ["Nakuru Town", "Naivasha", "Gilgil", "Elementaita"],
  Eldoret: ["Eldoret Town", "Iten", "Moiben", "Kapsabet"],
  Busia: ["Busia Town", "Malaba", "Port Victoria"],
  Machakos: ["Machakos Town", "Athi River", "Kangundo", "Mavoko"],
  Nyeri: ["Nyeri Town", "Karatina", "Othaya", "Mukurweini"],
  Meru: ["Meru Town", "Chuka", "Maua", "Timau"],
  Kakamega: ["Kakamega Town", "Mumias", "Bungoma", "Webuye"],
  Kisii: ["Kisii Town", "Ogembo", "Keroka", "Suneka"]
};
