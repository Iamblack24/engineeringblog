import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsPDF } from 'jspdf';
import {
    FaFileDownload, FaRobot, FaSlidersH, FaUsers, FaPaperPlane,
    FaSyncAlt, FaQuestionCircle, FaBroom, FaBookOpen
} from 'react-icons/fa';
import './AICaseStudyGenerator.css';
import CaseStudyDisplay from './CaseStudyDisplay';
import FollowUpChat from './FollowUpChat';
import CaseStudyInputForm from './CaseStudyInputForm';
import useLocalStorage from '../hooks/useLocalStorage'; // Ensure this path is correct

// Industry and audience templates remain the same
const industryTemplates = {
  construction: {
    name: "Construction & Infrastructure",
    description: "Building, civil engineering, and infrastructure projects",
    promptEnhancements: "Focus on structural engineering principles, construction methodologies, material science, and project management. Include relevant building codes and standards."
  },
  mechanical: {
    name: "Mechanical Engineering",
    description: "Machine design, automotive, manufacturing systems",
    promptEnhancements: "Include principles of mechanics, thermodynamics, material properties, and manufacturing processes. Focus on efficiency, reliability, and performance metrics."
  },
  electrical: {
    name: "Electrical Engineering",
    description: "Power systems, electronics, control systems",
    promptEnhancements: "Emphasize circuit theory, power distribution, electronics design, and electromagnetic principles. Include relevant electrical codes and safety standards."
  },
  software: {
    name: "Software Engineering",
    description: "Software architecture, systems design, algorithms",
    promptEnhancements: "Focus on software architecture, design patterns, algorithms complexity, and system scalability. Include performance considerations and testing methodologies."
  },
  environmental: {
    name: "Environmental Engineering",
    description: "Waste management, water treatment, sustainability",
    promptEnhancements: "Emphasize environmental impact assessments, sustainability metrics, regulatory compliance, and ecological system analysis. Include relevant environmental standards."
  },
  process: {
    name: "Process Engineering",
    description: "Chemical processes, manufacturing workflows",
    promptEnhancements: "Focus on chemical processes, unit operations, process optimization, and quality control. Include safety protocols and efficiency metrics."
  },
  other: {
    name: "General Engineering",
    description: "Other engineering disciplines",
    promptEnhancements: "Provide a comprehensive analysis covering general engineering principles, methodologies, and best practices applicable to the specific context."
  }
};

const audienceProfiles = {
  technical: {
    name: "Technical Professionals",
    promptAdjustment: "Present detailed technical specifications, methodologies, and engineering analyses. Use industry-standard terminology and include relevant formulas, models, and technical diagrams."
  },
  executive: {
    name: "Executive Leadership",
    promptAdjustment: "Focus on strategic value, ROI, business impact, and competitive advantages. Emphasize high-level benefits while summarizing technical details. Include metrics on cost savings, efficiency gains, or revenue impacts."
  },
  stakeholder: {
    name: "Project Stakeholders",
    promptAdjustment: "Balance technical information with practical applications. Highlight project timeline, key milestones, resource requirements, and expected outcomes. Address potential concerns and implementation challenges."
  },
  client: {
    name: "Client Presentation",
    promptAdjustment: "Emphasize delivered value, successful outcomes, and problem-solving. Focus on how solutions addressed specific client needs and overcame challenges. Include measurable benefits and testimonial-style elements."
  }
};

