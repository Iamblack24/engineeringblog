// src/pages/CaseStudiesPage.js
import React from 'react';
import CaseStudyCard from '../components/CaseStudyCard';
import AICaseStudyGenerator from '../components/AICaseStudyGenerator';
import './CaseStudiesPage.css';

const caseStudies = [
  {
    id: 1,
    title: "The Burj Khalifa: Engineering Marvel",
    description: "An in-depth look at the engineering challenges and solutions behind the world's tallest building.",
    image: "/burj.jpg",
    content: "### Overview\n\nThe **Burj Khalifa** in Dubai stands at an astounding 828 meters, making it the tallest building in the world. This case study explores the innovative engineering techniques used to overcome challenges related to height, wind forces, and construction logistics.\n\n### Key Engineering Aspects\n\n*   **Structural System:** A buttressed core system was employed, providing high torsional stiffness. The Y-shaped plan helps to reduce wind forces and allows for diverse floor plans.\n*   **Wind Engineering:** Extensive wind tunnel testing was conducted to optimize the building's shape and minimize wind-induced motion. The tapering design and setbacks disrupt wind vortices.\n*   **Foundation:** A massive reinforced concrete raft foundation supported by 192 bored piles extending to a depth of over 50 meters.\n*   **Materials:** High-strength concrete was developed specifically for the project to withstand the immense pressures at lower levels. The facade consists of reflective glazing with aluminum and textured stainless steel spandrel panels."
  },
  {
    id: 2,
    title: "The Panama Canal Expansion",
    description: "Exploring the engineering feats and innovations involved in the expansion of the Panama Canal.",
    image: "/panama.jpg",
    content: "### Overview\n\nThe **Panama Canal Expansion** project, completed in 2016, aimed to double the canal's capacity by adding a new lane for larger Post-Panamax ships. This involved constructing new, larger locks, excavating new access channels, and deepening and widening existing ones.\n\n### Engineering Challenges & Solutions\n\n*   **New Locks (Agua Clara and Cocoli):** These are significantly larger than the original locks and utilize water-saving basins to reduce water consumption by up to 60% per transit. Rolling gates were used instead of miter gates for efficiency and maintenance.\n*   **Dredging and Excavation:** Millions of cubic meters of material were dredged and excavated to create the new Pacific Access Channel and to widen and deepen existing navigational channels like the Culebra Cut.\n*   **Seismic Considerations:** The design of the new locks had to account for the seismic activity in the region, incorporating robust structural designs.\n*   **Environmental Impact:** Measures were taken to mitigate environmental impact, including reforestation projects and wildlife rescue programs."
  },
  {
    id: 3,
    title: "The Channel Tunnel: Connecting Nations",
    description: "A comprehensive study of the engineering behind the Channel Tunnel, connecting the UK and France.",
    image: "/channel.jpeg",
    content: "### Overview\n\nThe **Channel Tunnel**, also known as the Chunnel, is a 50.45-kilometer rail tunnel linking Folkestone, Kent, in the United Kingdom, with Coquelles, Pas-de-Calais, near Calais in northern France. It is one of the longest underwater tunnels in the world, with 37.9 km of its length under the English Channel.\n\n### Construction & Engineering Highlights\n\n*   **Tunnel Boring Machines (TBMs):** Eleven TBMs were used for excavation, specially designed to handle the chalk marl geology. The project consisted of two main rail tunnels and a smaller central service tunnel.\n*   **Safety Systems:** The service tunnel provides access for maintenance and emergency evacuation. Cross-passages link the service tunnel to the main tunnels at regular intervals. Advanced ventilation and fire suppression systems are in place.\n*   **Logistics:** Managing the removal of spoil and the supply of construction materials was a major logistical challenge.\n*   **Geotechnical Investigations:** Extensive geological surveys were crucial to determine the best route and to anticipate ground conditions."
  },
  {
    id: 4,
    title: "The Three Gorges Dam: Hydroelectric Powerhouse",
    description: "An analysis of the engineering and environmental impact of the Three Gorges Dam in China.",
    image: "/gorges.jpeg",
    content: "### Overview\n\nThe **Three Gorges Dam** on the Yangtze River in China is the world's largest hydroelectric power station by total capacity (22,500 MW). Its construction aimed to provide flood control, generate clean energy, and improve navigation.\n\n### Engineering & Scale\n\n*   **Dam Structure:** A concrete gravity dam, 2,335 meters long and 185 meters high. It required immense quantities of concrete and steel.\n*   **Turbines and Generators:** Equipped with 32 main Francis turbines, each with a capacity of 700 MW, and two smaller 50 MW generators.\n*   **Ship Lift & Locks:** Features a five-stage ship lock system to allow vessels to pass, and a ship lift capable of lifting vessels up to 3,000 tons.\n*   **Flood Control:** One of the primary objectives, designed to protect millions of people downstream from devastating floods.\n\n### Environmental & Social Impact\n\nThe project involved significant environmental changes and the relocation of over a million people, leading to considerable debate and ongoing monitoring."
  },
  {
    id: 5,
    title: "The Millau Viaduct: A Sky-High Bridge",
    description: "Exploring the engineering behind the world's tallest bridge, the Millau Viaduct in France.",
    image: "/millau.jpeg",
    content: "### Overview\n\nThe **Millau Viaduct** in Southern France is a cable-stayed bridge that spans the valley of the River Tarn. With one of its masts reaching 343 meters, it is the tallest bridge in the world, surpassing the Eiffel Tower in height.\n\n### Design & Construction Innovations\n\n*   **Cable-Stayed Design:** The bridge deck is supported by seven slender pylons and an array of cables, creating an elegant and lightweight appearance.\n*   **Launching Technique:** The steel deck was assembled on land and then incrementally launched across the piers, a complex engineering feat.\n*   **High-Performance Materials:** Utilized high-strength steel for the deck and pylons, and advanced concrete for the piers.\n*   **Wind Engineering:** Designed to withstand high winds common in the Tarn valley, with aerodynamic shaping of the deck and specific mast design.\n*   **Minimal Environmental Footprint:** The design aimed to touch the ground at only seven points, minimizing its impact on the valley below."
  }
];

const CaseStudiesPage = () => {
  return (
    <div className="case-studies-page">
      <h1>Case Studies</h1>
      
      {/* AI Case Study Generator Section */}
      <div className="ai-generator-section">
        <AICaseStudyGenerator />
      </div>

      {/* Existing Case Studies Section */}
      <h2>Featured Case Studies</h2>
      <div className="case-studies-container">
        {caseStudies.map((caseStudy) => (
          <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
};

export default CaseStudiesPage;

// Exporting caseStudies for use in other components
export { caseStudies };
