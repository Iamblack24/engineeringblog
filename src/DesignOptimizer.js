const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Initialize OpenAI with API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

// Add error handling middleware
router.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  });
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

router.use(apiLimiter);

// Validation rules for different design types
const VALIDATION_RULES = {
  beam: {
    span: { min: 1, max: 30 },
    load: { min: 0.5, max: 50 },
    material: ['Reinforced Concrete', 'Steel', 'Timber'],
    support: ['Simply Supported', 'Fixed-Fixed', 'Cantilever']
  },
  truss: {
    span: { min: 6, max: 100 },
    height: { min: 1, max: 15 },
    loadType: ['Roof Load', 'Bridge Load', 'Solar Panel Support'],
    material: ['Steel', 'Aluminum', 'Timber']
  },
  foundation: {
    load: { min: 100, max: 5000 },
    soilCapacity: { min: 50, max: 1000 },
    depth: { min: 0.5, max: 5 },
    soilType: ['Clay', 'Sand', 'Rock', 'Mixed']
  }
};

// Engineering context for AI prompts
const ENGINEERING_CONTEXT = {
  beam: `You are a structural engineering expert. Analyze and optimize the beam design based on:
    1. Bending moment and shear force calculations
    2. Material properties and allowable stresses
    3. Deflection limits (span/360 for live loads)
    4. Cost optimization
    Provide dimensions, safety factors, and detailed analysis.`,
  
  truss: `You are a structural engineering expert. Design and optimize the truss considering:
    1. Member forces using method of joints/sections
    2. Member sizing based on tension/compression
    3. Connection requirements
    4. Material efficiency and cost
    Provide member sizes, forces, and stability analysis.`,
  
  foundation: `You are a geotechnical engineering expert. Design the foundation considering:
    1. Bearing capacity calculations
    2. Settlement analysis
    3. Soil pressure distribution
    4. Reinforcement requirements
    Provide dimensions, reinforcement details, and safety factors.`
};

