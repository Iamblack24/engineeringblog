import React from 'react';
import { FaPaperPlane, FaSyncAlt } from 'react-icons/fa';

const CaseStudyInputForm = ({
    projectInput, setProjectInput,
    industryType, setIndustryType,
    audienceType, setAudienceType,
    detailLevel, setDetailLevel,
    includeSections, setIncludeSections,
    industryTemplates, audienceProfiles,
    formatSectionName,
    isGenerating, onGenerate, generationProgress, // generationProgress is now 0-100 percentage
    error,
    showOnlySettings = false,
    showGenerateButton = true // New prop to control generate button visibility
}) => {

    const handleSectionChange = (sectionKey) => {
        setIncludeSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // Calculate integer percentage for display
    const progressPercent = Math.round(generationProgress || 0);

    return (
        <div className={`csg-input-form-container ${showOnlySettings ? 'settings-only' : ''}`}>
            {/* Only show project input if we are showing the full form (not settings-only) */}
            {!showOnlySettings && (
                <div className="input-group main-input">
                    <label htmlFor="projectInput">Project Description</label>
                    <textarea
                        id="projectInput"
                        value={projectInput}
                        onChange={(e) => setProjectInput(e.target.value)}
                        placeholder="Describe the engineering project (e.g., Design and construction of a suspension bridge, Development of a new electric motor...)"
                        rows={5}
                        disabled={isGenerating}
                        required
                    />
                </div>
            )}

            {/* Settings are always shown in this component */}
            <div className="settings-grid">
                 <div className="input-group">
                    <label htmlFor="industryType">Industry</label>
                    <select
                        id="industryType"
                        value={industryType}
                        onChange={e => setIndustryType(e.target.value)}
                        disabled={isGenerating}
                    >
                        {Object.entries(industryTemplates).map(([key, value]) => (
                            <option key={key} value={key}>{value.name}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label htmlFor="audienceType">Target Audience</label>
                    <select
                        id="audienceType"
                        value={audienceType}
                        onChange={e => setAudienceType(e.target.value)}
                        disabled={isGenerating}
                    >
                        {Object.entries(audienceProfiles).map(([key, value]) => (
                            <option key={key} value={key}>{value.name}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label htmlFor="detailLevel">Detail Level</label>
                    <select
                        id="detailLevel"
                        value={detailLevel}
                        onChange={e => setDetailLevel(e.target.value)}
                        disabled={isGenerating}
                    >
                        <option value="comprehensive">Comprehensive</option>
                        <option value="focused">Focused</option>
                    </select>
                </div>
            </div>

            <div className="input-group sections-selection">
                <label>Include Sections</label>
                <div className="sections-checkbox-grid">
                    {Object.keys(includeSections).map(sectionKey => (
                        <label key={sectionKey} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={includeSections[sectionKey]}
                                onChange={() => handleSectionChange(sectionKey)}
                                disabled={isGenerating}
                            />
                            <span>{formatSectionName(sectionKey)}</span>
                        </label>
                    ))}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Only show generate button if specified and not in settings-only mode */}
            {showGenerateButton && !showOnlySettings && (
                 <div className="generate-action">
                    {isGenerating && progressPercent < 100 && (
                        <div className="progress-bar-container inline-progress">
                            <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                            <span>{progressPercent}%</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={isGenerating || !projectInput.trim()}
                        className="generate-button-v2"
                    >
                        {isGenerating ? <FaSyncAlt className="spinner-icon" /> : <FaPaperPlane />}
                        {isGenerating ? 'Generating...' : 'Generate Case Study'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CaseStudyInputForm;