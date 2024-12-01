const flashcards = [
    {
        question: "What are the key phases of a construction project?",
        answer: "Initiation, Planning, Execution, Monitoring and Controlling, and Closing."
    },
    {
        question: "What is a Gantt chart?",
        answer: "A Gantt chart is a type of bar chart that represents a project schedule, showing the start and finish dates of the various elements of a project."
    },
    {
        question: "What is the critical path method (CPM)?",
        answer: "CPM is a project modeling technique used to estimate the duration of a project by identifying the longest sequence of dependent tasks."
    },
    {
        question: "What is a change order?",
        answer: "A change order is a document used to record an amendment to the original construction contract, often involving changes in scope, cost, or schedule."
    },
    {
        question: "What is a project charter?",
        answer: "A project charter is a formal document that authorizes the project and provides a high-level overview of its objectives, scope, and stakeholders."
    },
    {
        question: "What is a work breakdown structure (WBS)?",
        answer: "A WBS is a hierarchical decomposition of the total scope of work to accomplish the project objectives and create the deliverables."
    },
    {
        question: "What is earned value management (EVM)?",
        answer: "EVM is a project management technique that integrates scope, time, and cost data to assess project performance and progress."
    },
    {
        question: "What is a project baseline?",
        answer: "A project baseline is the original approved plan for the project, including scope, schedule, and cost, against which performance is measured."
    },
    {
        question: "What is risk management?",
        answer: "Risk management is the process of identifying, assessing, and controlling risks that could potentially affect the project's success."
    },
    {
        question: "What is a stakeholder?",
        answer: "A stakeholder is any individual, group, or organization that can affect or be affected by the project's outcomes."
    },
    {
        question: "What is project scope?",
        answer: "Project scope defines the boundaries of the project, including what is included and what is excluded from the project."
    },
    {
        question: "What is a project schedule?",
        answer: "A project schedule is a timeline that outlines the start and finish dates of project tasks and milestones."
    },
    {
        question: "What is cost estimation?",
        answer: "Cost estimation is the process of predicting the costs of the resources needed to complete the project."
    },
    {
        question: "What is a project budget?",
        answer: "A project budget is the total amount of money allocated for the project, including all estimated costs."
    },
    {
        question: "What is quality management?",
        answer: "Quality management is the process of ensuring that the project's deliverables meet the required standards and specifications."
    },
    {
        question: "What is a project milestone?",
        answer: "A project milestone is a significant point or event in the project timeline that marks the completion of a major phase or deliverable."
    },
    {
        question: "What is a project deliverable?",
        answer: "A project deliverable is any tangible or intangible output produced as a result of project activities."
    },
    {
        question: "What is a project manager?",
        answer: "A project manager is the person responsible for planning, executing, and closing the project, ensuring it meets its objectives."
    },
    {
        question: "What is a project sponsor?",
        answer: "A project sponsor is a senior executive who provides resources and support for the project and is accountable for its success."
    },
    {
        question: "What is a project team?",
        answer: "A project team is a group of individuals with diverse skills and expertise who work together to achieve the project objectives."
    },
    {
        question: "What is project procurement management?",
        answer: "Project procurement management involves acquiring goods and services from external sources to complete the project."
    },
    {
        question: "What is a contract?",
        answer: "A contract is a legally binding agreement between two or more parties that outlines the terms and conditions of their relationship."
    },
    {
        question: "What is a project risk?",
        answer: "A project risk is an uncertain event or condition that, if it occurs, could have a positive or negative impact on the project's objectives."
    },
    {
        question: "What is a project issue?",
        answer: "A project issue is a problem or obstacle that has already occurred and needs to be addressed to keep the project on track."
    },
    {
        question: "What is a project assumption?",
        answer: "A project assumption is a factor that is considered to be true, real, or certain for planning purposes, without proof or demonstration."
    },
    {
        question: "What is a project constraint?",
        answer: "A project constraint is a limitation or restriction that affects the project's scope, schedule, or cost."
    },
    {
        question: "What is project integration management?",
        answer: "Project integration management involves coordinating all aspects of the project to ensure that it works as a unified whole."
    },
    {
        question: "What is a project management plan?",
        answer: "A project management plan is a formal document that defines how the project will be executed, monitored, and controlled."
    },
    {
        question: "What is a project phase?",
        answer: "A project phase is a distinct stage in the project lifecycle, marked by the completion of one or more deliverables."
    },
    {
        question: "What is project scope creep?",
        answer: "Project scope creep refers to the uncontrolled expansion of project scope without adjustments to time, cost, and resources."
    }
];

const Flashcard = ({ question, answer }) => (
    <div className="flashcard">
        <h3>{question}</h3>
        <p>{answer}</p>
    </div>
);

const ConstructionManagementFlashcards = () => (
    <div className="flashcards-container">
        {flashcards.map((flashcard, index) => (
            <Flashcard key={index} {...flashcard} />
        ))}
    </div>
);

export default ConstructionManagementFlashcards;