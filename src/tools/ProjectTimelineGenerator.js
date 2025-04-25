import React, { useState } from 'react';
import './ProjectTimelineGenerator.css';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProjectTimelineGenerator = () => {
  const [projectData, setProjectData] = useState({
    // Project basics
    projectName: '',
    startDate: '',
    projectType: 'residential',
    projectManager: '',
    clientName: '',
    projectLocation: '',
    
    // Project phases with enhanced data
    phases: {
      planning: {
        enabled: true,
        duration: 30,
        dependencies: [],
        resources: {
          labor: { hours: 160, costPerHour: 50 },
          materials: 5000,
          equipment: 2000
        },
        riskFactors: ['permitting delays', 'design changes'],
        milestones: ['design approval', 'permit submission']
      },
      design: {
        enabled: true,
        duration: 45,
        dependencies: ['planning'],
        resources: {
          labor: { hours: 240, costPerHour: 75 },
          materials: 2000,
          equipment: 1000
        },
        riskFactors: ['client feedback delays', 'code compliance issues'],
        milestones: ['preliminary design review', 'final design approval']
      },
      permits: {
        enabled: true,
        duration: 30,
        dependencies: ['design'],
        resources: {
          labor: { hours: 120, costPerHour: 65 },
          materials: 1000,
          equipment: 500
        },
        riskFactors: ['approval delays', 'code changes'],
        milestones: ['permit approval']
      },
      sitework: {
        enabled: true,
        duration: 20,
        dependencies: ['permits'],
        resources: {
          labor: { hours: 200, costPerHour: 45 },
          materials: 15000,
          equipment: 5000
        },
        riskFactors: ['weather delays', 'underground utilities'],
        milestones: ['site preparation complete']
      },
      foundation: {
        enabled: true,
        duration: 25,
        dependencies: ['sitework'],
        resources: {
          labor: { hours: 300, costPerHour: 45 },
          materials: 25000,
          equipment: 4000
        },
        riskFactors: ['soil conditions', 'weather delays'],
        milestones: ['foundation complete']
      },
      structure: {
        enabled: true,
        duration: 60,
        dependencies: ['foundation'],
        resources: {
          labor: { hours: 800, costPerHour: 45 },
          materials: 50000,
          equipment: 8000
        },
        riskFactors: ['material delivery delays', 'weather delays'],
        milestones: ['structure complete']
      },
      mepRoughIn: {
        enabled: true,
        duration: 40,
        dependencies: ['structure'],
        resources: {
          labor: { hours: 400, costPerHour: 55 },
          materials: 20000,
          equipment: 3000
        },
        riskFactors: ['coordination issues', 'design changes'],
        milestones: ['MEP rough-in complete']
      },
      interiorFinishes: {
        enabled: true,
        duration: 50,
        dependencies: ['mepRoughIn'],
        resources: {
          labor: { hours: 600, costPerHour: 45 },
          materials: 30000,
          equipment: 2000
        },
        riskFactors: ['material availability', 'workmanship issues'],
        milestones: ['interior finishes complete']
      },
      exteriorFinishes: {
        enabled: true,
        duration: 35,
        dependencies: ['structure'],
        resources: {
          labor: { hours: 400, costPerHour: 45 },
          materials: 25000,
          equipment: 3000
        },
        riskFactors: ['weather delays', 'material availability'],
        milestones: ['exterior finishes complete']
      },
      finalInspections: {
        enabled: true,
        duration: 15,
        dependencies: ['interiorFinishes', 'exteriorFinishes'],
        resources: {
          labor: { hours: 80, costPerHour: 65 },
          materials: 1000,
          equipment: 500
        },
        riskFactors: ['inspection delays', 'punch list items'],
        milestones: ['final inspection passed']
      }
    },
    
    // Resource management
    resources: {
      labor: {
        types: ['architect', 'engineer', 'contractor', 'subcontractor'],
        rates: {
          architect: 75,
          engineer: 65,
          contractor: 50,
          subcontractor: 45
        }
      },
      equipment: {
        types: ['excavator', 'crane', 'concrete mixer', 'scaffolding'],
        dailyRates: {
          excavator: 500,
          crane: 800,
          concreteMixer: 300,
          scaffolding: 200
        }
      }
    },
    
    // Additional settings
    bufferDays: 5,
    workingDaysPerWeek: 5,
    holidays: [],
    weatherDelays: 0,
    contingencyPercentage: 10,
    riskMitigationBudget: 0
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt', 'network', 'resource'

  // Add user guide content
  const userGuide = {
    title: "How to Use the Project Timeline Generator",
    steps: [
      {
        title: "1. Project Basics",
        content: "Start by filling in the basic project information including project name, start date, and project manager."
      },
      {
        title: "2. Configure Phases",
        content: "For each project phase, you can enable/disable it and set its duration, labor hours, and costs. The phases are pre-configured with typical construction project stages."
      },
      {
        title: "3. Generate Timeline",
        content: "Click the 'Generate Timeline' button to create your project schedule. The tool will automatically calculate the critical path and resource utilization."
      },
      {
        title: "4. View Results",
        content: "Explore different views of your project timeline: Gantt Chart, Network Diagram, and Resource View. Each view provides different insights into your project schedule."
      },
      {
        title: "5. Export",
        content: "Export your project timeline to Excel for further analysis or sharing with stakeholders."
      }
    ],
    tips: [
      "Tip: Start with the Planning phase and work your way through the project stages.",
      "Tip: Consider dependencies between phases when setting durations.",
      "Tip: Use the Resource View to identify potential resource bottlenecks.",
      "Tip: The Critical Path shows the sequence of tasks that determine the project's duration."
    ]
  };

  // Enhanced input handlers
  const handleInputChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhaseChange = (phase, field, value) => {
    setProjectData(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: {
          ...prev.phases[phase],
          [field]: value
        }
      }
    }));
  };

  const handleResourceChange = (phase, resourceType, field, value) => {
    setProjectData(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: {
          ...prev.phases[phase],
          resources: {
            ...prev.phases[phase].resources,
            [resourceType]: {
              ...prev.phases[phase].resources[resourceType],
              [field]: value
            }
          }
        }
      }
    }));
  };

  // Enhanced validation
  const validateInputs = () => {
    const newErrors = {};
    
    if (!projectData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    if (!projectData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!projectData.projectManager.trim()) {
      newErrors.projectManager = 'Project manager is required';
    }
    
    // Validate phase durations and resources
    Object.entries(projectData.phases).forEach(([phase, data]) => {
      if (data.enabled) {
        if (data.duration <= 0) {
        newErrors[`${phase}Duration`] = `${phase} duration must be positive`;
        }
        if (data.resources.labor.hours <= 0) {
          newErrors[`${phase}LaborHours`] = `${phase} labor hours must be positive`;
        }
        if (data.resources.labor.costPerHour <= 0) {
          newErrors[`${phase}LaborCost`] = `${phase} labor cost must be positive`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced timeline calculation with critical path
  const generateTimeline = () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const timeline = [];
      const startDate = new Date(projectData.startDate);
      let currentDate = new Date(startDate);
      
      // Sort phases based on dependencies
      const sortedPhases = Object.entries(projectData.phases)
        .filter(([_, data]) => data.enabled)
        .sort((a, b) => {
          if (b[1].dependencies.includes(a[0])) return -1;
          if (a[1].dependencies.includes(b[0])) return 1;
          return 0;
        });

      // Calculate timeline for each phase
      sortedPhases.forEach(([phaseName, phaseData]) => {
        // Find latest end date of dependencies
        const dependencyEndDate = phaseData.dependencies.reduce((latestDate, depName) => {
          const depPhase = timeline.find(p => p.name === depName);
          return depPhase && depPhase.endDate > latestDate ? depPhase.endDate : latestDate;
        }, currentDate);

        // Set phase start date after dependencies
        const phaseStartDate = new Date(dependencyEndDate);
        
        // Calculate working days including buffer
        const totalDays = calculateWorkingDays(
          phaseStartDate,
          phaseData.duration + projectData.bufferDays
        );
        
        // Calculate end date
        const phaseEndDate = new Date(phaseStartDate);
        phaseEndDate.setDate(phaseEndDate.getDate() + totalDays);

        // Calculate phase costs
        const phaseCosts = {
          labor: phaseData.resources.labor.hours * phaseData.resources.labor.costPerHour,
          materials: phaseData.resources.materials,
          equipment: phaseData.resources.equipment,
          total: phaseData.resources.labor.hours * phaseData.resources.labor.costPerHour +
                 phaseData.resources.materials +
                 phaseData.resources.equipment
        };

        timeline.push({
          name: phaseName,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          duration: phaseData.duration,
          buffer: projectData.bufferDays,
          dependencies: phaseData.dependencies,
          costs: phaseCosts,
          riskFactors: phaseData.riskFactors,
          milestones: phaseData.milestones
        });

        currentDate = new Date(phaseEndDate);
      });

      // Calculate critical path
      const criticalPath = findCriticalPath(timeline);

      // Calculate project costs
      const projectCosts = calculateProjectCosts(timeline);

      // Generate risk assessment
      const riskAssessment = generateRiskAssessment(timeline);

      setResults({
        timeline,
        projectDuration: Math.ceil(
          (timeline[timeline.length - 1].endDate - startDate) / (1000 * 60 * 60 * 24)
        ),
        criticalPath,
        milestones: generateMilestones(timeline),
        costs: projectCosts,
        riskAssessment,
        resourceUtilization: calculateResourceUtilization(timeline)
      });

    } catch (error) {
      setErrors({ calculation: 'Error generating timeline' });
    }
  };

  // Enhanced critical path calculation
  const findCriticalPath = (timeline) => {
    // Calculate early start and early finish
    timeline.forEach(phase => {
      phase.earlyStart = phase.startDate;
      phase.earlyFinish = new Date(phase.startDate);
      phase.earlyFinish.setDate(phase.earlyFinish.getDate() + phase.duration);
    });

    // Calculate late start and late finish
    timeline.slice().reverse().forEach(phase => {
      const successors = timeline.filter(p => p.dependencies.includes(phase.name));
      if (successors.length === 0) {
        phase.lateFinish = phase.earlyFinish;
      } else {
        phase.lateFinish = new Date(Math.min(...successors.map(s => s.lateStart)));
      }
      phase.lateStart = new Date(phase.lateFinish);
      phase.lateStart.setDate(phase.lateStart.getDate() - phase.duration);
    });

    // Calculate float and identify critical path
    timeline.forEach(phase => {
      phase.float = (phase.lateFinish - phase.earlyFinish) / (1000 * 60 * 60 * 24);
    });

    return timeline
      .filter(phase => phase.float === 0)
      .map(phase => phase.name);
  };

  // Calculate project costs
  const calculateProjectCosts = (timeline) => {
    const costs = {
      labor: 0,
      materials: 0,
      equipment: 0,
      total: 0
    };

    timeline.forEach(phase => {
      costs.labor += phase.costs.labor;
      costs.materials += phase.costs.materials;
      costs.equipment += phase.costs.equipment;
      costs.total += phase.costs.total;
    });

    // Add contingency
    costs.contingency = costs.total * (projectData.contingencyPercentage / 100);
    costs.totalWithContingency = costs.total + costs.contingency;

    return costs;
  };

  // Generate risk assessment
  const generateRiskAssessment = (timeline) => {
    const risks = [];
    
    timeline.forEach(phase => {
      phase.riskFactors.forEach(risk => {
        risks.push({
          phase: phase.name,
          risk,
          impact: 'High', // This could be calculated based on phase dependencies
          mitigation: generateMitigationStrategy(risk)
        });
      });
    });

    return risks;
  };

  // Calculate resource utilization
  const calculateResourceUtilization = (timeline) => {
    const utilization = {
      labor: {},
      equipment: {}
    };

    // Calculate labor utilization
    Object.keys(projectData.resources.labor.rates).forEach(role => {
      utilization.labor[role] = {
        totalHours: 0,
        cost: 0
      };
    });

    // Calculate equipment utilization
    Object.keys(projectData.resources.equipment.dailyRates).forEach(equipment => {
      utilization.equipment[equipment] = {
        days: 0,
        cost: 0
      };
    });

    timeline.forEach(phase => {
      // Update labor utilization
      Object.keys(utilization.labor).forEach(role => {
        utilization.labor[role].totalHours += phase.costs.labor / projectData.resources.labor.rates[role];
        utilization.labor[role].cost += phase.costs.labor;
      });

      // Update equipment utilization
      Object.keys(utilization.equipment).forEach(equipment => {
        utilization.equipment[equipment].days += phase.duration;
        utilization.equipment[equipment].cost += phase.costs.equipment;
      });
    });

    return utilization;
  };

  // Export functionality
  const exportToExcel = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();
    
    // Timeline sheet
    const timelineData = results.timeline.map(phase => ({
      'Phase': phase.name,
      'Start Date': phase.startDate.toLocaleDateString(),
      'End Date': phase.endDate.toLocaleDateString(),
      'Duration (days)': phase.duration,
      'Labor Cost': phase.costs.labor,
      'Materials Cost': phase.costs.materials,
      'Equipment Cost': phase.costs.equipment,
      'Total Cost': phase.costs.total
    }));
    
    const timelineWS = XLSX.utils.json_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(wb, timelineWS, 'Timeline');

    // Costs sheet
    const costsData = [
      ['Category', 'Amount'],
      ['Labor', results.costs.labor],
      ['Materials', results.costs.materials],
      ['Equipment', results.costs.equipment],
      ['Subtotal', results.costs.total],
      ['Contingency', results.costs.contingency],
      ['Total with Contingency', results.costs.totalWithContingency]
    ];
    
    const costsWS = XLSX.utils.aoa_to_sheet(costsData);
    XLSX.utils.book_append_sheet(wb, costsWS, 'Costs');

    // Risk Assessment sheet
    const riskData = results.riskAssessment.map(risk => ({
      'Phase': risk.phase,
      'Risk': risk.risk,
      'Impact': risk.impact,
      'Mitigation Strategy': risk.mitigation
    }));
    
    const riskWS = XLSX.utils.json_to_sheet(riskData);
    XLSX.utils.book_append_sheet(wb, riskWS, 'Risk Assessment');

    // Save the file
    XLSX.writeFile(wb, `${projectData.projectName}_Project_Timeline.xlsx`);
  };

  // Generate mitigation strategy
  const generateMitigationStrategy = (risk) => {
    const strategies = {
      'permitting delays': 'Start permit application process early and maintain regular communication with authorities',
      'design changes': 'Implement change control process and maintain detailed documentation',
      'client feedback delays': 'Set clear deadlines for feedback and schedule regular review meetings',
      'code compliance issues': 'Conduct regular code compliance reviews and engage code consultants early',
      'weather delays': 'Build weather contingency into schedule and monitor forecasts',
      'underground utilities': 'Conduct thorough site investigation and utility mapping',
      'soil conditions': 'Perform geotechnical investigation and plan for potential soil improvements',
      'material delivery delays': 'Order materials early and maintain buffer stock',
      'coordination issues': 'Implement BIM coordination and regular trade meetings',
      'workmanship issues': 'Implement quality control program and regular inspections',
      'inspection delays': 'Schedule inspections well in advance and maintain open communication with inspectors',
      'punch list items': 'Implement systematic punch list process and regular walkthroughs'
    };

    return strategies[risk] || 'Implement standard risk management procedures';
  };

  // Add missing functions
  const calculateWorkingDays = (startDate, duration) => {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (count < duration) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return Math.ceil(count / projectData.workingDaysPerWeek) * 7;
  };

  const generateMilestones = (timeline) => {
    const milestones = [];
    timeline.forEach(phase => {
      if (phase.milestones && phase.milestones.length > 0) {
        phase.milestones.forEach(milestone => {
          milestones.push({
            name: milestone,
            phase: phase.name,
            date: phase.endDate
          });
        });
      }
    });
    return milestones;
  };

  return (
    <div className="project-timeline-generator">
      <h2>Enhanced Project Timeline Generator</h2>
      
      {/* User Guide Section */}
      <div className="user-guide">
        <h3>{userGuide.title}</h3>
        <div className="guide-steps">
          {userGuide.steps.map((step, index) => (
            <div key={index} className="guide-step">
              <h4>{step.title}</h4>
              <p>{step.content}</p>
            </div>
          ))}
        </div>
        <div className="guide-tips">
          <h4>Quick Tips</h4>
          <ul>
            {userGuide.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Project Basics Form */}
      <div className="input-section">
        <h3>Project Basics</h3>
        <div className="form-group">
          <label>Project Name:</label>
          <input
            type="text"
            value={projectData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className={errors.projectName ? 'error' : ''}
          />
          {errors.projectName && <span className="error-message">{errors.projectName}</span>}
        </div>

        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={projectData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className={errors.startDate ? 'error' : ''}
          />
          {errors.startDate && <span className="error-message">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label>Project Manager:</label>
          <input
            type="text"
            value={projectData.projectManager}
            onChange={(e) => handleInputChange('projectManager', e.target.value)}
            className={errors.projectManager ? 'error' : ''}
          />
          {errors.projectManager && <span className="error-message">{errors.projectManager}</span>}
        </div>
      </div>

      {/* Project Phases Form */}
      <div className="input-section">
        <h3>Project Phases</h3>
        {Object.entries(projectData.phases).map(([phase, data]) => (
          <div key={phase} className="phase-group">
            <h4>{phase.charAt(0).toUpperCase() + phase.slice(1)}</h4>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={data.enabled}
                  onChange={(e) => handlePhaseChange(phase, 'enabled', e.target.checked)}
                />
                Enable Phase
              </label>
            </div>
            {data.enabled && (
              <>
              <div className="form-group">
                <label>Duration (days):</label>
                <input
                  type="number"
                  value={data.duration}
                  onChange={(e) => handlePhaseChange(phase, 'duration', parseInt(e.target.value))}
                  className={errors[`${phase}Duration`] ? 'error' : ''}
                />
                {errors[`${phase}Duration`] && 
                  <span className="error-message">{errors[`${phase}Duration`]}</span>
                }
              </div>

                <div className="form-group">
                  <label>Labor Hours:</label>
                  <input
                    type="number"
                    value={data.resources.labor.hours}
                    onChange={(e) => handleResourceChange(phase, 'labor', 'hours', parseInt(e.target.value))}
                    className={errors[`${phase}LaborHours`] ? 'error' : ''}
                  />
                  {errors[`${phase}LaborHours`] && 
                    <span className="error-message">{errors[`${phase}LaborHours`]}</span>
                  }
                </div>

                <div className="form-group">
                  <label>Labor Cost per Hour:</label>
                  <input
                    type="number"
                    value={data.resources.labor.costPerHour}
                    onChange={(e) => handleResourceChange(phase, 'labor', 'costPerHour', parseFloat(e.target.value))}
                    className={errors[`${phase}LaborCost`] ? 'error' : ''}
                  />
                  {errors[`${phase}LaborCost`] && 
                    <span className="error-message">{errors[`${phase}LaborCost`]}</span>
                  }
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button 
        className="generate-button"
        onClick={generateTimeline}
      >
        Generate Timeline
      </button>

      {/* View Mode Selector */}
      {results && (
        <div className="view-mode-selector">
          <button 
            className={viewMode === 'gantt' ? 'active' : ''}
            onClick={() => setViewMode('gantt')}
          >
            Gantt Chart
          </button>
          <button 
            className={viewMode === 'network' ? 'active' : ''}
            onClick={() => setViewMode('network')}
          >
            Network Diagram
          </button>
          <button 
            className={viewMode === 'resource' ? 'active' : ''}
            onClick={() => setViewMode('resource')}
          >
            Resource View
          </button>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="results-section">
          <h3>Project Timeline</h3>
          
          {/* Gantt Chart View */}
          {viewMode === 'gantt' && (
            <div className="gantt-chart">
            {results.timeline.map(phase => (
              <div 
                key={phase.name}
                  className={`timeline-phase ${results.criticalPath.includes(phase.name) ? 'critical' : ''}`}
                style={{
                    width: `${(phase.duration / results.projectDuration) * 100}%`,
                    marginLeft: `${((phase.startDate - new Date(projectData.startDate)) / (1000 * 60 * 60 * 24) / results.projectDuration) * 100}%`
                }}
              >
                <span className="phase-name">{phase.name}</span>
                <span className="phase-dates">
                  {phase.startDate.toLocaleDateString()} - {phase.endDate.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          )}

          {/* Network Diagram View */}
          {viewMode === 'network' && (
            <div className="network-diagram">
              {results.timeline.map(phase => (
                <div 
                  key={phase.name}
                  className={`network-node ${results.criticalPath.includes(phase.name) ? 'critical' : ''}`}
                >
                  <div className="node-content">
                    <h4>{phase.name}</h4>
                    <p>Duration: {phase.duration} days</p>
                    <p>Float: {phase.float} days</p>
                  </div>
                  {phase.dependencies.map(dep => (
                    <div 
                      key={dep}
                      className="dependency-line"
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Resource View */}
          {viewMode === 'resource' && (
            <div className="resource-view">
              <h4>Resource Utilization</h4>
              <div className="resource-charts">
                <div className="chart-container">
                  <h5>Labor Utilization</h5>
                  <Chart
                    type="bar"
                    data={{
                      labels: Object.keys(results.resourceUtilization.labor),
                      datasets: [{
                        label: 'Hours',
                        data: Object.values(results.resourceUtilization.labor).map(r => r.totalHours),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)'
                      }]
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Hours'
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="chart-container">
                  <h5>Equipment Utilization</h5>
                  <Chart
                    type="bar"
                    data={{
                      labels: Object.keys(results.resourceUtilization.equipment),
                      datasets: [{
                        label: 'Days',
                        data: Object.values(results.resourceUtilization.equipment).map(e => e.days),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)'
                      }]
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Days'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Project Summary */}
          <div className="project-summary">
            <h4>Project Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Total Duration:</span>
                <span className="value">{results.projectDuration} days</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Cost:</span>
                <span className="value">${results.costs.totalWithContingency.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Critical Path:</span>
                <span className="value">{results.criticalPath.join(' → ')}</span>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="risk-assessment">
            <h4>Risk Assessment</h4>
            <div className="risk-list">
              {results.riskAssessment.map((risk, index) => (
                <div key={index} className="risk-item">
                  <h5>{risk.phase} - {risk.risk}</h5>
                  <p><strong>Impact:</strong> {risk.impact}</p>
                  <p><strong>Mitigation:</strong> {risk.mitigation}</p>
              </div>
            ))}
            </div>
          </div>

          {/* Export Button */}
          <button 
            className="export-button"
            onClick={exportToExcel}
          >
            Export to Excel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectTimelineGenerator;