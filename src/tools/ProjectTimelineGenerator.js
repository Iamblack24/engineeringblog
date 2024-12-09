import React, { useState } from 'react';
import './ProjectTimelineGenerator.css';

const ProjectTimelineGenerator = () => {
  const [projectData, setProjectData] = useState({
    // Project basics
    projectName: '',
    startDate: '',
    projectType: 'residential',
    
    // Project phases
    phases: {
      planning: {
        enabled: true,
        duration: 30,  // days
        dependencies: []
      },
      design: {
        enabled: true,
        duration: 45,
        dependencies: ['planning']
      },
      permits: {
        enabled: true,
        duration: 30,
        dependencies: ['design']
      },
      sitework: {
        enabled: true,
        duration: 20,
        dependencies: ['permits']
      },
      foundation: {
        enabled: true,
        duration: 25,
        dependencies: ['sitework']
      },
      structure: {
        enabled: true,
        duration: 60,
        dependencies: ['foundation']
      },
      mepRoughIn: {
        enabled: true,
        duration: 40,
        dependencies: ['structure']
      },
      interiorFinishes: {
        enabled: true,
        duration: 50,
        dependencies: ['mepRoughIn']
      },
      exteriorFinishes: {
        enabled: true,
        duration: 35,
        dependencies: ['structure']
      },
      finalInspections: {
        enabled: true,
        duration: 15,
        dependencies: ['interiorFinishes', 'exteriorFinishes']
      }
    },
    
    // Additional settings
    bufferDays: 5,
    workingDaysPerWeek: 5,
    holidays: [],
    weatherDelays: 0
  });

  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  // Add handlers for form inputs
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

  const validateInputs = () => {
    const newErrors = {};
    
    if (!projectData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    if (!projectData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    // Validate phase durations
    Object.entries(projectData.phases).forEach(([phase, data]) => {
      if (data.enabled && data.duration <= 0) {
        newErrors[`${phase}Duration`] = `${phase} duration must be positive`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateWorkingDays = (startDate, duration) => {
    let currentDate = new Date(startDate);
    let workingDays = 0;
    let totalDays = 0;
    
    while (workingDays < duration) {
      // Check if it's a working day (Monday-Friday by default)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Check if it's not a holiday
        const isHoliday = projectData.holidays.some(holiday => 
          holiday.getTime() === currentDate.getTime()
        );
        
        if (!isHoliday) {
          workingDays++;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      totalDays++;
    }
    
    return totalDays;
  };

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

        timeline.push({
          name: phaseName,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          duration: phaseData.duration,
          buffer: projectData.bufferDays,
          dependencies: phaseData.dependencies
        });

        currentDate = new Date(phaseEndDate);
      });

      // Add weather delay buffer
      if (projectData.weatherDelays > 0) {
        const lastPhase = timeline[timeline.length - 1];
        lastPhase.endDate.setDate(
          lastPhase.endDate.getDate() + projectData.weatherDelays
        );
      }

      setResults({
        timeline,
        projectDuration: Math.ceil(
          (timeline[timeline.length - 1].endDate - startDate) / (1000 * 60 * 60 * 24)
        ),
        criticalPath: findCriticalPath(timeline),
        milestones: generateMilestones(timeline),
        risks: identifyRisks(timeline)
      });

    } catch (error) {
      setErrors({ calculation: 'Error generating timeline' });
    }
  };

  // Helper functions for timeline analysis
  const findCriticalPath = (timeline) => {
    // Implementation of critical path calculation
    // Returns array of phase names that form the critical path
  };

  const generateMilestones = (timeline) => {
    // Generate key project milestones
    return [
      { name: 'Project Start', date: timeline[0].startDate },
      { name: 'Foundation Complete', date: timeline.find(p => p.name === 'foundation').endDate },
      { name: 'Structure Complete', date: timeline.find(p => p.name === 'structure').endDate },
      { name: 'Project Completion', date: timeline[timeline.length - 1].endDate }
    ];
  };

  const identifyRisks = (timeline) => {
    // Identify potential schedule risks
    return [
      'Weather delays during exterior work',
      'Permit approval delays',
      'Material delivery delays',
      'Labor availability',
      'Subcontractor coordination'
    ];
  };

  return (
    <div className="project-timeline-generator">
      <h2>Project Timeline Generator</h2>
      
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

      {/* Results Display */}
      {results && (
        <div className="results-section">
          <h3>Project Timeline</h3>
          {/* Timeline visualization */}
          <div className="timeline-visualization">
            {results.timeline.map(phase => (
              <div 
                key={phase.name}
                className="timeline-phase"
                style={{
                  width: `${(phase.duration / results.projectDuration) * 100}%`
                }}
              >
                <span className="phase-name">{phase.name}</span>
                <span className="phase-dates">
                  {phase.startDate.toLocaleDateString()} - {phase.endDate.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>

          {/* Critical Path */}
          <div className="critical-path">
            <h4>Critical Path</h4>
            <div className="critical-phases">
              {results.criticalPath.join(' → ')}
            </div>
          </div>

          {/* Milestones */}
          <div className="milestones">
            <h4>Key Milestones</h4>
            {results.milestones.map(milestone => (
              <div key={milestone.name} className="milestone">
                <span className="milestone-name">{milestone.name}</span>
                <span className="milestone-date">
                  {milestone.date.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimelineGenerator;