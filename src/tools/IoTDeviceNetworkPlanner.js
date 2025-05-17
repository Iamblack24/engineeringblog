import React, { useState } from 'react';
import './IoTDeviceNetworkPlanner.css';

const IoTDeviceNetworkPlanner = () => {
  // State variables with realistic default values
  const [technology, setTechnology] = useState('LoRaWAN');
  const [areaLength, setAreaLength] = useState(1000); // Area length in meters
  const [areaWidth, setAreaWidth] = useState(1000); // Area width in meters
  const [numDevices, setNumDevices] = useState(100); // Number of IoT devices
  const [terrain, setTerrain] = useState('urban'); // Terrain type
  
  // LoRaWAN specific
  const [spreadingFactor, setSpreadingFactor] = useState(7); // LoRaWAN SF (7-12)
  const [loraBandwidth, setLoraBandwidth] = useState(125); // kHz
  const [loraCodingRate, setLoraCodingRate] = useState('4/5');
  const [loraPayloadSize, setLoraPayloadSize] = useState(16); // bytes
  const [loraPreambleSymbols, setLoraPreambleSymbols] = useState(8);

  const [txPower, setTxPower] = useState(14); // Transmit power in dBm
  const [interferenceLevel, setInterferenceLevel] = useState('low'); // Interference: low, medium, high
  const [result, setResult] = useState(null);

  const getPathLossExponent = () => {
    if (terrain === 'urban') return 3.5;
    if (terrain === 'suburban') return 3.0;
    if (terrain === 'rural') return 2.5;
    return 3.0; // Default
  };

  const estimateReceiverSensitivity = () => {
    if (technology === 'LoRaWAN') {
      let baseSensitivity = -123; // SF7, 125kHz
      const sfSensitivityDelta = { 7: 0, 8: -3, 9: -6, 10: -9, 11: -11.5, 12: -14 }; // dB relative to SF7 is MORE sensitive
      baseSensitivity += sfSensitivityDelta[spreadingFactor] || 0;
      
      if (loraBandwidth === 250) baseSensitivity += 3; // Less sensitive
      if (loraBandwidth === 500) baseSensitivity += 6; // Even less sensitive
      // Coding rate has minor impact on sensitivity, often included in base figures.
      return baseSensitivity;
    } else if (technology === 'Zigbee') {
      return -95; // Typical dBm
    } else if (technology === 'NB-IoT') {
      return -135; // Typical for good gateway, considering some CE level
    }
    return -100; // Default
  };

  // Coverage estimation based on technology and terrain
  const estimateCoverageRadius = () => {
    let baseRadiusMeters;
    const pathLossExponent = getPathLossExponent();
    const interferenceRangeFactor = { low: 1.0, medium: 0.85, high: 0.7 }[interferenceLevel];

    if (technology === 'LoRaWAN') {
      // Base for SF7, 125kHz, 14dBm Tx, Urban (gamma=3.5) -> ~1.5-2km
      // Let's use a reference path loss budget approach
      const refTxPower = 14; // dBm
      const refSensitivity = -123; // dBm (SF7, 125kHz)
      const refMaxPathLoss = refTxPower - refSensitivity; // 137 dB
      const refUrbanRadiusSF7 = 1500; // meters for 137dB MAPL in urban (gamma 3.5)

      const currentSensitivity = estimateReceiverSensitivity();
      const currentMaxPathLoss = txPower - currentSensitivity; // Assumes 0 antenna gains for simplicity

      // Range scales with 10^(Delta_MAPL / (10 * gamma))
      const radius = refUrbanRadiusSF7 * Math.pow(10, (currentMaxPathLoss - refMaxPathLoss) / (10 * pathLossExponent));
      
      // Apply terrain factor relative to urban
      let terrainMultiplier = 1.0;
      if (terrain === 'suburban') terrainMultiplier = Math.pow(10, (refMaxPathLoss - refMaxPathLoss) / (10 * 3.0)) / Math.pow(10, (refMaxPathLoss - refMaxPathLoss) / (10 * 3.5)) * 1.5; // Simplified adjustment
      else if (terrain === 'rural') terrainMultiplier = Math.pow(10, (refMaxPathLoss - refMaxPathLoss) / (10 * 2.5)) / Math.pow(10, (refMaxPathLoss - refMaxPathLoss) / (10 * 3.5)) * 2.5;
      
      // More direct terrain scaling based on a common reference point
      if (terrain === 'suburban') baseRadiusMeters = radius * 1.8; // Adjusted factor
      else if (terrain === 'rural') baseRadiusMeters = radius * 3.0;  // Adjusted factor
      else baseRadiusMeters = radius; // Urban

    } else if (technology === 'Zigbee') {
      // Base for 0dBm Tx, Urban (gamma=3.5) -> ~30-50m
      const refTxPowerZigbee = 0;
      const refSensitivityZigbee = -95;
      const refMaxPathLossZigbee = refTxPowerZigbee - refSensitivityZigbee; // 95dB
      const refUrbanRadiusZigbee = 40; // meters

      const currentMaxPathLossZigbee = txPower - estimateReceiverSensitivity();
      baseRadiusMeters = refUrbanRadiusZigbee * Math.pow(10, (currentMaxPathLossZigbee - refMaxPathLossZigbee) / (10 * pathLossExponent));
      
      if (terrain === 'suburban') baseRadiusMeters *= 1.5;
      else if (terrain === 'rural') baseRadiusMeters *= 2.0;

    } else { // NB-IoT
      // Base for 14dBm Tx, Urban (gamma=3.5) -> ~1.5-2km (conservative for high reliability)
      const refTxPowerNBIoT = 14;
      const refSensitivityNBIoT = -135;
      const refMaxPathLossNBIoT = refTxPowerNBIoT - refSensitivityNBIoT; // 149dB
      const refUrbanRadiusNBIoT = 2000; // meters

      const currentMaxPathLossNBIoT = txPower - estimateReceiverSensitivity();
      baseRadiusMeters = refUrbanRadiusNBIoT * Math.pow(10, (currentMaxPathLossNBIoT - refMaxPathLossNBIoT) / (10 * pathLossExponent));

      if (terrain === 'suburban') baseRadiusMeters *= 1.8;
      else if (terrain === 'rural') baseRadiusMeters *= 3.0;
    }
    return Math.max(10, Math.round(baseRadiusMeters * interferenceRangeFactor)); // Ensure a minimum radius
  };
  
  const calculateLoRaWANTimeOnAir = () => {
    if (technology !== 'LoRaWAN') return null;

    const BW = loraBandwidth * 1000; // Hz
    const SF = spreadingFactor;
    const CR_map = {'4/5': 1, '4/6': 2, '4/7': 3, '4/8': 4}; // CR_code for formula
    const CR_code = CR_map[loraCodingRate] || 1;
    const PL = loraPayloadSize; // Bytes
    const n_preamble = loraPreambleSymbols;
    const H = 0; // Header enabled (explicit)
    const DE = (SF >= 11 && loraBandwidth === 125) ? 1 : 0; // Low Data Rate Optimization
    const CRC = 1; // CRC enabled

    const t_sym_ms = Math.pow(2, SF) / BW * 1000; // Symbol duration in ms
    const t_preamble_ms = (n_preamble + 4.25) * t_sym_ms;
    
    const numerator = (8 * PL) - (4 * SF) + 28 + (16 * CRC) - (20 * H);
    const denominator = 4 * (SF - (2 * DE));
    const payload_symbol_count = 8 + Math.max(0, Math.ceil(numerator / denominator) * (CR_code + 4));
    
    const t_payload_ms = payload_symbol_count * t_sym_ms;
    return t_preamble_ms + t_payload_ms;
  };

  // Calculate gateway requirements and interference impact
  const calculateGateways = () => {
    const area = areaLength * areaWidth;
    const radius = estimateCoverageRadius();
    const coverageArea = Math.PI * radius ** 2;
    if (coverageArea === 0) return { error: "Coverage radius is zero, check inputs." };


    let numGateways = Math.ceil(area / coverageArea);

    let devicesPerGateway;
    const timeOnAirMs = calculateLoRaWANTimeOnAir();
    let dailyToAWarning = "";

    if (technology === 'LoRaWAN') {
      // Base capacities (empirical, for ~30s ToA, few messages/day)
      const baseSfCapacities = { 7: 3000, 8: 1500, 9: 700, 10: 350, 11: 180, 12: 90 };
      devicesPerGateway = baseSfCapacities[spreadingFactor] || 200;
      
      if (timeOnAirMs && timeOnAirMs > 0) {
        const referenceToA = 50; // ms (typical ToA for which base capacities might hold)
        // Adjust capacity: if ToA is higher, capacity is lower.
        devicesPerGateway = Math.round(devicesPerGateway * (referenceToA / timeOnAirMs));
        
        // Simplified daily ToA check (e.g. for 1% duty cycle)
        const messagesPerDayPerDevice = 10; // Assume 10 messages/day for this check
        const totalDailyToAForDeviceMs = timeOnAirMs * messagesPerDayPerDevice;
        const onePercentDutyCycleLimitMs = 24 * 60 * 60 * 1000 * 0.01; // 864 seconds
        if (totalDailyToAForDeviceMs > onePercentDutyCycleLimitMs) {
            dailyToAWarning = `Warning: With ${messagesPerDayPerDevice} messages/day, device ToA (${(totalDailyToAForDeviceMs/1000).toFixed(1)}s) exceeds 1% daily duty cycle limit (${(onePercentDutyCycleLimitMs/1000).toFixed(1)}s). Reduce messages or payload.`;
        }
      }
    } else if (technology === 'Zigbee') {
      devicesPerGateway = 60; // Considering mesh extenders not gateways here.
    } else { // NB-IoT
      devicesPerGateway = 10000; // More conservative than theoretical max
    }

    const interferenceCapacityFactor = { low: 1.0, medium: 0.7, high: 0.4 }[interferenceLevel];
    devicesPerGateway = Math.max(1, Math.round(devicesPerGateway * interferenceCapacityFactor));

    const gatewaysForDevices = Math.ceil(numDevices / devicesPerGateway);
    numGateways = Math.max(1, Math.max(numGateways, gatewaysForDevices));

    const sqrtGateways = Math.ceil(Math.sqrt(numGateways));
    const spacingX = numGateways > 0 ? (areaLength / sqrtGateways).toFixed(2) : 0;
    const spacingY = numGateways > 0 ? (areaWidth / sqrtGateways).toFixed(2) : 0;
    const placement = `Place ${numGateways} gateways in a grid with approximately ${spacingX}m spacing along length and ${spacingY}m along width.`;

    const devicesPerCluster = numGateways > 0 ? Math.ceil(numDevices / numGateways) : numDevices;
    const devicePlacement = `Distribute ${numDevices} devices across ${numGateways} clusters, with approximately ${devicesPerCluster} devices per gateway.`;

    let interferenceWarning = '';
    if (interferenceLevel !== 'low' && technology === 'NB-IoT') {
      interferenceWarning = `Warning: ${interferenceLevel} interference may reduce SINR, impacting coverage and capacity. Consider PRB blanking or scheduling.`;
    } else if (interferenceLevel !== 'low') {
      interferenceWarning = `Warning: ${interferenceLevel} interference may reduce effective range and capacity. Optimize channel selection.`;
    }
    if (dailyToAWarning) {
        interferenceWarning = interferenceWarning ? `${interferenceWarning} ${dailyToAWarning}` : dailyToAWarning;
    }
    
    const estSensitivity = estimateReceiverSensitivity();
    const maxAllowablePathLoss = txPower - estSensitivity; // Simplified, no antenna gains

    return {
      numGateways,
      coverageRadius: radius,
      devicesPerGateway,
      placement,
      devicePlacement,
      interferenceWarning,
      timeOnAirMs: technology === 'LoRaWAN' ? timeOnAirMs : null,
      estimatedSensitivity: estSensitivity,
      maxAllowablePathLoss: maxAllowablePathLoss,
    };
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (!result || result.error) return;
    const headers = [
      'Technology', 'Area (m²)', 'Number of Devices', 'Terrain', 
      'Spreading Factor (LoRaWAN)', 'Bandwidth (kHz, LoRaWAN)', 'Coding Rate (LoRaWAN)', 'Payload Size (bytes, LoRaWAN)',
      'Transmit Power (dBm)', 'Interference Level',
      'Number of Gateways', 'Coverage Radius (m)', 'Devices per Gateway',
      'Time on Air (ms, LoRaWAN)', 'Est. Rx Sensitivity (dBm)', 'Max Allowable Path Loss (dB)',
      'Gateway Placement', 'Device Placement', 'Warning',
    ];
    const data = [
      [
        technology, (areaLength * areaWidth).toFixed(0), numDevices, terrain,
        technology === 'LoRaWAN' ? spreadingFactor : 'N/A',
        technology === 'LoRaWAN' ? loraBandwidth : 'N/A',
        technology === 'LoRaWAN' ? loraCodingRate : 'N/A',
        technology === 'LoRaWAN' ? loraPayloadSize : 'N/A',
        txPower, interferenceLevel,
        result.numGateways, result.coverageRadius, result.devicesPerGateway,
        result.timeOnAirMs ? result.timeOnAirMs.toFixed(2) : 'N/A',
        result.estimatedSensitivity ? result.estimatedSensitivity.toFixed(1) : 'N/A',
        result.maxAllowablePathLoss ? result.maxAllowablePathLoss.toFixed(1) : 'N/A',
        result.placement, result.devicePlacement, result.interferenceWarning,
      ],
    ];
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'iot_network_plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle calculation
  const handleCalculate = () => {
    if (areaLength <= 0 || areaWidth <= 0 || numDevices < 0) {
        setResult({ error: "Area dimensions and number of devices must be positive." });
        return;
    }
    const results = calculateGateways();
    setResult(results);
  };

  // Render SVG diagram
  const renderDiagram = () => {
    if (!result) return null;
    const width = 400;
    const height = 300;
    const scaleX = width / areaLength;
    const scaleY = height / areaWidth;
    const sqrtGateways = Math.ceil(Math.sqrt(result.numGateways));
    const gatewayPositions = [];
    for (let i = 0; i < sqrtGateways; i++) {
      for (let j = 0; j < sqrtGateways; j++) {
        if (gatewayPositions.length < result.numGateways) {
          const x = (width / sqrtGateways) * (j + 0.5);
          const y = (height / sqrtGateways) * (i + 0.5);
          gatewayPositions.push({ x, y });
        }
      }
    }
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x="0" y="0" width={width} height={height} fill="none" stroke="#ccd6f6" strokeWidth="2" />
        {gatewayPositions.map((pos, i) => (
          <g key={i}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={result.coverageRadius * Math.min(scaleX, scaleY)}
              fill="none"
              stroke="#64ffda"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <circle cx={pos.x} cy={pos.y} r="5" fill="#64ffda" />
            <text x={pos.x} y={pos.y - 10} fill="#ccd6f6" fontSize="10" textAnchor="middle">
              GW{i + 1}
            </text>
          </g>
        ))}
        {[...Array(Math.min(numDevices, 50))].map((_, i) => {
          const gatewayIndex = Math.floor(i / (50 / result.numGateways));
          const pos = gatewayPositions[gatewayIndex] || gatewayPositions[0];
          const angle = Math.random() * 2 * Math.PI;
          const dist = Math.random() * result.coverageRadius * Math.min(scaleX, scaleY);
          const x = pos.x + dist * Math.cos(angle);
          const y = pos.y + dist * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="2" fill="#ff6b6b" />;
        })}
      </svg>
    );
  };

  return (
    <div className="iot-network-planner">
      <h2>IoT Device Network Planner</h2>
      <p>Plan LoRaWAN, Zigbee, or NB-IoT networks with coverage, gateway, and interference considerations.</p>

      <div className="controls">
        <div className="input-group">
          <label>Technology:</label>
          <select value={technology} onChange={e => setTechnology(e.target.value)}>
            <option value="LoRaWAN">LoRaWAN</option>
            <option value="Zigbee">Zigbee</option>
            <option value="NB-IoT">NB-IoT</option>
          </select>
        </div>
        <div className="input-group">
          <label>Terrain:</label>
          <select value={terrain} onChange={e => setTerrain(e.target.value)}>
            <option value="urban">Urban</option>
            <option value="suburban">Suburban</option>
            <option value="rural">Rural</option>
          </select>
        </div>
        <div className="input-group">
          <label>Interference Level:</label>
          <select value={interferenceLevel} onChange={e => setInterferenceLevel(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="input-section">
        <div className="input-group">
          <label>Area Length (m):</label>
          <input
            type="number"
            value={areaLength}
            onChange={e => setAreaLength(parseFloat(e.target.value))}
            min="0"
            step="100"
          />
        </div>
        <div className="input-group">
          <label>Area Width (m):</label>
          <input
            type="number"
            value={areaWidth}
            onChange={e => setAreaWidth(parseFloat(e.target.value))}
            min="0"
            step="100"
          />
        </div>
        <div className="input-group">
          <label>Number of Devices:</label>
          <input
            type="number"
            value={numDevices}
            onChange={e => setNumDevices(parseInt(e.target.value))}
            min="0"
            step="1"
          />
        </div>
        {technology === 'LoRaWAN' && (
          <>
            <div className="input-group">
              <label>Spreading Factor (SF):</label>
              <select value={spreadingFactor} onChange={e => setSpreadingFactor(parseInt(e.target.value))}>
                {[7, 8, 9, 10, 11, 12].map(sf => (
                  <option key={sf} value={sf}>SF{sf}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Bandwidth (kHz):</label>
              <select value={loraBandwidth} onChange={e => setLoraBandwidth(parseInt(e.target.value))}>
                {[125, 250, 500].map(bw => (
                  <option key={bw} value={bw}>{bw} kHz</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Coding Rate:</label>
              <select value={loraCodingRate} onChange={e => setLoraCodingRate(e.target.value)}>
                {['4/5', '4/6', '4/7', '4/8'].map(cr => (
                  <option key={cr} value={cr}>{cr}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Payload Size (bytes):</label>
              <input
                type="number"
                value={loraPayloadSize}
                onChange={e => setLoraPayloadSize(parseInt(e.target.value))}
                min="1"
                max="222" // Max LoRaWAN payload
                step="1"
              />
            </div>
            <div className="input-group">
              <label>Preamble Symbols:</label>
              <input
                type="number"
                value={loraPreambleSymbols}
                onChange={e => setLoraPreambleSymbols(parseInt(e.target.value))}
                min="6" // Common minimum
                step="1"
              />
            </div>
          </>
        )}
        <div className="input-group">
          <label>Transmit Power (dBm):</label>
          <input
            type="number"
            value={txPower}
            onChange={e => setTxPower(parseFloat(e.target.value))}
            min={technology === 'Zigbee' ? -10 : (technology === 'LoRaWAN' || technology === 'NB-IoT' ? 2 : 0) } // Adjusted min for Zigbee
            max={technology === 'Zigbee' ? 10 : 20} // Adjusted max for Zigbee
            step="1"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="calculate-btn" onClick={handleCalculate}>
          Calculate Network Plan
        </button>
        {result && (
          <button className="export-btn" onClick={exportToCSV}>
            Export to CSV
          </button>
        )}
      </div>

      {result && result.error && (
        <div className="result-section">
            <p className="warning">Error: {result.error}</p>
        </div>
      )}
      {result && !result.error && (
        <div className="result-section">
          <h3>Network Plan Results</h3>
          <div className="results-grid">
            <div className="result-item">
              <span className="result-label">Number of Gateways:</span>
              <span className="result-value">{result.numGateways}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Coverage Radius per Gateway:</span>
              <span className="result-value">{result.coverageRadius} m</span>
            </div>
            <div className="result-item">
              <span className="result-label">Devices per Gateway (approx):</span>
              <span className="result-value">{result.devicesPerGateway}</span>
            </div>
            {technology === 'LoRaWAN' && result.timeOnAirMs !== null && (
              <div className="result-item">
                <span className="result-label">Time on Air (LoRaWAN):</span>
                <span className="result-value">{result.timeOnAirMs.toFixed(2)} ms</span>
              </div>
            )}
            <div className="result-item">
                <span className="result-label">Est. Rx Sensitivity:</span>
                <span className="result-value">{result.estimatedSensitivity.toFixed(1)} dBm</span>
            </div>
            <div className="result-item">
                <span className="result-label">Max Allowable Path Loss:</span>
                <span className="result-value">{result.maxAllowablePathLoss.toFixed(1)} dB</span>
            </div>
          </div>
          <p>{result.placement}</p>
          <p>{result.devicePlacement}</p>
          {result.interferenceWarning && <p className="warning">{result.interferenceWarning}</p>}
          <div className="network-diagram">
            <h4>Network Layout</h4>
            {renderDiagram()}
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTDeviceNetworkPlanner;