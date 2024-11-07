import React from 'react';
import './HydraulicsSummaryNotes.css'; // Import the CSS file for styling

const HydraulicsSummaryNotes = () => {
  return (
    <div className="hydraulics-summary-notes">
      <h1>Hydraulics Summary Notes</h1>
      <p>Comprehensive notes covering the fundamental topics in hydraulics.</p>

      <section className="notes-section">
        <h2>1. Introduction to Hydraulics</h2>
        <p>
          Hydraulics is a branch of engineering concerned with the mechanical properties of liquids. It deals with the behavior of fluids (liquids and gases) under various conditions and the forces they exert on surrounding structures.
        </p>
      </section>

      <section className="notes-section">
        <h2>2. Fluid Properties</h2>
        <ul>
          <li><strong>Density (ρ):</strong> Mass per unit volume of a fluid. Measured in kg/m³.</li>
          <li><strong>Viscosity (μ):</strong> Measure of a fluid's resistance to flow. Measured in Pa·s.</li>
          <li><strong>Pressure (P):</strong> Force exerted per unit area by the fluid. Measured in Pascals (Pa).</li>
          <li><strong>Temperature (T):</strong> Affects fluid properties like viscosity and density.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>3. Bernoulli's Equation</h2>
        <p>
          Bernoulli's Equation describes the conservation of energy in flowing fluids. It is expressed as:
        </p>
        <pre>
          P + ½ρv² + ρgh = constant
        </pre>
        <p>
          Where:
        </p>
        <ul>
          <li><strong>P:</strong> Fluid pressure</li>
          <li><strong>ρ:</strong> Fluid density</li>
          <li><strong>v:</strong> Flow velocity</li>
          <li><strong>g:</strong> Acceleration due to gravity</li>
          <li><strong>h:</strong> Height above a reference point</li>
        </ul>
        <p>
          This equation implies that an increase in the speed of the fluid occurs simultaneously with a decrease in pressure or a decrease in the fluid's potential energy.
        </p>
      </section>

      <section className="notes-section">
        <h2>4. Continuity Equation</h2>
        <p>
          The Continuity Equation ensures the conservation of mass in fluid flow. It is given by:
        </p>
        <pre>
          A₁v₁ = A₂v₂
        </pre>
        <p>
          Where:
        </p>
        <ul>
          <li><strong>A₁, A₂:</strong> Cross-sectional areas at points 1 and 2</li>
          <li><strong>v₁, v₂:</strong> Flow velocities at points 1 and 2</li>
        </ul>
        <p>
          This implies that the product of cross-sectional area and flow velocity remains constant along the flow.
        </p>
      </section>

      <section className="notes-section">
        <h2>5. Flow Types</h2>
        <ul>
          <li><strong>Laminar Flow:</strong> Smooth and orderly flow, typically at lower velocities. Characterized by Reynolds number (Re) &lt; 2000.</li>
          <li><strong>Turbulent Flow:</strong> Chaotic and irregular flow, usually at higher velocities. Characterized by Reynolds number (Re) &gt; 4000.</li>
          <li><strong>Transitional Flow:</strong> Flow regime between laminar and turbulent, where Re is between 2000 and 4000.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>6. Pumps and Turbines</h2>
        <p>
          <strong>Pumps:</strong> Devices that add energy to fluids, increasing their pressure and flow rate. Common types include centrifugal pumps and positive displacement pumps.
        </p>
        <p>
          <strong>Turbines:</strong> Devices that extract energy from flowing fluids to perform work, such as generating electricity. Common types include reaction turbines and impulse turbines.
        </p>
      </section>

      <section className="notes-section">
        <h2>7. Open Channel Flow</h2>
        <p>
          Refers to the flow of liquid with a free surface, such as in rivers, canals, and spillways. Key concepts include:
        </p>
        <ul>
          <li><strong>Flow Rate (Q):</strong> Volume of fluid passing a point per unit time.</li>
          <li><strong>Hydraulic Radius (R):</strong> Ratio of cross-sectional area to wetted perimeter.</li>
          <li><strong>Shear Stress:</strong> Stress exerted by fluid flow on channel boundaries.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>8. Pipe Flow Analysis</h2>
        <p>
          Analyzes the flow of fluids within confined conduits like pipes. Key equations include:
        </p>
        <ul>
          <li><strong>Darcy-Weisbach Equation:</strong> Calculates head loss due to friction.
            <pre>
              h_f = f * (L/D) * (v²/(2g))
            </pre>
          </li>
          <li><strong>Hazen-Williams Equation:</strong> Empirical equation for head loss in water pipes.
            <pre>
              h_f = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
            </pre>
          </li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>9. Hydraulic Structures</h2>
        <p>
          Structures designed to manage water flow and storage. Common hydraulic structures include:
        </p>
        <ul>
          <li><strong>Dams:</strong> Barriers that block water flow to create reservoirs.</li>
          <li><strong>Spillways:</strong> Channels to safely pass surplus water from dams.</li>
          <li><strong>Lock Systems:</strong> Mechanisms that raise and lower boats between stretches of water.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>10. Hydraulic Machines</h2>
        <p>
          Machines that convert energy between mechanical and hydraulic forms. Examples include hydraulic presses, mixers, and excavators.
        </p>
      </section>

      <section className="notes-section">
        <h2>11. Hydraulic Circuits</h2>
        <p>
          Networks of hydraulic components that manage the flow and pressure of fluids to perform specific functions. Components include pumps, actuators, valves, and reservoirs.
        </p>
      </section>

      <section className="notes-section">
        <h2>12. Fluid Dynamics in Transportation</h2>
        <p>
          Applies fluid dynamics principles to transportation systems, such as aerodynamics of vehicles, design of water transport systems, and management of stormwater in urban areas.
        </p>
      </section>
    </div>
  );
};

export default HydraulicsSummaryNotes;