// Example responses for AI guidance
const EXAMPLE_RESPONSES = {
  beam: {
    dimensions: [
      "Beam depth: 450 mm",
      "Beam width: 300 mm",
      "Main reinforcement: 3 x 20mm diameter bars",
      "Shear reinforcement: 10mm stirrups at 200mm spacing"
    ],
    analysis: [
      "Maximum bending moment: 125 kN.m",
      "Maximum shear force: 84 kN",
      "Maximum deflection: 15 mm (within limit of span/360)",
      "Stress utilization: 85%"
    ],
    materials: [
      "Concrete grade: C30/37",
      "Steel reinforcement grade: B500B",
      "Required concrete volume: 0.45 m³",
      "Total steel weight: 85 kg"
    ],
    costs: [
      "Concrete cost: $180",
      "Steel reinforcement cost: $255",
      "Formwork cost: $320",
      "Total cost: $755"
    ],
    safety: [
      "Bending moment safety factor: 1.8",
      "Shear force safety factor: 2.1",
      "Deflection ratio: 0.75 of allowable",
      "Overall structural reliability index: 3.8"
    ],
    numericalData: {
      dimensions: {
        depth: 0.45,
        width: 0.3,
        length: 6.0
      },
      forces: [
        { position: 0, moment: 0, shear: 84 },
        { position: 1.5, moment: 95, shear: 42 },
        { position: 3.0, moment: 125, shear: 0 },
        { position: 4.5, moment: 95, shear: -42 },
        { position: 6.0, moment: 0, shear: -84 }
      ],
      deflection: [
        { position: 0, value: 0 },
        { position: 1.5, value: 8 },
        { position: 3.0, value: 15 },
        { position: 4.5, value: 8 },
        { position: 6.0, value: 0 }
      ]
    }
  },
  truss: {
    dimensions: [
      "Total span: 24 meters",
      "Height at center: 3.6 meters",
      "Panel length: 3 meters",
      "Member sizes: Top chord - 2L150x150x15, Bottom chord - 2L125x125x12"
    ],
    analysis: [
      "Maximum axial force (compression): 450 kN",
      "Maximum axial force (tension): 380 kN",
      "Maximum joint displacement: 12 mm",
      "Critical buckling load factor: 2.8"
    ],
    materials: [
      "Steel grade: S355",
      "Total steel weight: 2850 kg",
      "Connection plates: 24 pieces",
      "Bolts: 144 pieces M20 grade 8.8"
    ],
    costs: [
      "Steel members cost: $8,550",
      "Connection materials: $1,200",
      "Fabrication cost: $4,275",
      "Total cost: $14,025"
    ],
    safety: [
      "Member strength utilization: 0.85",
      "Joint capacity safety factor: 1.9",
      "Stability safety factor: 2.8",
      "Overall structural reliability index: 4.2"
    ],
    numericalData: {
      dimensions: {
        span: 24.0,
        height: 3.6,
        panelLength: 3.0
      },
      memberForces: [
        { member: "TC1", force: -450 },
        { member: "BC1", force: 380 },
        { member: "D1", force: -120 },
        { member: "D2", force: 85 }
      ],
      joints: [
        { x: 0, y: 0 },
        { x: 3, y: 0.9 },
        { x: 6, y: 1.8 }
      ]
    }
  },
  foundation: {
    dimensions: [
      "Length: 3.5 meters",
      "Width: 3.5 meters",
      "Depth: 0.8 meters",
      "Edge thickness: 0.4 meters"
    ],
    analysis: [
      "Maximum soil pressure: 180 kN/m²",
      "Predicted settlement: 15 mm",
      "Eccentricity ratio: 0.05",
      "Base pressure distribution uniformity: 0.92"
    ],
    materials: [
      "Concrete grade: C25/30",
      "Reinforcement mesh: 16mm @ 200mm c/c",
      "Required concrete volume: 9.8 m³",
      "Total steel weight: 785 kg"
    ],
    costs: [
      "Concrete cost: $1,470",
      "Steel reinforcement cost: $2,355",
      "Excavation cost: $450",
      "Total cost: $4,275"
    ],
    safety: [
      "Bearing capacity safety factor: 2.5",
      "Sliding safety factor: 3.2",
      "Overturning safety factor: 4.1",
      "Settlement safety factor: 1.8"
    ],
    numericalData: {
      dimensions: {
        length: 3.5,
        width: 3.5,
        depth: 0.8,
        thickness: 0.4
      },
      pressures: [
        { position: 0, value: 165 },
        { position: 0.875, value: 172 },
        { position: 1.75, value: 180 },
        { position: 2.625, value: 172 },
        { position: 3.5, value: 165 }
      ],
      settlement: [
        { time: 0, value: 0 },
        { time: 7, value: 8 },
        { time: 30, value: 12 },
        { time: 365, value: 15 }
      ]
    }
  }
};

// Main optimization endpoint
router.post('/optimize-design', async (req, res) => {
  console.log(`Design request received - Type: ${req.body.designType}`);
  
  try {
    const { designType, parameters } = req.body;

    // Add this validation call
    const validationError = validateParameters(designType, parameters);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    const optimizedDesign = await generateOptimizedDesign(designType, parameters);
    res.json({ success: true, data: optimizedDesign });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Parameter validation function
const validateParameters = (designType, parameters) => {
  const rules = VALIDATION_RULES[designType];
  
  // Check if all required parameters are present
  const requiredParams = Object.keys(rules);
  const missingParams = requiredParams.filter(param => !parameters[param]);
  
  if (missingParams.length > 0) {
    return `Missing required parameters: ${missingParams.join(', ')}`;
  }
  
  // Validate parameter values
  for (const [key, value] of Object.entries(parameters)) {
    if (rules[key]) {
      if (rules[key].min !== undefined && value < rules[key].min) {
        return `${key} must be at least ${rules[key].min}`;
      }
      if (rules[key].max !== undefined && value > rules[key].max) {
        return `${key} must not exceed ${rules[key].max}`;
      }
      if (Array.isArray(rules[key]) && !rules[key].includes(value)) {
        return `Invalid ${key}: ${value}`;
      }
    }
  }
  
  return null;
};

// Generate AI-optimized design
const generateOptimizedDesign = async (designType, parameters) => {
  try {
    const prompt = generatePrompt(designType, parameters);

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: `${ENGINEERING_CONTEXT[designType]} 
                      You are a structural engineering expert. Your response must:
                      1. Be valid JSON only
                      2. Follow the exact structure of the example provided
                      3. Include all required fields: dimensions, analysis, materials, costs, safety, numericalData
                      4. Contain realistic engineering values
                      5. Not include any HTML or additional text` 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
      )
    ]);

    let parsedResponse;
    try {
      const rawResponse = completion.choices[0].message.content;
      parsedResponse = JSON.parse(rawResponse);
      
      // Validate the structure before processing
      validateAIResponse(parsedResponse);
      
      // If validation passes, format the response
      return formatDesignResponse(designType, parameters, parsedResponse);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Raw AI response:', completion.choices[0].message.content);
        throw new Error('Invalid JSON response from AI');
      }
      throw error;
    }

  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error(`Design generation failed: ${error.message}`);
  }
};

