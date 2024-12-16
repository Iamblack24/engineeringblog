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
    // Project Information
    projectName: { type: 'string', required: true },
    designCode: { type: 'string', required: true, options: ['ACI 318-19', 'Eurocode 2', 'IS 456:2000'] },
    
    // Geometry
    span: { type: 'number', min: 0, required: true },
    supportType: { type: 'string', required: true, options: ['Simply Supported', 'Fixed-Fixed', 'Cantilever'] },
    
    // Loading
    deadLoad: { type: 'number', min: 0, required: true },
    liveLoad: { type: 'number', min: 0, required: true },
    loadPattern: { type: 'string', required: true, options: ['Uniform', 'Point Load', 'Combined'] },
    
    // Materials
    material: { type: 'string', required: true, options: ['Reinforced Concrete', 'Steel'] },
    concreteGrade: { type: 'string', options: ['M20', 'M25', 'M30', 'M35', 'M40'] },
    steelGrade: { type: 'string', options: ['Fe415', 'Fe500', 'Fe550'] }
  },
  
  truss: {
    // Project Information
    projectName: { type: 'string', required: true },
    designCode: { type: 'string', required: true },
    
    // Geometry
    span: { type: 'number', min: 0, required: true },
    height: { type: 'number', min: 0, required: true },
    roofArea: { type: 'number', min: 0, required: true },
    trussSpacing: { type: 'number', min: 0, required: true },
    
    // Loading
    deadLoad: { type: 'number', min: 0, required: true },
    liveLoad: { type: 'number', min: 0, required: true },
    windLoad: { type: 'number', min: 0, required: true },
    
    // Materials
    material: { type: 'string', required: true },
    connectionType: { type: 'string', required: true, options: ['Welded', 'Bolted'] }
  },
  
  foundation: {
    // Project Information
    projectName: { type: 'string', required: true },
    designCode: { type: 'string', required: true },
    
    // Soil Parameters
    soilType: { type: 'string', required: true },
    bearingCapacity: { type: 'number', min: 0, required: true },
    waterTableDepth: { type: 'number', min: 0, required: true },
    soilLayering: { type: 'string', required: true },
    
    // Loading
    axialLoad: { type: 'number', min: 0, required: true },
    momentX: { type: 'number', required: true },
    momentY: { type: 'number', required: true },
    
    // Geometry
    embedmentDepth: { type: 'number', min: 0, required: true },
    
    // Materials
    concreteGrade: { type: 'string', required: true },
    steelGrade: { type: 'string', required: true }
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
    
    For strip footings:
    - Width should be 30-50% of length
    - Depth should be 20-50% of width
    - Consider overturning and sliding stability
    - Account for soil bearing capacity
    - Design for given moments and forces
    - Ensure adequate reinforcement
    
    Provide dimensions, reinforcement details, and safety factors.
    Use standard engineering ratios and practices.
    Consider cost optimization while maintaining safety.
    
    Important: Ensure width is adequate for the given loads and moments.
    For strip footings with significant moments, width is typically 2-4m.`
};

// Example responses for AI guidance
const EXAMPLE_RESPONSES = {
  beam: {
    data: {
      dimensions: {
        span: 6.0,
        depth: 0.45,
        width: 0.3
      },
      analysis: {
        strength: 85,
        maxMoment: 125,
        maxShear: 84,
        deflection: 15
      },
      materials: {
        usage: 0.85,
        concrete: {
          grade: 'C30/37',
          volume: 0.45
        },
        steel: {
          grade: 'B500B',
          weight: 85
        }
      },
      costs: {
        total: 43000,
        concrete: 12000,
        steel: 15000,
        formwork: 16000
      },
      safety: {
        factor: 1.8,
        momentRatio: 0.75,
        shearRatio: 0.65,
        deflectionRatio: 0.75
      }
    }
  },
  
  truss: {
    data: {
      dimensions: {
        span: 24.0,
        height: 3.6,
        panelLength: 3.0
      },
      analysis: {
        strength: 85,
        maxAxialForce: {
          compression: 450,
          tension: 380
        },
        displacement: 12
      },
      materials: {
        usage: 0.85,
        steel: {
          grade: 'S355',
          totalWeight: 2850,
          members: {
            topChord: '2L150x150x15',
            bottomChord: '2L125x125x12',
            verticals: 'L100x100x10',
            diagonals: 'L100x100x12'
          }
        },
        connections: {
          type: 'Bolted',
          boltGrade: '8.8',
          plateThickness: 12
        }
      },
      costs: {
        total: 50000,
        steel: 20000,
        connections: 20000,
        fabrication: 10000
      },
      safety: {
        factor: 2.1,
        stabilityFactor: 2.8,
        jointUtilization: 0.85
      },
      numericalData: {
        nodes: [
          { id: 0, x: 0, y: 0 },
          { id: 1, x: 3, y: 0.9 },
          { id: 2, x: 6, y: 1.8 },
          { id: 3, x: 9, y: 2.7 },
          { id: 4, x: 12, y: 3.6 }
        ],
        members: [
          { start: 0, end: 1, type: 'topChord', force: -450 },
          { start: 1, end: 2, type: 'topChord', force: -420 },
          { start: 0, end: 5, type: 'bottomChord', force: 380 },
          { start: 5, end: 6, type: 'bottomChord', force: 350 },
          { start: 0, end: 6, type: 'diagonal', force: -220 },
          { start: 6, end: 1, type: 'diagonal', force: 200 }
        ]
      }
    }
  },
  
  foundation: {
    data: {
      dimensions: {
        length: 6.0,
        width: 3.0,
        depth: 1.5,
        thickness: 0.6
      },
      analysis: {
        strength: 90,
        bearingPressure: 200,
        settlement: 12,
        momentCapacity: 500
      },
      materials: {
        usage: 0.85,
        concrete: {
          grade: "M30",
          volume: 27
        },
        steel: {
          grade: "Fe500",
          weight: 2400
        },
        soil: {
          type: "Stiff Clay",
          bearingCapacity: 7867
        }
      },
      costs: {
        total: 78000,
        concrete: 32000,
        steel: 27000,
        excavation: 19000
      },
      safety: {
        factor: 2.6,
        overturning: 2.9,
        sliding: 2.3,
        settlement: 0.6
      },
      numericalData: {
        soilPressure: [
          { x: 0, pressure: 170 },
          { x: 1.5, pressure: 185 },
          { x: 3, pressure: 200 },
          { x: 4.5, pressure: 185 },
          { x: 6, pressure: 170 }
        ],
        reinforcement: {
          topMesh: { size: 18, spacing: 200 },
          bottomMesh: { size: 22, spacing: 150 },
          edges: { size: 14, spacing: 200 }
        }
      }
    }
  }
};

// Add validation schema
const RESPONSE_VALIDATION_SCHEMA = {
  beam: {
    required: ['data.dimensions.span', 'data.dimensions.depth', 'data.dimensions.width'],
    schema: {
      data: {
        dimensions: {
          span: 'number',
          depth: 'number',
          width: 'number'
        }
      }
    }
  },
  truss: {
    required: ['data.dimensions.span', 'data.dimensions.height'],
    schema: {
      data: {
        dimensions: {
          span: 'number',
          height: 'number'
        }
      }
    }
  },
  foundation: {
    required: ['data.dimensions.length', 'data.dimensions.width', 'data.dimensions.depth'],
    schema: {
      data: {
        dimensions: {
          length: 'number',
          width: 'number',
          depth: 'number'
        }
      }
    }
  }
};

// Add engineering validation rules
const ENGINEERING_VALIDATION = {
  foundation: {
    stripFooting: {
      minWidthRatio: 0.3, // Width should be at least 30% of length
      maxWidthRatio: 0.5, // Width should not exceed 50% of length
      minDepthRatio: 0.2, // Depth should be at least 20% of width
      maxDepthRatio: 0.5  // Depth should not exceed 50% of width
    }
  }
};

// Main optimization endpoint
router.post('/optimize', async (req, res) => {
  try {
    const { designType, parameters } = req.body;
    
    if (!designType || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    console.log('Design request received - Type:', designType);
    const optimizedDesign = await generateOptimizedDesign(designType, parameters);

    // Restructure the response to avoid double nesting
    const responseData = {
      success: true,
      dimensions: optimizedDesign.data.dimensions,
      analysis: optimizedDesign.data.analysis,
      materials: optimizedDesign.data.materials,
      costs: optimizedDesign.data.costs,
      safety: optimizedDesign.data.safety,
      numericalData: optimizedDesign.data.numericalData,
      metadata: optimizedDesign.metadata
    };

    console.log('Sending restructured response:', JSON.stringify(responseData, null, 2));

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add response interceptor for debugging
router.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    console.log('Response being sent:', JSON.stringify(data, null, 2));
    return originalJson.call(this, data);
  };
  next();
});

// Parameter validation function
const validateParameters = (designType, parameters) => {
  const rules = VALIDATION_RULES[designType];
  
  // Check if design type exists
  if (!rules) {
    return `Invalid design type: ${designType}`;
  }
  
  // Validate required parameters and their types
  for (const [param, rule] of Object.entries(rules)) {
    if (rule.required && !parameters[param]) {
      return `Missing required parameter: ${param}`;
    }
    
    if (parameters[param]) {
      // Type validation
      if (rule.type === 'number' && typeof parameters[param] !== 'number') {
        return `${param} must be a number`;
      }
      
      // Range validation for numbers
      if (rule.type === 'number') {
        if (rule.min !== undefined && parameters[param] < rule.min) {
          return `${param} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && parameters[param] > rule.max) {
          return `${param} must not exceed ${rule.max}`;
        }
      }
      
      // Options validation
      if (rule.options && !rule.options.includes(parameters[param])) {
        return `Invalid ${param}: ${parameters[param]}. Must be one of: ${rule.options.join(', ')}`;
      }
    }
  }
  
  // Conditional validations
  if (designType === 'beam') {
    if (parameters.material === 'Reinforced Concrete' && !parameters.concreteGrade) {
      return 'Concrete grade is required for reinforced concrete beams';
    }
  }
  
  return null;
};

