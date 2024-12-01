import React from 'react';
import './FluidMechanicsSummaryNotes.css';

const FluidMechanicsSummaryNotes = () => {
  return (
    <div className="fluid-mechanics-summary-notes">
      <h1>Fluid Mechanics Summary Notes</h1>
      <p>Summarized notes covering the essential topics in fluid mechanics.</p>

      <section className="notes-section">
        <h2>1. Introduction to Fluid Mechanics</h2>
        <p>
          Fluid mechanics is the study of fluids (liquids and gases) and the forces acting on them. It is divided into fluid statics (study of fluids at rest) and fluid dynamics (study of fluids in motion).
        </p>
      </section>

      <section className="notes-section">
        <h2>2. Properties of Fluids</h2>
        <p>
          Understanding the properties of fluids is essential for analyzing fluid behavior.
        </p>
        <h3>Key Properties:</h3>
        <ul>
          <li><strong>Density (ρ):</strong> Mass per unit volume of a fluid. ρ = m/V</li>
          <li><strong>Viscosity (μ):</strong> Measure of a fluid's resistance to deformation. Dynamic viscosity (μ) and kinematic viscosity (ν = μ/ρ).</li>
          <li><strong>Surface Tension (σ):</strong> The force per unit length acting along the surface of a fluid.</li>
          <li><strong>Compressibility:</strong> Measure of the change in volume of a fluid under pressure.</li>
          <li><strong>Specific Gravity (SG):</strong> Ratio of the density of a fluid to the density of a reference substance (usually water).</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>3. Fluid Statics</h2>
        <p>
          Fluid statics is the study of fluids at rest. It involves analyzing the forces and pressures in a stationary fluid.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Pressure (P):</strong> Force per unit area. P = F/A</li>
          <li><strong>Pascal's Law:</strong> Pressure applied to a confined fluid is transmitted undiminished throughout the fluid.</li>
          <li><strong>Hydrostatic Pressure:</strong> Pressure due to the weight of a fluid column. P = ρgh</li>
          <li><strong>Buoyancy:</strong> Upward force exerted by a fluid on a submerged or floating object. Archimedes' principle: Buoyant force = weight of displaced fluid.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>4. Fluid Dynamics</h2>
        <p>
          Fluid dynamics is the study of fluids in motion. It involves analyzing the velocity, pressure, and flow patterns of moving fluids.
        </p>
        <h3>Key Equations:</h3>
        <ul>
          <li><strong>Continuity Equation:</strong> Conservation of mass in a fluid flow. A₁v₁ = A₂v₂</li>
          <li><strong>Bernoulli's Equation:</strong> Conservation of energy in a fluid flow. P + 0.5ρv² + ρgh = constant</li>
          <li><strong>Navier-Stokes Equations:</strong> Governing equations for fluid motion, accounting for viscosity.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>5. Flow Measurement</h2>
        <p>
          Flow measurement involves determining the flow rate or quantity of a fluid moving through a system.
        </p>
        <h3>Key Devices:</h3>
        <ul>
          <li><strong>Orifice Meter:</strong> Measures flow rate using a constriction in the flow path.</li>
          <li><strong>Venturi Meter:</strong> Measures flow rate by reducing the cross-sectional area of the flow path.</li>
          <li><strong>Pitot Tube:</strong> Measures fluid flow velocity by converting kinetic energy into potential energy.</li>
          <li><strong>Rotameter:</strong> Measures flow rate using a float in a tapered tube.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>6. Dimensional Analysis and Similarity</h2>
        <p>
          Dimensional analysis is a mathematical technique used to analyze the relationships between physical quantities by identifying their fundamental dimensions.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Dimensionless Numbers:</strong> Ratios of physical quantities that characterize fluid flow. Examples include Reynolds number (Re), Froude number (Fr), and Mach number (Ma).</li>
          <li><strong>Reynolds Number (Re):</strong> Ratio of inertial forces to viscous forces. Re = ρvL/μ</li>
          <li><strong>Froude Number (Fr):</strong> Ratio of inertial forces to gravitational forces. Fr = v/√(gL)</li>
          <li><strong>Mach Number (Ma):</strong> Ratio of fluid velocity to the speed of sound. Ma = v/c</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>7. Laminar and Turbulent Flow</h2>
        <p>
          Fluid flow can be classified as laminar or turbulent based on the Reynolds number.
        </p>
        <h3>Key Characteristics:</h3>
        <ul>
          <li><strong>Laminar Flow:</strong> Smooth, orderly flow with parallel streamlines. Occurs at low Reynolds numbers (Re &lt; 2000).</li>
          <li><strong>Turbulent Flow:</strong> Chaotic, irregular flow with mixing. Occurs at high Reynolds numbers (Re &lt; 4000).</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>8. Boundary Layer Theory</h2>
        <p>
          The boundary layer is the thin region of fluid near a solid surface where viscous effects are significant.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Boundary Layer Thickness (δ):</strong> Distance from the solid surface to the point where the flow velocity reaches 99% of the free stream velocity.</li>
          <li><strong>Laminar Boundary Layer:</strong> Smooth, orderly flow near the surface.</li>
          <li><strong>Turbulent Boundary Layer:</strong> Chaotic, irregular flow near the surface.</li>
          <li><strong>Separation Point:</strong> Point where the boundary layer detaches from the surface.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>9. Pipe Flow</h2>
        <p>
          Pipe flow involves the study of fluid flow through pipes, including pressure losses and flow rates.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Darcy-Weisbach Equation:</strong> Calculates pressure loss due to friction in a pipe. ΔP = f (L/D) (ρv²/2)</li>
          <li><strong>Hazen-Williams Equation:</strong> Empirical formula for calculating pressure loss in water pipes. v = k C R^0.63 S^0.54</li>
          <li><strong>Moody Chart:</strong> Graphical representation of the Darcy-Weisbach friction factor as a function of Reynolds number and relative roughness.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>10. Open Channel Flow</h2>
        <p>
          Open channel flow involves the study of fluid flow with a free surface, such as in rivers and canals.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Manning's Equation:</strong> Empirical formula for calculating flow rate in open channels. Q = (1/n) A R^(2/3) S^(1/2)</li>
          <li><strong>Specific Energy:</strong> Total energy per unit weight of fluid. E = y + v²/2g</li>
          <li><strong>Critical Flow:</strong> Flow condition where the specific energy is minimized for a given discharge.</li>
        </ul>
      </section>
    </div>
  );
};

export default FluidMechanicsSummaryNotes;