// Generate prompt based on design type and parameters
const generatePrompt = (designType, parameters) => {
  const example = EXAMPLE_RESPONSES[designType];
  const basePrompt = getBasePrompt(designType, parameters);

  return `${basePrompt}

Here's an example of the expected response format:
${JSON.stringify(example, null, 2)}

Please provide a similar JSON response for the given parameters, maintaining the same structure but with appropriate values for the specified design conditions.`;
};

// Base prompt function
const getBasePrompt = (designType, parameters) => {
  switch (designType) {
    case 'beam':
      return `Design an optimized ${parameters.material} beam with:
        - Span: ${parameters.span} meters
        - Design Load: ${parameters.load} kN/m
        - Support Condition: ${parameters.support}`;
    case 'truss':
      return `Design an optimized ${parameters.material} truss with:
        - Span: ${parameters.span} meters
        - Height: ${parameters.height} meters
        - Load Type: ${parameters.loadType}`;
    case 'foundation':
      return `Design an optimized foundation with:
        - Column Load: ${parameters.load} kN
        - Soil Capacity: ${parameters.soilCapacity} kN/m²
        - Soil Type: ${parameters.soilType}
        - Depth: ${parameters.depth} m`;
    default:
      throw new Error('Invalid design type');
  }
};

// Format design response with additional checks
const formatDesignResponse = (designType, parameters, aiResponse) => {
  try {
    // Validate response structure again
    validateAIResponse(aiResponse);

    // Generate visualization data
    const visualizationData = generateVisualizationData(designType, parameters, aiResponse);

    // Combine the data
    return {
      ...aiResponse,
      numericalData: {
        ...aiResponse.numericalData,
        ...visualizationData
      }
    };
  } catch (error) {
    console.error('Response formatting error:', error);
    throw new Error(`Failed to format design response: ${error.message}`);
  }
};

// Generate visualization data
const generateVisualizationData = (designType, parameters, aiResponse) => {
  const baseData = aiResponse.numericalData;

  switch (designType) {
    case 'beam':
      return {
        ...baseData,
        dimensions: {
          span: parameters.span,
          depth: baseData.dimensions.depth || 0.6,
          width: baseData.dimensions.width || 0.3
        },
        supportType: parameters.support
      };

    case 'truss':
      return {
        ...baseData,
        dimensions: {
          span: parameters.span,
          height: parameters.height
        },
        loadType: parameters.loadType
      };

    case 'foundation':
      return {
        ...baseData,
        dimensions: {
          length: baseData.dimensions.length || Math.sqrt(parameters.load / parameters.soilCapacity),
          width: baseData.dimensions.width || Math.sqrt(parameters.load / parameters.soilCapacity),
          depth: parameters.depth
        },
        soilType: parameters.soilType
      };

    default:
      return baseData;
  }
};

// Enhanced validation function
const validateAIResponse = (response) => {
  const requiredFields = ['dimensions', 'analysis', 'materials', 'costs', 'safety', 'numericalData'];
  
  // Check if response is an object
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format: not an object');
  }

  // Check for required fields
  for (const field of requiredFields) {
    if (!response[field]) {
      throw new Error(`Invalid AI response: missing ${field}`);
    }
  }

  // Check numericalData structure
  if (typeof response.numericalData !== 'object') {
    throw new Error('Invalid AI response: numericalData should be an object');
  }

  if (!response.numericalData.dimensions) {
    throw new Error('Invalid AI response: numericalData.dimensions missing');
  }

  return true; // Validation passed
};

// Endpoint for CAD file generation
router.post('/generate-cad', async (req, res) => {
  try {
    const { designData } = req.body;
    const cadSpecs = await generateCADSpecs(designData);
    res.json({ success: true, data: cadSpecs });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint for PDF report generation
router.post('/generate-report', async (req, res) => {
  try {
    const { designData } = req.body;
    const report = await generateReport(designData);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;