// Generate AI-optimized design
const generateOptimizedDesign = async (designType, parameters) => {
  try {
    console.log('Generating design for:', { designType, parameters });

    // Prepare the prompt with example response
    const prompt = `${ENGINEERING_CONTEXT[designType]}
    
    You must respond with valid JSON only, no markdown formatting or other text.
    Use this exact format:
    ${JSON.stringify(EXAMPLE_RESPONSES[designType], null, 2)}
    
    Parameters:
    ${JSON.stringify(parameters, null, 2)}
    
    Respond with a single JSON object following the exact same structure as the example.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are an expert structural engineer. Provide design calculations in JSON format only. Do not include markdown formatting or explanatory text."
      }, {
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 2000
    });

    let response;
    try {
      // Clean the response of any markdown or extra text
      const cleanedContent = completion.choices[0].message.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned AI response:', cleanedContent);
      response = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Raw AI response:', completion.choices[0].message.content);
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Validate the response
    const validatedResponse = validateAIResponse(response, designType);
    console.log('Full validated response:', JSON.stringify(validatedResponse, null, 2));

    // Return flattened structure
    return {
      data: validatedResponse.data,
      metadata: {
        designType,
        timestamp: new Date().toISOString(),
        parameters: parameters
      }
    };

  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error(`Design generation failed: ${error.message}`);
  }
};

// Update validation function
const validateAIResponse = (response, designType) => {
  console.log('Validating AI response:', { designType, response });
  
  if (!response || !response.data) {
    throw new Error('Invalid AI response: missing data structure');
  }

  // Basic schema validation
  const schema = RESPONSE_VALIDATION_SCHEMA[designType];
  if (!schema) {
    throw new Error(`Unknown design type: ${designType}`);
  }

  // Check required fields
  for (const field of schema.required) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], response);
    if (value === undefined || value === null) {
      console.error(`Missing required field: ${field}`);
      throw new Error(`Invalid AI response: missing ${field.split('.').pop()}`);
    }
  }

  // Engineering validation for foundations
  if (designType === 'foundation') {
    const { length, width, depth } = response.data.dimensions;
    const rules = ENGINEERING_VALIDATION.foundation.stripFooting;

    // Width validation
    const widthRatio = width / length;
    if (widthRatio < rules.minWidthRatio || widthRatio > rules.maxWidthRatio) {
      throw new Error(`Invalid foundation width ratio: ${widthRatio.toFixed(2)}`);
    }

    // Depth validation
    const depthRatio = depth / width;
    if (depthRatio < rules.minDepthRatio || depthRatio > rules.maxDepthRatio) {
      throw new Error(`Invalid foundation depth ratio: ${depthRatio.toFixed(2)}`);
    }
  }

  return response;
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

// Add data validation middleware
const validateData = (req, res, next) => {
  const { data } = res.locals;
  if (!data || !data.dimensions) {
    return res.status(500).json({
      success: false,
      error: 'Invalid data structure in response'
    });
  }
  next();
};

router.use(validateData);

module.exports = router;