import React from 'react';
import './EnvironmentalEngineeringSummaryNotes.css'; // Import the CSS file for styling

const EnvironmentalEngineeringSummaryNotes = () => {
  return (
    <div className="environmental-engineering-summary-notes">
      <h1>Environmental Engineering Summary Notes</h1>
      <p>Summarized notes covering the essential topics in environmental engineering.</p>

      <section className="notes-section">
        <h2>1. Introduction to Environmental Engineering</h2>
        <p>
          Environmental Engineering is a branch of engineering focused on protecting the environment by reducing waste and pollution. It combines principles from chemistry, biology, and engineering to develop solutions for environmental challenges.
        </p>
      </section>

      <section className="notes-section">
        <h2>2. Water and Wastewater Treatment</h2>
        <p>
          Water treatment involves processes to make water suitable for its intended use, while wastewater treatment removes contaminants from used water before it is released back into the environment.
        </p>
        <h3>Key Processes:</h3>
        <ul>
          <li>Coagulation and Flocculation</li>
          <li>Filtration</li>
          <li>Disinfection</li>
          <li>Activated Sludge Process</li>
          <li>Trickling Filters</li>
        </ul>
        <h3>Formulas:</h3>
        <p><strong>Flow Rate (Q):</strong> Q = A * v</p>
        <p><strong>Detention Time (t):</strong> t = V / Q</p>
      </section>

      <section className="notes-section">
        <h2>3. Air Pollution Control</h2>
        <p>
          Air pollution control involves techniques to reduce or eliminate the emission of pollutants into the atmosphere.
        </p>
        <h3>Key Techniques:</h3>
        <ul>
          <li>Electrostatic Precipitators</li>
          <li>Scrubbers</li>
          <li>Filters</li>
          <li>Catalytic Converters</li>
        </ul>
        <h3>Formulas:</h3>
        <p><strong>Ideal Gas Law:</strong> PV = nRT</p>
        <p><strong>Emission Rate (E):</strong> E = Q * C</p>
      </section>

      <section className="notes-section">
        <h2>4. Solid Waste Management</h2>
        <p>
          Solid waste management involves the collection, treatment, and disposal of solid waste materials.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li>Waste Hierarchy: Reduce, Reuse, Recycle</li>
          <li>Landfills</li>
          <li>Composting</li>
          <li>Incineration</li>
        </ul>
        <h3>Formulas:</h3>
        <p><strong>Waste Generation Rate (W):</strong> W = P * G</p>
        <p><strong>Landfill Volume (V):</strong> V = W / D</p>
      </section>

      <section className="notes-section">
        <h2>5. Environmental Impact Assessment (EIA)</h2>
        <p>
          Environmental Impact Assessment (EIA) is a process used to evaluate the environmental effects of a proposed project or development.
        </p>
        <h3>Key Steps:</h3>
        <ul>
          <li>Screening</li>
          <li>Scoping</li>
          <li>Impact Analysis</li>
          <li>Mitigation</li>
          <li>Reporting</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>6. Noise Pollution Control</h2>
        <p>
          Noise pollution control involves measures to reduce noise levels in the environment.
        </p>
        <h3>Key Techniques:</h3>
        <ul>
          <li>Sound Insulation</li>
          <li>Sound Absorption</li>
          <li>Noise Barriers</li>
          <li>Regulations and Standards</li>
        </ul>
        <h3>Formulas:</h3>
        <p><strong>Sound Pressure Level (SPL):</strong> SPL = 20 * log10(P / P0)</p>
      </section>

      <section className="notes-section">
        <h2>7. Sustainable Development</h2>
        <p>
          Sustainable development involves meeting the needs of the present without compromising the ability of future generations to meet their own needs.
        </p>
        <h3>Key Principles:</h3>
        <ul>
          <li>Environmental Protection</li>
          <li>Economic Growth</li>
          <li>Social Equity</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>8. Climate Change and Mitigation</h2>
        <p>
          Climate change refers to long-term changes in temperature, precipitation, and other atmospheric conditions. Mitigation involves efforts to reduce or prevent the emission of greenhouse gases.
        </p>
        <h3>Key Strategies:</h3>
        <ul>
          <li>Renewable Energy</li>
          <li>Energy Efficiency</li>
          <li>Carbon Sequestration</li>
          <li>Afforestation</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>9. Environmental Laws and Regulations</h2>
        <p>
          Environmental laws and regulations are designed to protect the environment and public health by controlling pollution and managing natural resources.
        </p>
        <h3>Key Acts:</h3>
        <ul>
          <li>Clean Air Act</li>
          <li>Clean Water Act</li>
          <li>Resource Conservation and Recovery Act (RCRA)</li>
          <li>Comprehensive Environmental Response, Compensation, and Liability Act (CERCLA)</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>10. Renewable Energy Sources</h2>
        <p>
          Renewable energy sources are those that can be replenished naturally, such as solar, wind, hydro, and geothermal energy.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li>Solar Panels</li>
          <li>Wind Turbines</li>
          <li>Hydroelectric Dams</li>
          <li>Geothermal Plants</li>
        </ul>
      </section>
    </div>
  );
};

export default EnvironmentalEngineeringSummaryNotes;