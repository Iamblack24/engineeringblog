import React, { useState } from 'react';
import './UnitConverter.css';

const UnitConverter = () => {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('');

  const categories = {
    length: {
      name: 'Length',
      units: ['meter', 'kilometer', 'centimeter', 'millimeter', 'mile', 'yard', 'foot', 'inch'],
      conversions: {
        meter: 1,
        kilometer: 0.001,
        centimeter: 100,
        millimeter: 1000,
        mile: 0.000621371,
        yard: 1.09361,
        foot: 3.28084,
        inch: 39.3701
      }
    },
    area: {
      name: 'Area',
      units: ['square_meter', 'square_kilometer', 'hectare', 'acre', 'square_foot', 'square_inch'],
      conversions: {
        square_meter: 1,
        square_kilometer: 0.000001,
        hectare: 0.0001,
        acre: 0.000247105,
        square_foot: 10.7639,
        square_inch: 1550
      }
    },
    volume: {
      name: 'Volume',
      units: ['cubic_meter', 'cubic_foot', 'cubic_inch', 'liter', 'gallon', 'cubic_yard'],
      conversions: {
        cubic_meter: 1,
        cubic_foot: 35.3147,
        cubic_inch: 61023.7,
        liter: 1000,
        gallon: 264.172,
        cubic_yard: 1.30795
      }
    },
    mass: {
      name: 'Mass',
      units: ['kilogram', 'gram', 'milligram', 'metric_ton', 'pound', 'ounce'],
      conversions: {
        kilogram: 1,
        gram: 1000,
        milligram: 1000000,
        metric_ton: 0.001,
        pound: 2.20462,
        ounce: 35.274
      }
    },
    pressure: {
      name: 'Pressure',
      units: ['pascal', 'kilopascal', 'bar', 'psi', 'atmosphere'],
      conversions: {
        pascal: 1,
        kilopascal: 0.001,
        bar: 0.00001,
        psi: 0.000145038,
        atmosphere: 9.86923e-6
      }
    },
    temperature: {
      name: 'Temperature',
      units: ['celsius', 'fahrenheit', 'kelvin'],
      conversions: {
        celsius: 'special',
        fahrenheit: 'special',
        kelvin: 'special'
      }
    },
    force: {
      name: 'Force',
      units: ['newton', 'kilonewton', 'pound_force', 'kilogram_force'],
      conversions: {
        newton: 1,
        kilonewton: 0.001,
        pound_force: 0.224809,
        kilogram_force: 0.101972
      }
    },
    speed: {
      name: 'Speed',
      units: ['meter_per_second', 'kilometer_per_hour', 'mile_per_hour', 'foot_per_second'],
      conversions: {
        meter_per_second: 1,
        kilometer_per_hour: 3.6,
        mile_per_hour: 2.23694,
        foot_per_second: 3.28084
      }
    }
  };

  const formatUnit = (unit) => {
    return unit.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const convertTemperature = (value, from, to) => {
    let celsius;
    
    // Convert to Celsius first
    switch(from) {
      case 'celsius':
        celsius = value;
        break;
      case 'fahrenheit':
        celsius = (value - 32) * 5/9;
        break;
      case 'kelvin':
        celsius = value - 273.15;
        break;
      default:
        return null;
    }

    // Convert from Celsius to target unit
    switch(to) {
      case 'celsius':
        return celsius;
      case 'fahrenheit':
        return (celsius * 9/5) + 32;
      case 'kelvin':
        return celsius + 273.15;
      default:
        return null;
    }
  };

  const convert = () => {
    if (!fromUnit || !toUnit || !inputValue) {
      setResult('Please fill in all fields');
      return;
    }

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult('Please enter a valid number');
      return;
    }

    if (category === 'temperature') {
      const convertedValue = convertTemperature(value, fromUnit, toUnit);
      setResult(`${value} ${formatUnit(fromUnit)} = ${convertedValue.toFixed(4)} ${formatUnit(toUnit)}`);
      return;
    }

    const categoryData = categories[category];
    const fromRatio = categoryData.conversions[fromUnit];
    const toRatio = categoryData.conversions[toUnit];
    
    const baseValue = value / fromRatio;
    const convertedValue = baseValue * toRatio;
    
    setResult(`${value} ${formatUnit(fromUnit)} = ${convertedValue.toFixed(4)} ${formatUnit(toUnit)}`);
  };

  return (
    <div className="unit-converter">
      <h2>Engineering Unit Converter</h2>
      <div className="converter-container">
        <div className="input-group">
          <label>Category:</label>
          <select 
            value={category} 
            onChange={(e) => {
              setCategory(e.target.value);
              setFromUnit('');
              setToUnit('');
              setResult('');
            }}
          >
            {Object.entries(categories).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>From:</label>
          <select 
            value={fromUnit} 
            onChange={(e) => setFromUnit(e.target.value)}
          >
            <option value="">Select Unit</option>
            {category && categories[category].units.map(unit => (
              <option key={unit} value={unit}>{formatUnit(unit)}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>To:</label>
          <select 
            value={toUnit} 
            onChange={(e) => setToUnit(e.target.value)}
          >
            <option value="">Select Unit</option>
            {category && categories[category].units.map(unit => (
              <option key={unit} value={unit}>{formatUnit(unit)}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Value:</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value"
          />
        </div>

        <button onClick={convert} className="convert-button">Convert</button>

        {result && (
          <div className="result">
            {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;