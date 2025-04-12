/**
 * Reinforced Concrete Design Calculation Helpers (Simplified EC2 Focus)
 */

// --- Constants ---
const GAMMA_C = 1.5;
const GAMMA_S = 1.15;
const ALPHA_CC = 0.85;
const ES_MODULUS = 200000; // MPa (Steel Modulus)

// --- Helper Functions ---

/**
 * Calculates effective moment of inertia using Branson's formula.
 * Note: Icr calculation here is simplified (assumes rectangular).
 * For T-beams, a more precise Icr calculation would be needed for higher accuracy.
 */
export const calculateEffectiveI = (Ig, Icr, Mcr, Mser) => {
  if (Mser <= Mcr || Icr <= 0) {
    return Ig; // Uncracked
  }
  const ratio = Mcr / Mser;
  const Ieff = Icr + (Ig - Icr) * Math.pow(ratio, 3);
  return Math.min(Ieff, Ig); // Cannot exceed Ig
};

/**
 * Calculates cracking moment Mcr.
 */
export const calculateMcr = (fctm, Ig, y_t) => {
  // fctm: Mean tensile strength of concrete (e.g., 0.3 * fck^(2/3) for EC2)
  // y_t: Distance from centroid to extreme tension fiber
  if (y_t <= 0) return Infinity;
  return (fctm * Ig / y_t) * 1e-6; // kNm
};

/**
 * Calculates deflection based on Ieff.
 * Assumes UDL and simply supported beam for the 5/384 factor.
 * Continuous beams require different factors or more detailed analysis.
 */
export const calculateDeflection = (w_ser, L, Ecm, Ieff, supportType = 'simplySupported') => {
  // w_ser: Service load (kN/m)
  // L: Span (m)
  // Ecm: Mean modulus of elasticity of concrete (e.g., 22 * (fck / 10 + 0.8)^(0.3) * 1000 MPa)
  if (Ecm <= 0 || Ieff <= 0) return 0;
  // Convert Ieff from mm^4 to m^4
  const Ieff_m4 = Ieff * 1e-12; // Used here
  // Adjust factor based on support type (basic approximation)
  const loadFactor = (supportType === 'simplySupported') ? 5 / 384 : 1 / 185;
  // Use Ieff_m4 in the calculation
  const deflection_m = (loadFactor * w_ser * Math.pow(L, 4)) / ((Ecm * 1e3) * Ieff_m4); // Ecm in kPa, Ieff_m4 in m^4
  return deflection_m * 1000; // mm
};

/**
 * Calculates crack width based on EC2 7.3.4 (Simplified).
 * sr,max calculation uses simplified factors (k3, k4) and doesn't fully implement Eq 7.11 options.
 * Ac_eff calculation is a basic rectangular approximation.
 */
export const calculateCrackWidth = (steelStress_ser, barDia, barSpacing, cover, fctm, Ecm, As, Ac_eff) => {
    // steelStress_ser: Steel stress under service load (MPa)
    // Ac_eff: Effective concrete area in tension
    if (!steelStress_ser || steelStress_ser <= 0 || !Ac_eff || Ac_eff <= 0) return 0;

    const Es = ES_MODULUS;
    const rho_p_eff = As / Ac_eff;
    if (rho_p_eff <= 0) return 0;

    // Simplified calculation of strain difference (epsilon_sm - epsilon_cm)
    // Assumes kt=0.4 for long term load
    const strain_diff = Math.max(0.6 * steelStress_ser / Es, (steelStress_ser - 0.4 * (fctm / rho_p_eff) * (1 + (Es / Ecm) * rho_p_eff)) / Es);

    // Max crack spacing sr,max (Simplified - depends on cover, spacing)
    const k1 = 0.8; // Bar type (high bond)
    const k2 = 0.5; // Strain distribution
    // const c = cover; // Removed - Not used directly, c_nom is used
    const k3 = 3.4; // National Annex dependent
    const k4 = 0.425; // National Annex dependent
    // Refined sr,max (closer to EC2 Eq 7.11, but still simplified)
    const c_nom = cover + barDia / 2; // Nominal cover to bar center
    const spacingTerm = k1 * k2 * k4 * barDia / rho_p_eff;
    // EC2 allows sr,max = 3.4c + spacingTerm OR sr,max = k3*c + spacingTerm (depending on spacing vs cover)
    // Using a simplified combination/upper bound here:
    const sr_max = Math.max(k3 * c_nom + spacingTerm, spacingTerm * 1.5); // Heuristic combination

    const wk = sr_max * strain_diff; // Characteristic crack width (mm)
    return Math.max(0, wk); // Ensure non-negative
};


/**
 * Calculates effective flange width for T/L beams (EC2 5.3.2.1).
 * L0 calculation depends on support conditions.
 */
export const calculateEffectiveFlangeWidth = (bw, hf, L0, spacing) => {
    // bw: web width
    // hf: flange thickness
    // L0: distance between points of zero moment (e.g., 0.85*L for simply supported, 0.7*L for continuous)
    // spacing: center-to-center spacing of beams (for T-beams) or distance to edge (for L-beams)

    // For T-beam:
    // const beff_T1 = bw + Math.min(0.2 * L0, 0.1 * L0 + 0.5 * spacing, 0.5 * spacing); // Removed - Not used
    // For L-beam:
    // const beff_L1 = bw + Math.min(0.1 * L0, 0.5 * (spacing || Infinity)); // Removed - Not used

    // EC2 Eq 5.7a and 5.7
    const beff_T_i = Math.min(0.1 * L0, 0.5 * spacing); // Corrected: contribution from each side for T-beam (EC2 5.7(1))
    const beff_T = Math.min(bw + 2 * beff_T_i, bw + 0.2 * L0); // Corrected: Total effective width for T-beam (EC2 5.7(1))

    const beff_L_i = Math.min(0.1 * L0, 0.5 * spacing); // Contribution from one side for L-beam (EC2 5.7a(1))
    const beff_L = Math.min(bw + beff_L_i, bw + 0.1 * L0); // Corrected: Total effective width for L-beam (EC2 5.7a(1))

    // Return both for potential use, or decide based on input later
    return { beff_T: beff_T, beff_L: beff_L };
};

/**
 * Calculates moment capacity of a T-beam section.
 * Assumes rectangular stress block (0.8x depth).
 */
export const calculateTBeamMomentCapacity = (bf, bw, hf, d, fcd, fyd, As) => {
    // bf: effective flange width
    // Assumes rectangular stress block
    const F_flange_comp = ALPHA_CC * fcd * (bf - bw) * hf; // Force in flange overhang compression
    const F_steel_yield = As * fyd; // Force in steel tension

    let M_Rd = 0;
    let x = 0; // Neutral axis depth

    if (F_steel_yield <= F_flange_comp) {
        // NA in flange (Treat as rectangular beam bf wide)
        x = (As * fyd) / (ALPHA_CC * fcd * bf * 0.8);
        // Ensure x is calculated correctly even if it falls slightly into the web
        // The check x <= hf determines how moment is calculated, not how x is found initially
        if (x <= hf / 0.8) { // Check based on stress block depth 0.8x <= hf
             const z = d - 0.4 * x;
             M_Rd = As * fyd * z * 1e-6; // kNm
        } else {
             // This case means steel yields, NA is in web, but flange compression alone is enough
             // This implies the initial F_steel_yield <= F_flange_comp check was sufficient
             // Recalculate based on flange force centroid
             const z_flange = d - hf / 2;
             M_Rd = F_flange_comp * z_flange * 1e-6; // Capacity governed by flange compression
             // Find x that balances F_flange_comp
             x = F_flange_comp / (ALPHA_CC * fcd * bw * 0.8); // This x is just for info, M_Rd is governing
        }

    } else {
        // NA in web, flange fully effective in compression
        const F_web_comp = F_steel_yield - F_flange_comp;
        const x_web_comp_depth = F_web_comp / (ALPHA_CC * fcd * bw * 0.8); // Depth of stress block in web
        x = (hf / 0.8) + x_web_comp_depth; // Total depth to NA (x)

        // Calculate moment by summing moments of compression forces about tension steel
        const z_flange = d - hf / 2; // Lever arm for flange force
        const z_web = d - hf - (0.4 * x_web_comp_depth); // Lever arm for web compression force (approx centroid of web stress block)
        M_Rd = (F_flange_comp * z_flange + F_web_comp * z_web) * 1e-6; // kNm
    }

    // Add check for maximum x/d ratio (e.g., 0.45 for high ductility)
    if (x / d > 0.45) {
        console.warn(`T-Beam: x/d ratio (${(x/d).toFixed(2)}) exceeds 0.45. Consider ductility class.`);
        // Potentially limit M_Rd or require compression steel if x/d is too high, but keep simple for now
    }


    return { M_Rd, x };
};


/**
 * Calculates punching shear capacity V_Rd,c (EC2 6.4.4).
 * Assumes beta factor (load eccentricity) = 1.0. Requires Asl (avg reinforcement ratio).
 */
export const calculatePunchingShearCapacity = (d, u1, Asl, fck, NEd_col = 0, Ac_col = 0) => {
    // d: average effective depth (mm)
    // u1: length of control perimeter at 2d (mm)
    // Asl: average reinforcement ratio over width lw within u1 (Asx+Asy)/2 / (lw*d)
    // NEd_col: Axial load in column (kN) - positive for compression
    // Ac_col: Area of column (mm^2)

    const k_punch = Math.min(1 + Math.sqrt(200 / d), 2.0);
    const rho_l = Math.min(Asl, 0.02); // Use average reinforcement ratio
    const C_Rd_c = 0.18 / GAMMA_C;

    // Optional: Enhancement factor for column compression
    let k1_alpha = 0;
    if (NEd_col > 0 && Ac_col > 0) {
        const sigma_cp = NEd_col * 1000 / Ac_col; // MPa
        k1_alpha = 0.1 * sigma_cp / (ALPHA_CC * fck / GAMMA_C); // Simplified factor
    }

    let v_Rd_c = C_Rd_c * k_punch * Math.pow(100 * rho_l * fck, 1/3) + k1_alpha * (ALPHA_CC * fck / GAMMA_C); // Changed const to let
    // Add minimum shear resistance v_min (EC2 Eq 6.2b)
    const v_min = (0.035 / GAMMA_C) * Math.pow(k_punch, 1.5) * Math.sqrt(fck); // MPa
    v_Rd_c = Math.max(v_Rd_c, v_min); // v_Rd,c should not be less than v_min

    const V_Rd_c = v_Rd_c * u1 * d * 1e-3; // kN

    // Max shear resistance v_Rd,max (EC2 6.4.5) - Simplified
    const v1 = 0.6 * (1 - fck / 250);
    const v_Rd_max = 0.5 * v1 * (ALPHA_CC * fck / GAMMA_C); // MPa (Assumes cot+tan = 2)
    const V_Rd_max = v_Rd_max * u1 * d * 1e-3; // kN

    return { v_Rd_c, V_Rd_c, v_Rd_max, V_Rd_max };
};

/**
 * Calculates moment coefficients for two-way slabs.
 * WARNING: These coefficients are highly simplified placeholders ONLY for
 * the case of 4 edges simply supported or a rough 'continuous' approximation.
 * Accurate design requires coefficients from EC2 Annex E or similar tables
 * based on specific edge conditions (continuous, discontinuous) and aspect ratio.
 */
export const getTwoWaySlabCoefficients = (Lx, Ly, supportCondition) => {
    const ratio = Ly / Lx; // Aspect ratio (>= 1.0)
    let alpha_sx, alpha_sy;

    // Highly simplified coefficients - Replace with proper tables (e.g., EC2 Annex E or ACI)
    if (supportCondition === 'simplySupported') { // 4 edges simply supported
        if (ratio < 1.2) { alpha_sx = 0.045; alpha_sy = 0.045; }
        else if (ratio < 1.5) { alpha_sx = 0.06; alpha_sy = 0.035; }
        else { alpha_sx = 0.08; alpha_sy = 0.025; } // More one-way action
    } else { // Assume continuous edges (approx)
         if (ratio < 1.2) { alpha_sx = 0.035; alpha_sy = 0.035; } // Lower moments for continuity
         else if (ratio < 1.5) { alpha_sx = 0.045; alpha_sy = 0.028; }
         else { alpha_sx = 0.06; alpha_sy = 0.020; }
    }
    // Need separate coefficients for mid-span and support, positive/negative... this is too simple.
    // Placeholder - requires lookup tables based on detailed support conditions.
    console.warn("CRITICAL: Using highly simplified placeholder two-way slab coefficients. Results are indicative only. Refer to EC2 Annex E or similar for design.");
    return { alpha_sx, alpha_sy };
};

/**
 * Calculates column moment magnification factor (Simplified EC2 Nominal Curvature).
 * Uses simplified K_r, K_phi=1.0, and curvature calculation.
 * NRd is approximate. More accurate methods exist (e.g., Nominal Stiffness).
 */
export const calculateMomentMagnification = (L0, h_depth, NEd, NRd, M0Ed, Ecm, Ac, As_total = 0) => {
    // L0: Effective buckling length (mm)
    // h_depth: depth in direction of bending (mm)
    // NEd: Design axial load (kN)
    // NRd: Axial resistance (kN) - should ideally include steel contribution
    // M0Ed: First-order moment (kNm)
    // Ecm: Concrete modulus (MPa)
    // Ac: Gross concrete area (mm^2)
    // As_total: Total longitudinal steel area (mm^2)

    if (NEd <= 0 || NRd <= NEd || M0Ed === 0) return { MEd: M0Ed, delta: 1.0, secondOrderEffects: 'Negligible or Unstable' };

    // Refined NRd approximation including steel
    const fyd = (500 / GAMMA_S); // Assume 500 MPa steel if not passed
    const NRd_refined = (ALPHA_CC * Ac * (Ecm / (Ecm + 1000)) /* approx fcd */ + As_total * fyd) * 1e-3; // Very rough NRd with steel

    // Nominal Curvature Method (Simplified)
    const K_r = Math.min(1.0, (NRd_refined - NEd) / (NRd_refined - 0.4 * NRd_refined)); // Correction factor (approx) - EC2 Eq 5.38
    const K_phi = 1.0; // Creep factor (assume 1.0 for simplicity, should be >= 1)
    const epsilon_yd = fyd / ES_MODULUS; // Steel yield strain
    const curvature_1_r = K_r * K_phi * (epsilon_yd / (0.45 * h_depth)); // EC2 Eq 5.34

    // Second order moment M2 = NEd * e2 = NEd * (1/r) * L0^2 / c
    const c = 10; // Factor depending on curvature distribution (approx pi^2 for sine wave)
    const M2 = NEd * curvature_1_r * Math.pow(L0 / 1000, 2) / c; // L0 in m for M2 in kNm

    const MEd = M0Ed + M2; // Total design moment
    const delta = MEd / M0Ed;

    return { MEd, delta, secondOrderEffects: `Magnification Factor delta = ${delta.toFixed(2)} (Nominal Curvature Approx.)` };
};