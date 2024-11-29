import React from 'react';
import './ConstructionManagementFlashcards.css';


const flashcards = [
    {
        question: "What is the primary goal of construction management?",
        answer: "To ensure that a project is completed on time, within budget, and to the required quality standards."
    },
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
    }
];

const Flashcard = ({ question, answer }) => (
    <div className="flashcard">
        <h3>{question}</h3>
        <p>{answer}</p>
    </div>
);

const ConstructionManagementFlashcards = () => (
    <div>
        <h1>Construction Management Flashcards</h1>
        {flashcards.map((card, index) => (
            <Flashcard key={index} question={card.question} answer={card.answer} />
        ))}
    </div>
);

export default ConstructionManagementFlashcards;