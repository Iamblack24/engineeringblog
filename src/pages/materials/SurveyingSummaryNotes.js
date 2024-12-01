import React from 'react';
import './SurveyingSummaryNotes.css';

const SurveyingSummaryNotes = () => {
  return (
    <div className="surveying-summary-notes">
      <h1>Surveying Summary Notes</h1>
      <p>Summarized notes covering the essential topics in surveying.</p>

      <section className="notes-section">
        <h2>1. Introduction to Surveying</h2>
        <p>
          Surveying is the science and art of determining the relative positions of points on, above, or below the Earth's surface and representing them in a usable form, such as maps, plans, or charts.
        </p>
      </section>

      <section className="notes-section">
        <h2>2. Types of Surveying</h2>
        <p>
          Surveying can be classified based on the purpose, method, and instruments used.
        </p>
        <h3>Key Types:</h3>
        <ul>
          <li><strong>Geodetic Surveying:</strong> Large-scale surveys that take the Earth's curvature into account.</li>
          <li><strong>Plane Surveying:</strong> Small-scale surveys that assume the Earth's surface is flat.</li>
          <li><strong>Topographic Surveying:</strong> Surveys that determine the configuration of the Earth's surface and locate natural and man-made features.</li>
          <li><strong>Cadastral Surveying:</strong> Surveys that establish property boundaries and land ownership.</li>
          <li><strong>Engineering Surveying:</strong> Surveys that provide data for the design and construction of infrastructure projects.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>3. Surveying Instruments</h2>
        <p>
          Various instruments are used in surveying to measure distances, angles, and elevations.
        </p>
        <h3>Key Instruments:</h3>
        <ul>
          <li><strong>Theodolite:</strong> Measures horizontal and vertical angles.</li>
          <li><strong>Total Station:</strong> Combines electronic distance measurement and angle measurement.</li>
          <li><strong>Level:</strong> Measures height differences and establishes horizontal planes.</li>
          <li><strong>GPS (Global Positioning System):</strong> Provides precise location data using satellites.</li>
          <li><strong>EDM (Electronic Distance Measurement):</strong> Measures distances using electromagnetic waves.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>4. Surveying Methods</h2>
        <p>
          Different methods are used in surveying to collect data and determine positions.
        </p>
        <h3>Key Methods:</h3>
        <ul>
          <li><strong>Triangulation:</strong> Determines positions using a network of triangles.</li>
          <li><strong>Traversing:</strong> Establishes control points by measuring distances and angles along a path.</li>
          <li><strong>Leveling:</strong> Determines height differences between points.</li>
          <li><strong>GPS Surveying:</strong> Uses satellite signals to determine precise positions.</li>
          <li><strong>Photogrammetry:</strong> Uses photographs to measure and map features.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>5. Data Processing</h2>
        <p>
          Collected data is processed to create maps, plans, and charts that are used in various engineering applications.
        </p>
      </section>

      <section className="notes-section">
        <h2>6. Applications of Surveying</h2>
        <ul>
          <li>Construction Planning</li>
          <li>Land Development</li>
          <li>Mining Operations</li>
          <li>Environmental Studies</li>
          <li>Transportation Planning</li>
          <li>Urban Planning</li>
          <li>Hydrographic Surveying</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>7. Surveying Software</h2>
        <p>
          Modern surveying relies heavily on software for data collection, processing, and visualization. Popular software includes AutoCAD, ArcGIS, and Leica Geo Office.
        </p>
      </section>

      <section className="notes-section">
        <h2>8. Surveying Formulas</h2>
        <h3>Key Formulas:</h3>
        <ul>
          <li><strong>Distance (D):</strong> D = √((x2 - x1)² + (y2 - y1)²)</li>
          <li><strong>Area of a Triangle:</strong> A = 0.5 * base * height</li>
          <li><strong>Height Difference (Δh):</strong> Δh = H1 - H2</li>
          <li><strong>Angle Measurement:</strong> θ = tan⁻¹((y2 - y1) / (x2 - x1))</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>9. Surveying Errors and Adjustments</h2>
        <p>
          Surveying measurements are subject to errors, which can be systematic, random, or gross. Adjustments are made to minimize these errors.
        </p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Systematic Errors:</strong> Predictable and consistent errors that can be corrected.</li>
          <li><strong>Random Errors:</strong> Unpredictable errors that vary in magnitude and direction.</li>
          <li><strong>Gross Errors:</strong> Significant mistakes caused by human error or equipment malfunction.</li>
          <li><strong>Least Squares Adjustment:</strong> A mathematical method used to minimize the sum of the squares of the errors.</li>
        </ul>
      </section>

      <section className="notes-section">
        <h2>10. Safety in Surveying</h2>
        <p>
          Safety is a critical aspect of surveying, especially when working in hazardous environments or near construction sites.
        </p>
        <h3>Key Safety Practices:</h3>
        <ul>
          <li>Wear appropriate personal protective equipment (PPE).</li>
          <li>Be aware of your surroundings and potential hazards.</li>
          <li>Follow safety protocols and guidelines.</li>
          <li>Use equipment properly and maintain it regularly.</li>
          <li>Communicate effectively with team members.</li>
        </ul>
      </section>
    </div>
  );
};

export default SurveyingSummaryNotes;