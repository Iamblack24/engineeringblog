import React, { useState, useRef } from 'react'; // Added useRef
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './CarbonFootprintCalculator.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Constants ---
// More detailed emission factors (kg CO2e) - **Illustrative, needs better data sources**
// Source examples: EPA, DEFRA, Our World In Data, Carbon Trust, etc.
const EMISSION_FACTORS = {
    // Region-specific electricity grid intensity (kg CO2e / kWh) - Example values
    electricityGrid: {
        'global_avg': 0.475, // Global average (approx)
        'uk': 0.233,
        'us_avg': 0.417,
        'kenya': 0.150, // Kenya has significant hydro/geothermal
        'eu_avg': 0.276,
    },
    transportation: {
        car: { // per km
            petrol_avg: 0.192,
            diesel_avg: 0.171,
            hybrid_avg: 0.111,
            electric_grid: 0.0, // Base, will add grid intensity * efficiency
            electric_renewable: 0.0,
        },
        carEfficiencyKwhPerKm: 0.18, // Avg kWh/km for EVs
        publicTransport: { // per km
            bus: 0.105,
            train_national: 0.041,
            train_local: 0.055, // e.g., subway/metro
        },
        flights: { // per passenger-km (more accurate than per flight) - Includes radiative forcing factor (e.g., ~1.9)
            shortHaul_economy: 0.250, // < 1500 km
            mediumHaul_economy: 0.180, // 1500 - 4000 km
            longHaul_economy: 0.150, // > 4000 km
            businessClassMultiplier: 3.0, // Business class is ~3x economy
        },
        flightDistances: { // Approx km per flight type (one-way)
            short: 700,
            medium: 2500,
            long: 7000,
        }
    },
    energy: { // kg CO2e
        naturalGas: 0.184, // per kWh (GWP over 100 years)
        heatingOil: 0.267, // per kWh (approx from litres)
        woodPellets: 0.039, // per kWh (biomass, depends on source sustainability)
        // renewableDiscount: 1.0 // Assume 100% reduction if source is renewable
    },
    waste: { // kg CO2e / kg waste
        landfill: 0.587, // Varies greatly
        incineration: 0.150, // Varies
        recyclingBenefitFactor: -0.7, // Avoided emissions (negative)
        compostingBenefitFactor: -0.2, // Avoided emissions (negative)
    },
    diet: { // kg CO2e / day - Highly variable, illustrative averages
        vegan: 1.5,
        vegetarian: 1.7,
        lowMeat: 2.0, // Pescetarian or eats meat infrequently
        mixed: 2.5, // Average omnivore
        highMeat: 3.3, // Meat in most meals
        // Modifiers
        localFoodFactor: 0.95, // 5% reduction if mostly local
        foodWasteMultiplier: 1.10, // 10% increase for high food waste
    },
    consumption: { // kg CO2e / currency unit (e.g., USD/EUR/GBP) - VERY approximate
        // Based on lifecycle assessments, highly variable
        clothing: 0.035,
        electronics: 0.050,
        furniture: 0.040,
        services: 0.020, // e.g., entertainment, finance, healthcare
        // Modifiers
        shoppingHabits: {
            'new': 1.0,
            'mixed': 0.7,
            'secondhand': 0.3,
        }
    }
};