// --- Text Cleaning Utility ---
// Basic function to remove markdown characters for plain text export (like PDF)
// This can be expanded based on observed AI output issues.
const cleanMarkdownForPlainText = (text) => {
    if (!text) return "";
    // Remove bold/italic markers
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');   // Italic
    // Remove headings
    text = text.replace(/^#+\s+/gm, '');
    // Remove list markers (simple version)
    text = text.replace(/^[-*+]\s+/gm, '');
    // Remove horizontal rules
    text = text.replace(/^---+\s*$/gm, '');
    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');
    // Remove code blocks (simple)
    text = text.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove links (keep text)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove images
    text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    // Trim extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n'); // Reduce multiple newlines
    return text.trim();
};


const AICaseStudyGenerator = () => {
    // --- State Variables ---
    const [projectInput, setProjectInput] = useState('');
    const [industryType, setIndustryType] = useLocalStorage('csg_industry', 'construction');
    const [audienceType, setAudienceType] = useLocalStorage('csg_audience', 'technical');
    const [detailLevel, setDetailLevel] = useLocalStorage('csg_detailLevel', 'comprehensive');
    const [includeSections, setIncludeSections] = useLocalStorage('csg_sections', {
        executiveSummary: true, problemStatement: true, technicalAnalysis: true,
        challenges: true, solutions: true, implementation: true,
        results: true, calculations: false, futurePotential: true
    });

    const [generatedCaseStudy, setGeneratedCaseStudy] = useLocalStorage('csg_generatedStudy', null);
    const [followUpHistory, setFollowUpHistory] = useLocalStorage('csg_followUpHistory', []);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 }); // Track progress per section
    const [currentSectionGenerating, setCurrentSectionGenerating] = useState('');
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // --- Gemini API Setup ---
    const genAI = useRef(null);
    useEffect(() => {
        // Initialize API only once
        if (!genAI.current && process.env.REACT_APP_GEMINI_API_KEY) {
            genAI.current = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
        } else if (!process.env.REACT_APP_GEMINI_API_KEY) {
            setError("Gemini API Key is missing. Please configure it in your environment variables.");
        }
    }, []);

    const getModel = useCallback(() => {
        if (!genAI.current) return null;
        const modelName = detailLevel === 'comprehensive' ? "gemini-2.0-flash" : "gemini-1.5-flash-latest"; // Use latest versions
        return genAI.current.getGenerativeModel({ model: modelName });
    }, [detailLevel]);

    // --- Prompt Generation ---
    const getSectionGenerationPrompt = useCallback((sectionKey, projectDesc, contextSections) => {
        const industry = industryTemplates[industryType];
        const audience = audienceProfiles[audienceType];
        const sectionName = formatSectionName(sectionKey);

        let contextText = "";
        if (contextSections && Object.keys(contextSections).length > 0) {
            contextText = "\n\nPREVIOUSLY GENERATED SECTIONS FOR CONTEXT:\n" +
                Object.entries(contextSections)
                    .map(([key, content]) => `## ${formatSectionName(key)}\n${content}`)
                    .join('\n\n');
        }

        return `You are an AI assistant creating one specific section ("${sectionName}") of a larger engineering case study.
        Project Description: ${projectDesc}
        Target Industry: ${industry.name} (${industry.description})
        Target Audience: ${audience.name}

        Your Task: Generate ONLY the content for the "${sectionName}" section.
        ${industry.promptEnhancements}
        ${audience.promptAdjustment}
        ${contextText}

        IMPORTANT INSTRUCTIONS FOR THIS SECTION ("${sectionName}"):
        1. Focus *exclusively* on generating detailed and comprehensive content for the "${sectionName}" section.
        2. Provide in-depth information, analysis, and specifics relevant to this section. Aim for substantial content.
        3. Maintain a professional and technical tone suitable for a ${audience.name}.
        4. Use standard Markdown for formatting (e.g., **bold**, *italics*, lists).
        5. CRITICAL: Do NOT use single asterisks (*) for emphasis or formatting. Only use them for lists or *italic* text. Do NOT output raw asterisks around words.
        6. Do NOT include the section heading (like "## ${sectionName}") in your response. Just provide the body content for this section.
        7. Do NOT add any introductory or concluding phrases about generating the section.`;
    }, [industryType, audienceType, detailLevel]);

    // --- Core Logic: Generation ---
    const handleGenerateStudy = async () => {
        if (!projectInput.trim()) {
            setError("Please provide a project description.");
            return;
        }
        if (!genAI.current) {
            setError("AI Model not initialized. Check API Key.");
            return;
        }

        const model = getModel();
        if (!model) {
            setError("Could not get AI model. Check API Key and configuration.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedCaseStudy(null);
        setFollowUpHistory([]);

        const sectionsToGenerate = Object.entries(includeSections)
            .filter(([, included]) => included)
            .map(([key]) => key);

        setGenerationProgress({ current: 0, total: sectionsToGenerate.length });
        const generatedSections = {};

        try {
            for (let i = 0; i < sectionsToGenerate.length; i++) {
                const sectionKey = sectionsToGenerate[i];
                setCurrentSectionGenerating(formatSectionName(sectionKey));
                setGenerationProgress(prev => ({ ...prev, current: i + 1 }));

                // Provide context from already generated sections for better coherence (optional, can be removed if causing issues)
                const contextForThisSection = { ...generatedSections };

                const prompt = getSectionGenerationPrompt(sectionKey, projectInput, contextForThisSection);
                console.log(`Generating section: ${sectionKey}, Prompt length: ${prompt.length}`); // Debugging

                try {
                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();
                    generatedSections[sectionKey] = responseText.trim(); // Store the raw response
                    console.log(`Generated section: ${sectionKey}, Response length: ${responseText.length}`); // Debugging
                } catch (sectionError) {
                     console.error(`Error generating section ${sectionKey}:`, sectionError);
                     generatedSections[sectionKey] = `Error: Failed to generate content for this section. (${sectionError.message || 'Unknown error'})`;
                     // Optionally: stop generation here or continue with other sections
                     // setError(`Error during generation of section: ${formatSectionName(sectionKey)}`);
                     // break; // Stop generation if one section fails
                }
                 await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between requests if needed
            }

            setGeneratedCaseStudy({
                title: projectInput.substring(0, 70) + (projectInput.length > 70 ? '...' : ''),
                generatedAt: new Date().toISOString(),
                industry: industryType,
                audience: audienceType,
                detailLevel: detailLevel,
                sections: generatedSections // Store the collected sections
            });

        } catch (err) {
            console.error('Error during case study generation process:', err);
            setError(`Failed to generate case study: ${err.message || 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
            setCurrentSectionGenerating('');
            // Keep progress at 100% or reset after a delay
            // setTimeout(() => setGenerationProgress({ current: 0, total: 0 }), 2000);
        }
    };

    // --- Core Logic: Follow-up Chat ---
    const handleFollowUpSubmit = async (question) => {
        if (!generatedCaseStudy || !question.trim() || !genAI.current) return;

        const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Use faster model for chat

        const newUserMessage = { role: 'user', parts: [{ text: question }] };
        // Create the history *for the API call* including the new message
        const currentHistoryForAPI = [...followUpHistory, newUserMessage];

        // Update state immediately for UI responsiveness
        setFollowUpHistory(currentHistoryForAPI);
        setIsGenerating(true); // Reuse loading state
        setError(null);

        try {
            // Construct the context to send to the API
            const contextPrompt = `CONTEXT: The following is an engineering case study. Answer questions based *only* on this context.\n\nCASE STUDY START\nTitle: ${generatedCaseStudy.title}\n\n${Object.entries(generatedCaseStudy.sections).map(([key, content]) => `## ${formatSectionName(key)}\n${content}`).join('\n\n')}\nCASE STUDY END\n\n`;

            // Prepare messages for the Gemini API (needs specific format)
            // The API expects alternating user/model roles.
            const messagesForAPI = [
                 // Start with the context as a user message (or system instruction if supported)
                { role: 'user', parts: [{ text: contextPrompt }] },
                { role: 'model', parts: [{ text: "Okay, I have the case study context. Ask your question." }] },
                // Append the actual chat history
                ...currentHistoryForAPI.map(msg => ({
                    role: msg.role,
                    parts: msg.parts
                }))
            ];


            // Filter out adjacent messages with the same role before sending
            const filteredMessagesForAPI = messagesForAPI.reduce((acc, currentMsg) => {
                if (acc.length === 0 || acc[acc.length - 1].role !== currentMsg.role) {
                    acc.push(currentMsg);
                } else {
                    // If same role, merge parts (simple text merge here)
                    acc[acc.length - 1].parts[0].text += "\n" + currentMsg.parts[0].text;
                }
                return acc;
            }, []);


            console.log("Sending to Follow-up API:", JSON.stringify(filteredMessagesForAPI, null, 2)); // Debugging

            const result = await model.generateContent({ contents: filteredMessagesForAPI });
            const responseText = result.response.text();

            const newAssistantMessage = { role: 'model', parts: [{ text: responseText }] };
            // Update state by adding the assistant response
            setFollowUpHistory(prev => [...prev, newAssistantMessage]);

        } catch (err) {
            console.error('Error in follow-up chat:', err);
            setError(`Failed to get answer: ${err.message || 'Unknown error'}`);
            // Optionally remove the last user message if API failed, or add an error message from the assistant
             const errorAssistantMessage = { role: 'model', parts: [{ text: `Sorry, I encountered an error: ${err.message || 'Unknown error'}` }] };
             setFollowUpHistory(prev => [...prev, errorAssistantMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Utility Functions ---
    const handleClearAll = () => {
        setGeneratedCaseStudy(null);
        setFollowUpHistory([]);
        setProjectInput('');
        setError(null);
        setGenerationProgress({ current: 0, total: 0 });
        localStorage.removeItem('csg_generatedStudy');
        localStorage.removeItem('csg_followUpHistory');
    };

    const exportToPDF = () => {
        if (!generatedCaseStudy) return;
        const doc = new jsPDF();
        // ... (jsPDF setup remains the same) ...
        let y = 20; // Start position

         // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(40, 40, 40);
        const titleLines = doc.splitTextToSize(generatedCaseStudy.title || "Engineering Case Study", 170);
        doc.text(titleLines, 20, y);
        y += titleLines.length * 7 + 8;

        // Metadata
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Industry: ${industryTemplates[generatedCaseStudy.industry]?.name || 'N/A'} | Audience: ${audienceProfiles[generatedCaseStudy.audience]?.name || 'N/A'} | Detail: ${generatedCaseStudy.detailLevel}`, 20, y);
        y += 5;
        doc.text(`Generated: ${new Date(generatedCaseStudy.generatedAt).toLocaleString()}`, 20, y);
        y += 10;


        Object.entries(generatedCaseStudy.sections).forEach(([key, rawContent]) => {
            const sectionTitle = formatSectionName(key);
            // Clean the raw content for PDF export
            const cleanedContent = cleanMarkdownForPlainText(rawContent);

            const titleHeight = 8;
            const contentLinesEstimate = doc.splitTextToSize(cleanedContent || " ", 170).length;
            const contentHeightEstimate = contentLinesEstimate * 5; // Approximate height

            if (y + titleHeight + contentHeightEstimate > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                y = 20; // Reset y on new page
            }

            // Section Header
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(60, 100, 150);
            doc.text(sectionTitle, 20, y);
            y += 8;

            // Section Content (Cleaned)
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(50, 50, 50);
            const contentLines = doc.splitTextToSize(cleanedContent || "(No content generated)", 170);

            contentLines.forEach(line => {
                if (y > doc.internal.pageSize.getHeight() - 20) { // Check before printing each line
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 5; // Line height
            });
            y += 8; // Space after section
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount} | Engineering Hub AI Case Study`, 20, doc.internal.pageSize.getHeight() - 10);
        }

        doc.save(`${generatedCaseStudy.title.replace(/\s+/g, '_')}_Case_Study.pdf`);
    };

    const formatSectionName = (sectionKey) => {
        return sectionKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    };

    // --- JSX Rendering ---
    return (
        <div className="ai-case-study-generator-v2">
            <header className="csg-header">
                <h1><FaBookOpen /> Case Study Generator</h1>
                <div className="header-actions">
                    {generatedCaseStudy && (
                        <button onClick={handleClearAll} className="clear-button" title="Clear current study and start new">
                            <FaBroom /> New Study
                        </button>
                    )}
                    <button
                        className={`settings-toggle-v2 ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings(!showSettings)}
                        title="Customize generation settings"
                    >
                        <FaSlidersH /> Settings
                    </button>
                </div>
            </header>

            {/* Settings Panel (Always available if toggled, or shown initially if no study) */}
            {(showSettings || (!generatedCaseStudy && !isGenerating)) && (
                <CaseStudyInputForm
                    projectInput={projectInput} setProjectInput={setProjectInput}
                    industryType={industryType} setIndustryType={setIndustryType}
                    audienceType={audienceType} setAudienceType={setAudienceType}
                    detailLevel={detailLevel} setDetailLevel={setDetailLevel}
                    includeSections={includeSections} setIncludeSections={setIncludeSections}
                    industryTemplates={industryTemplates} audienceProfiles={audienceProfiles}
                    formatSectionName={formatSectionName}
                    isGenerating={isGenerating && !generatedCaseStudy} // Only show generate button loading if initial gen
                    onGenerate={handleGenerateStudy}
                    generationProgress={isGenerating && !generatedCaseStudy ? generationProgress.current / generationProgress.total * 100 : 0} // Calculate percentage
                    error={error}
                    showOnlySettings={!!generatedCaseStudy && showSettings} // Show settings view if study exists and settings toggled
                    showGenerateButton={!generatedCaseStudy} // Only show generate button if no study exists
                />
            )}

            <main className="csg-main-content">
                {/* Initial Generation Loading State */}
                {isGenerating && !generatedCaseStudy && generationProgress.total > 0 && (
                    <div className="generation-in-progress">
                        <FaRobot className="spinner-icon" />
                        <p>Generating Section {generationProgress.current} of {generationProgress.total}: {currentSectionGenerating}...</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}></div>
                        </div>
                    </div>
                )}

                {/* Results Display and Follow-up Chat */}
                {generatedCaseStudy && (
                    <div className="csg-results-container">
                        <div className="case-study-display-area">
                            <CaseStudyDisplay
                                caseStudy={generatedCaseStudy}
                                formatSectionName={formatSectionName}
                                onExportPDF={exportToPDF}
                            />
                        </div>
                        <div className="follow-up-chat-area">
                            <FollowUpChat
                                history={followUpHistory}
                                onSubmit={handleFollowUpSubmit}
                                isLoading={isGenerating && generatedCaseStudy} // Loading state specific to follow-up
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AICaseStudyGenerator;