const CarbonFootprintCalculator = () => {
    const [footprintData, setFootprintData] = useState({
        region: 'global_avg', // For electricity grid
        occupants: 1,
        // Transportation
        transportation: {
            carKmPerYear: 0,
            carType: 'petrol_avg', // petrol_avg, diesel_avg, hybrid_avg, electric_grid, electric_renewable
            busKmPerYear: 0,
            trainKmPerYear: 0,
            flightsShortHaul: 0, // Number of round trips
            flightsMediumHaul: 0,
            flightsLongHaul: 0,
            flightClass: 'economy', // economy, business
        },
        // Energy
        energy: {
            electricityKwhPerMonth: 0,
            electricitySource: 'grid', // grid, renewable_supplier, own_solar
            naturalGasKwhPerMonth: 0,
            heatingOilLitresPerYear: 0,
            woodKgPerYear: 0, // Wood pellets or logs
            // renewablePercentage: 0, // Replaced by electricitySource
            homeSize: 'medium', // small, medium, large - Can be used for baseline estimates if usage unknown
        },
        // Waste & Recycling
        waste: {
            wasteKgPerWeek: 5, // kg
            recyclingRate: 'average', // none, low, average, high
            composting: false,
        },
        // Food & Diet
        diet: {
            dietType: 'mixed', // vegan, vegetarian, lowMeat, mixed, highMeat
            localFoodFocus: 'average', // low, average, high
            foodWasteLevel: 'average', // low, average, high
        },
        // Consumption (Secondary Footprint) - Input in local currency (e.g., USD/EUR/GBP per month)
        consumption: {
            monthlySpending: {
                clothing: 50,
                electronics: 30,
                furniture: 20,
                services: 200, // Entertainment, subscriptions, etc.
            },
            shoppingHabits: 'mixed', // new, mixed, secondhand
        }
    });

    const [results, setResults] = useState(null);
    const [errors, setErrors] = useState({});
    const resultsRef = useRef(null); // Ref for PDF export

    // --- Input Handlers ---
    const handleInputChange = (section, field, value, isNumeric = true, subField = null) => {
        // Ensure numeric values are parsed correctly, handle potential NaN
        const parsedValue = isNumeric ? (value === '' ? 0 : parseFloat(value) || 0) : value; 
        
        setFootprintData(prev => {
            const newData = { ...prev };

            // Handle top-level properties like 'region' or 'occupants'
            if (field === null) { 
                newData[section] = parsedValue;
            } 
            // Handle third-level nesting like consumption.monthlySpending.clothing
            else if (subField) { 
                // Ensure the nested objects exist before assigning
                if (!newData[section]) newData[section] = {};
                if (!newData[section][field]) newData[section][field] = {};
                newData[section][field][subField] = parsedValue;
            } 
            // Handle second-level nesting like transportation.carKmPerYear
            else { 
                // Ensure the nested object exists before assigning
                if (!newData[section]) newData[section] = {};
                newData[section][field] = parsedValue;
            }
            
            return newData;
        });
        setResults(null); // Clear results on input change
        setErrors({});
    };

    // --- Validation ---
    const validateInputs = () => {
        const newErrors = {};
        // Add more specific validation for ranges and negative numbers
        if (footprintData.transportation.carKmPerYear < 0) newErrors.carKm = 'Car km must be non-negative.';
        if (footprintData.energy.electricityKwhPerMonth < 0) newErrors.electricity = 'Electricity kWh must be non-negative.';
        if (footprintData.waste.wasteKgPerWeek < 0) newErrors.wasteKg = 'Waste kg must be non-negative.';
        // ... add more validations ...
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Calculation Functions ---
    const calculateFootprint = () => {
        if (!validateInputs()) return;
        try {
            const emissions = {};
            emissions.transportation = calculateTransportationEmissions();
            emissions.energy = calculateEnergyEmissions();
            emissions.waste = calculateWasteEmissions();
            emissions.diet = calculateDietEmissions();
            emissions.consumption = calculateConsumptionEmissions();

            // Calculate total and per capita
            const totalEmissionsKg = Object.values(emissions).reduce((sum, val) => sum + val, 0);
            const perCapitaEmissionsKg = footprintData.occupants > 0 ? totalEmissionsKg / footprintData.occupants : totalEmissionsKg;

            // Convert to tonnes for display
            const totalEmissionsTonnes = totalEmissionsKg / 1000;
            const perCapitaEmissionsTonnes = perCapitaEmissionsKg / 1000;

            const breakdown = {};
            if (totalEmissionsKg > 0) {
                for (const key in emissions) {
                    breakdown[key] = (emissions[key] / totalEmissionsKg) * 100;
                }
            }

            setResults({
                emissions: { // Store in kg CO2e
                    transportation: emissions.transportation,
                    energy: emissions.energy,
                    waste: emissions.waste,
                    diet: emissions.diet,
                    consumption: emissions.consumption,
                    total: totalEmissionsKg,
                    perCapita: perCapitaEmissionsKg,
                },
                displayTonnes: { // For easier display
                    total: totalEmissionsTonnes,
                    perCapita: perCapitaEmissionsTonnes,
                },
                comparisons: generateComparisons(perCapitaEmissionsKg), // Compare per capita
                recommendations: generateRecommendations(emissions, breakdown),
                breakdown: breakdown, // Percentages
                chartData: generateChartData(breakdown),
            });

        } catch (error) {
            console.error("Calculation Error:", error);
            setErrors({ calculation: 'Error calculating footprint. Check inputs and factors.' });
        }
    };

    const calculateTransportationEmissions = () => {
        const { transportation, region } = footprintData;
        const factors = EMISSION_FACTORS.transportation;
        const gridFactor = EMISSION_FACTORS.electricityGrid[region] || EMISSION_FACTORS.electricityGrid['global_avg'];

        let carEmissions = 0;
        if (transportation.carType.startsWith('electric')) {
            const sourceFactor = transportation.carType === 'electric_renewable' ? 0 : gridFactor;
            carEmissions = transportation.carKmPerYear * factors.carEfficiencyKwhPerKm * sourceFactor;
        } else {
            carEmissions = transportation.carKmPerYear * (factors.car[transportation.carType] || 0);
        }

        const publicTransportEmissions =
            transportation.busKmPerYear * factors.publicTransport.bus +
            transportation.trainKmPerYear * factors.publicTransport.train_national; // Assuming national for simplicity

        const flightMultiplier = transportation.flightClass === 'business' ? factors.businessClassMultiplier : 1.0;
        const flightEmissions = (
            transportation.flightsShortHaul * 2 * factors.flightDistances.short * factors.flights.shortHaul_economy +
            transportation.flightsMediumHaul * 2 * factors.flightDistances.medium * factors.flights.mediumHaul_economy +
            transportation.flightsLongHaul * 2 * factors.flightDistances.long * factors.flights.longHaul_economy
        ) * flightMultiplier;

        return carEmissions + publicTransportEmissions + flightEmissions;
    };

    const calculateEnergyEmissions = () => {
        const { energy, region } = footprintData;
        const factors = EMISSION_FACTORS.energy;
        const gridFactor = EMISSION_FACTORS.electricityGrid[region] || EMISSION_FACTORS.electricityGrid['global_avg'];

        let electricityFactor = gridFactor;
        if (energy.electricitySource === 'renewable_supplier' || energy.electricitySource === 'own_solar') {
            electricityFactor = 0; // Assume 100% renewable source means zero grid emissions
        }
        const electricityEmissions = energy.electricityKwhPerMonth * 12 * electricityFactor;

        const gasEmissions = energy.naturalGasKwhPerMonth * 12 * factors.naturalGas;
        // Approx conversion: 1 litre heating oil ~= 10.7 kWh. Factor includes density.
        const oilEmissions = energy.heatingOilLitresPerYear * 10.7 * factors.heatingOil;
        // Approx conversion: 1 kg wood pellets ~= 4.8 kWh. Factor includes density.
        const woodEmissions = energy.woodKgPerYear * 4.8 * factors.woodPellets;

        // Return total household energy emissions
        return electricityEmissions + gasEmissions + oilEmissions + woodEmissions;
    };

    const calculateWasteEmissions = () => {
        const { waste } = footprintData;
        const factors = EMISSION_FACTORS.waste;

        const totalWasteKgYear = waste.wasteKgPerWeek * 52;
        if (totalWasteKgYear <= 0) return 0;

        let recyclingRateValue = 0;
        if (waste.recyclingRate === 'low') recyclingRateValue = 0.1;
        else if (waste.recyclingRate === 'average') recyclingRateValue = 0.3;
        else if (waste.recyclingRate === 'high') recyclingRateValue = 0.6;

        const landfillWasteKg = totalWasteKgYear * (1 - recyclingRateValue - (waste.composting ? 0.1 : 0)); // Assume composting diverts ~10%
        const recycledWasteKg = totalWasteKgYear * recyclingRateValue;
        const compostedWasteKg = waste.composting ? totalWasteKgYear * 0.1 : 0;

        // Landfill emissions + avoided emissions from recycling/composting
        const landfillEmissions = landfillWasteKg * factors.landfill;
        const recyclingBenefit = recycledWasteKg * factors.recyclingBenefitFactor; // Negative value
        const compostingBenefit = compostedWasteKg * factors.compostingBenefitFactor; // Negative value

        return landfillEmissions + recyclingBenefit + compostingBenefit;
    };

    const calculateDietEmissions = () => {
        const { diet } = footprintData;
        const factors = EMISSION_FACTORS.diet;

        let baseEmissions = (factors[diet.dietType] || factors.mixed) * 365;

        if (diet.localFoodFocus === 'high') baseEmissions *= factors.localFoodFactor;
        if (diet.foodWasteLevel === 'high') baseEmissions *= factors.foodWasteMultiplier;

        return baseEmissions;
    };

    const calculateConsumptionEmissions = () => {
        const { consumption } = footprintData;
        const factors = EMISSION_FACTORS.consumption;
        const habitMultiplier = factors.shoppingHabits[consumption.shoppingHabits] || 1.0;

        const totalSpending =
            consumption.monthlySpending.clothing * 12 * factors.clothing +
            consumption.monthlySpending.electronics * 12 * factors.electronics +
            consumption.monthlySpending.furniture * 12 * factors.furniture +
            consumption.monthlySpending.services * 12 * factors.services;

        return totalSpending * habitMultiplier;
    };

    // --- Comparisons & Recommendations ---
    const generateComparisons = (perCapitaKg) => {
        const perCapitaTonnes = perCapitaKg / 1000;
        // Target: 2 tonnes CO2e per person by 2050 (Paris Agreement aligned)
        const target2050 = 2.0;
        return {
            treesNeeded: Math.ceil(perCapitaKg / 21), // Per person
            vsGlobalAvg: ((perCapitaTonnes / 4.7) * 100).toFixed(0), // % of global avg (4.7t)
            vsTarget2050: ((perCapitaTonnes / target2050) * 100).toFixed(0), // % of 2t target
            // Add country specific average comparison based on footprintData.region if desired
        };
    };

    const generateRecommendations = (emissions, breakdown) => {
        const recommendations = [];
        const sortedBreakdown = Object.entries(breakdown)
            .filter(([key, value]) => value > 0)
            .sort(([, a], [, b]) => b - a); // Sort descending by percentage

        // Suggest targeting the top 1 or 2 categories
        for (let i = 0; i < Math.min(sortedBreakdown.length, 2); i++) {
            const [category] = sortedBreakdown[i];
            let text = '';
            let potentialSaving = 0; // kg CO2e

            switch (category) {
                case 'transportation':
                    text = 'Reduce flying, use public transport/cycle more, or switch to an EV.';
                    potentialSaving = emissions.transportation * 0.3; // Potential 30% reduction
                    break;
                case 'energy':
                    text = 'Switch to a renewable energy tariff, improve home insulation, or reduce heating/cooling usage.';
                    potentialSaving = emissions.energy * 0.4; // Potential 40% reduction
                    break;
                case 'diet':
                    text = 'Reduce consumption of red meat and dairy, or try more plant-based meals.';
                    potentialSaving = emissions.diet * 0.5; // Potential 50% reduction (e.g., mixed to vegetarian)
                    break;
                case 'consumption':
                    text = 'Buy less new stuff, choose secondhand, repair items, and focus on experiences over goods.';
                    potentialSaving = emissions.consumption * 0.25; // Potential 25% reduction
                    break;
                case 'waste':
                    text = 'Reduce overall waste, maximize recycling, and start composting food scraps.';
                    potentialSaving = emissions.waste * 0.5; // Potential 50% reduction
                    break;
                default: break;
            }
            if (text) {
                recommendations.push({ category, text, potentialSaving: Math.round(potentialSaving) });
            }
        }
        // Add a general recommendation
        if (recommendations.length === 0 && emissions.total > 0) {
             recommendations.push({ category: 'general', text: 'Explore small changes across all areas to reduce your footprint.', potentialSaving: emissions.total * 0.1 });
        }

        return recommendations.sort((a, b) => b.potentialSaving - a.potentialSaving); // Show biggest savings first
    };

    // --- Chart Data ---
    const generateChartData = (breakdown) => {
        const labels = Object.keys(breakdown).map(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize
        const data = Object.values(breakdown);
        const backgroundColors = [ // Match CSS colors if possible
            '#FF6B6B', // transportation
            '#4ECDC4', // energy
            '#45B7D1', // waste
            '#96CEB4', // diet
            '#FFEEAD', // consumption
        ];

        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length),
                borderColor: 'var(--primary-color)', // Match background
                borderWidth: 2,
            }],
        };
    };

    // --- PDF Export ---
    const exportToPDF = () => {
        const input = resultsRef.current;
        if (!input || !results) return;

        const originalBg = input.style.backgroundColor;
        input.style.backgroundColor = 'white'; // Ensure white background for PDF

        html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
            .then((canvas) => {
                input.style.backgroundColor = originalBg; // Restore original background
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 15;
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pdfWidth - 2 * margin;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                let heightLeft = imgHeight;
                let position = margin; // Start position for the first page

                pdf.setFontSize(18);
                pdf.text('Your Carbon Footprint Report', pdfWidth / 2, margin, { align: 'center' });
                position += 10; // Add space after title

                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - margin - position); // Adjust height left based on initial position

                while (heightLeft >= 0) {
                    position = - (pdfHeight - 2 * margin) * (Math.ceil(imgHeight / (pdfHeight - 2 * margin)) - Math.ceil(heightLeft / (pdfHeight - 2 * margin))) + margin; // Calculate position for next page
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                    heightLeft -= (pdfHeight - 2 * margin);
                }

                pdf.save(`Carbon-Footprint-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
            })
            .catch(err => {
                console.error("Error generating PDF:", err);
                input.style.backgroundColor = originalBg; // Restore background on error
                setErrors({ pdf: 'Could not generate PDF.' });
            });
    };


    // --- JSX ---
    return (
        <div className="carbon-footprint-calculator">
            <h2>Carbon Footprint Calculator</h2>

            <div className="calculator-controls">
                {/* --- Global Settings --- */}
                 <div className="input-section global-settings">
                    <h3>Settings</h3>
                     <div className="input-group">
                        <label>Region/Country (for electricity grid):</label>
                        <select value={footprintData.region} onChange={(e) => handleInputChange('region', null, e.target.value, false)}>
                            {Object.keys(EMISSION_FACTORS.electricityGrid).map(key => (
                                <option key={key} value={key}>{key.replace(/_/g, ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                     <div className="input-group">
                        <label>Number of Occupants in Household:</label>
                        <input type="number" min="1" step="1" value={footprintData.occupants} onChange={(e) => handleInputChange('occupants', null, e.target.value)} />
                    </div>
                 </div>

                {/* --- Input Sections --- */}
                <div className="input-sections">
                    {/* Transportation Section */}
                    <div className="input-section">
                        <h3>Transportation</h3>
                        <div className="input-group">
                            <label>Annual Car Travel (km):</label>
                            <input type="number" value={footprintData.transportation.carKmPerYear} onChange={(e) => handleInputChange('transportation', 'carKmPerYear', e.target.value)} />
                            {errors.carKm && <span className="error">{errors.carKm}</span>}
                        </div>
                        <div className="input-group">
                            <label>Car Type:</label>
                            <select value={footprintData.transportation.carType} onChange={(e) => handleInputChange('transportation', 'carType', e.target.value, false)}>
                                <option value="petrol_avg">Petrol (Average)</option>
                                <option value="diesel_avg">Diesel (Average)</option>
                                <option value="hybrid_avg">Hybrid (Average)</option>
                                <option value="electric_grid">Electric (Grid Charging)</option>
                                <option value="electric_renewable">Electric (Renewable Charging)</option>
                            </select>
                        </div>
                         <div className="input-group">
                            <label>Annual Bus Travel (km):</label>
                            <input type="number" value={footprintData.transportation.busKmPerYear} onChange={(e) => handleInputChange('transportation', 'busKmPerYear', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Annual Train Travel (km):</label>
                            <input type="number" value={footprintData.transportation.trainKmPerYear} onChange={(e) => handleInputChange('transportation', 'trainKmPerYear', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Short Haul Flights (Round Trips/Year):</label>
                            <input type="number" value={footprintData.transportation.flightsShortHaul} onChange={(e) => handleInputChange('transportation', 'flightsShortHaul', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Medium Haul Flights (Round Trips/Year):</label>
                            <input type="number" value={footprintData.transportation.flightsMediumHaul} onChange={(e) => handleInputChange('transportation', 'flightsMediumHaul', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Long Haul Flights (Round Trips/Year):</label>
                            <input type="number" value={footprintData.transportation.flightsLongHaul} onChange={(e) => handleInputChange('transportation', 'flightsLongHaul', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Typical Flight Class:</label>
                            <select value={footprintData.transportation.flightClass} onChange={(e) => handleInputChange('transportation', 'flightClass', e.target.value, false)}>
                                <option value="economy">Economy</option>
                                <option value="business">Business</option>
                            </select>
                        </div>
                    </div>

                    {/* Energy Section */}
                    <div className="input-section">
                        <h3>Home Energy</h3>
                        <div className="input-group">
                            <label>Electricity Usage (kWh/month):</label>
                            <input type="number" value={footprintData.energy.electricityKwhPerMonth} onChange={(e) => handleInputChange('energy', 'electricityKwhPerMonth', e.target.value)} />
                             {errors.electricity && <span className="error">{errors.electricity}</span>}
                        </div>
                         <div className="input-group">
                            <label>Main Electricity Source:</label>
                            <select value={footprintData.energy.electricitySource} onChange={(e) => handleInputChange('energy', 'electricitySource', e.target.value, false)}>
                                <option value="grid">Grid Mix ({footprintData.region.replace(/_/g, ' ').toUpperCase()})</option>
                                <option value="renewable_supplier">100% Renewable Tariff</option>
                                <option value="own_solar">Own Solar/Renewable</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Natural Gas Usage (kWh/month):</label>
                            <input type="number" value={footprintData.energy.naturalGasKwhPerMonth} onChange={(e) => handleInputChange('energy', 'naturalGasKwhPerMonth', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Heating Oil Usage (Litres/year):</label>
                            <input type="number" value={footprintData.energy.heatingOilLitresPerYear} onChange={(e) => handleInputChange('energy', 'heatingOilLitresPerYear', e.target.value)} />
                        </div>
                         <div className="input-group">
                            <label>Wood Usage (kg/year - Pellets/Logs):</label>
                            <input type="number" value={footprintData.energy.woodKgPerYear} onChange={(e) => handleInputChange('energy', 'woodKgPerYear', e.target.value)} />
                        </div>
                        {/* Home Size and Occupants moved to global settings */}
                    </div>

                    {/* Waste Section */}
                    <div className="input-section">
                        <h3>Waste & Recycling</h3>
                        <div className="input-group">
                            <label>Household Waste per Week (kg):</label>
                            <input type="number" value={footprintData.waste.wasteKgPerWeek} onChange={(e) => handleInputChange('waste', 'wasteKgPerWeek', e.target.value)} />
                             {errors.wasteKg && <span className="error">{errors.wasteKg}</span>}
                        </div>
                        <div className="input-group">
                            <label>Recycling Level:</label>
                             <select value={footprintData.waste.recyclingRate} onChange={(e) => handleInputChange('waste', 'recyclingRate', e.target.value, false)}>
                                <option value="none">None / Very Little</option>
                                <option value="low">Some Items</option>
                                <option value="average">Most Standard Items</option>
                                <option value="high">Almost Everything Possible</option>
                            </select>
                        </div>
                        <div className="input-group checkbox">
                            <input type="checkbox" id="composting" checked={footprintData.waste.composting} onChange={(e) => handleInputChange('waste', 'composting', e.target.checked, false)} />
                            <label htmlFor="composting">Do you compost food waste?</label>
                        </div>
                    </div>

                    {/* Food Section */}
                    <div className="input-section">
                        <h3>Food & Diet</h3>
                        <div className="input-group">
                            <label>Diet Type:</label>
                            <select value={footprintData.diet.dietType} onChange={(e) => handleInputChange('diet', 'dietType', e.target.value, false)}>
                                <option value="vegan">Vegan</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="lowMeat">Low Meat / Pescetarian</option>
                                <option value="mixed">Mixed / Average Meat</option>
                                <option value="highMeat">High Meat</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Focus on Local/Seasonal Food:</label>
                             <select value={footprintData.diet.localFoodFocus} onChange={(e) => handleInputChange('diet', 'localFoodFocus', e.target.value, false)}>
                                <option value="low">Not Much</option>
                                <option value="average">Sometimes</option>
                                <option value="high">Frequently / Mostly</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Food Waste Level:</label>
                             <select value={footprintData.diet.foodWasteLevel} onChange={(e) => handleInputChange('diet', 'foodWasteLevel', e.target.value, false)}>
                                <option value="low">Very Little</option>
                                <option value="average">Some / Average</option>
                                <option value="high">Significant Amount</option>
                            </select>
                        </div>
                    </div>

                    {/* Consumption Section */}
                    <div className="input-section">
                        <h3>Consumption (Goods & Services)</h3>
                         <p className="input-hint">Enter average monthly spending in your local currency.</p>
                        <div className="input-group">
                            <label>Clothing & Shoes:</label>
                            <input type="number" value={footprintData.consumption.monthlySpending.clothing} onChange={(e) => handleInputChange('consumption', 'monthlySpending', e.target.value, true, 'clothing')} />
                        </div>
                        <div className="input-group">
                            <label>Electronics & Gadgets:</label>
                            <input type="number" value={footprintData.consumption.monthlySpending.electronics} onChange={(e) => handleInputChange('consumption', 'monthlySpending', e.target.value, true, 'electronics')} />
                        </div>
                        <div className="input-group">
                            <label>Furniture & Home Goods:</label>
                            <input type="number" value={footprintData.consumption.monthlySpending.furniture} onChange={(e) => handleInputChange('consumption', 'monthlySpending', e.target.value, true, 'furniture')} />
                        </div>
                         <div className="input-group">
                            <label>Services (Entertainment, Travel, etc.):</label>
                            <input type="number" value={footprintData.consumption.monthlySpending.services} onChange={(e) => handleInputChange('consumption', 'monthlySpending', e.target.value, true, 'services')} />
                        </div>
                        <div className="input-group">
                            <label>Shopping Habits:</label>
                            <select value={footprintData.consumption.shoppingHabits} onChange={(e) => handleInputChange('consumption', 'shoppingHabits', e.target.value, false)}>
                                <option value="new">Mostly New</option>
                                <option value="mixed">Mix of New & Secondhand</option>
                                <option value="secondhand">Mostly Secondhand/Repair</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {Object.keys(errors).length > 0 && (
                    <div className="errors">
                        {Object.values(errors).map((error, index) => (
                            <p key={index} className="error">{error}</p>
                        ))}
                    </div>
                )}

                <button className="calculate-button" onClick={calculateFootprint}>
                    Calculate My Footprint
                </button>

                {/* --- Results Display --- */}
                {results && (
                    <div className="results-section-container" ref={resultsRef}> {/* Added ref */}
                        <div className="results-section">
                            <h3>Your Carbon Footprint Results</h3>

                            <div className="results-grid">
                                {/* Total Emissions */}
                                <div className="result-item total-emissions">
                                    <h4>Per Person Annual Emissions</h4>
                                    <div className="emissions-value">
                                        {results.displayTonnes.perCapita.toFixed(1)}
                                        <span className="unit">tonnes CO₂e</span>
                                    </div>
                                     <p className="sub-value">
                                        (Household Total: {results.displayTonnes.total.toFixed(1)} tonnes CO₂e / {footprintData.occupants} occupants)
                                     </p>
                                </div>

                                {/* Emissions Breakdown Chart */}
                                <div className="result-item breakdown">
                                    <h4>Emissions Breakdown</h4>
                                    <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                                        <Doughnut
                                            data={results.chartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: 'right', labels: { color: 'var(--text-color)' } },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context) {
                                                                let label = context.label || '';
                                                                if (label) { label += ': '; }
                                                                if (context.parsed !== null) {
                                                                    label += context.parsed.toFixed(1) + '%';
                                                                }
                                                                return label;
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Comparisons */}
                                <div className="result-item comparisons">
                                    <h4>How You Compare (Per Person)</h4>
                                    <div className="comparison-grid">
                                        <div className="comparison-item">
                                            <span className="comparison-label">vs Global Average:</span>
                                            <span className="comparison-value">{results.comparisons.vsGlobalAvg}%</span>
                                        </div>
                                         <div className="comparison-item">
                                            <span className="comparison-label">vs 2050 Target (2t):</span>
                                            <span className="comparison-value">{results.comparisons.vsTarget2050}%</span>
                                        </div>
                                        <div className="comparison-item">
                                            <span className="comparison-label">Trees needed to offset:</span>
                                            <span className="comparison-value">{results.comparisons.treesNeeded} / year</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="result-item recommendations">
                                    <h4>Top Recommendations</h4>
                                    <div className="recommendations-list">
                                        {results.recommendations.length > 0 ? results.recommendations.map((rec, index) => (
                                            <div key={index} className="recommendation">
                                                <div className="recommendation-header">
                                                    <span className="category-tag">{rec.category}</span>
                                                    <span className="potential-saving">~{rec.potentialSaving} kg CO₂e/year</span>
                                                </div>
                                                <p>{rec.text}</p>
                                            </div>
                                        )) : <p>Your footprint is looking low! Keep up the great work.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={exportToPDF} className="export-button">Export Results to PDF</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarbonFootprintCalculator;