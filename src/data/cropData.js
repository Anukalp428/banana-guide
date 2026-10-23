/**
 * cropData.js
 *
 * Crop recommendation dataset for FarmerConnect.
 * Separated into its own file for maintainability and readability.
 *
 * ⚠️ DEMO DATA — Sample agricultural dataset for demonstration purposes.
 *    For certified farming practices, please consult your local Agriculture Extension Officer.
 */

// ─── Dropdown options ────────────────────────────────────────────────────────

export const SOIL_TYPES = [
  { value: 'Sandy',  label: '🏜️  Sandy Soil' },
  { value: 'Clay',   label: '🪨  Clay Soil' },
  { value: 'Loamy',  label: '🌿  Loamy Soil' },
  { value: 'Black',  label: '⬛  Black Soil (Regur)' },
];

export const SEASONS = [
  { value: 'Kharif', label: '☔  Kharif — Monsoon (June–Oct)' },
  { value: 'Rabi',   label: '❄️  Rabi — Winter (Nov–Apr)' },
  { value: 'Zaid',   label: '☀️  Zaid — Summer (Apr–June)' },
];

export const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

// ─── Crop recommendation database ────────────────────────────────────────────

export const CROP_DB = {

  // ══════════════════════════════════════════════════════════════
  //  KHARIF — Monsoon season (June to October)
  // ══════════════════════════════════════════════════════════════
  Kharif: {

    Sandy: {
      irrigated: [
        {
          name: 'Groundnut (Peanut)',
          icon: '🥜',
          duration: '110–130 days',
          yield: '2–3 ton/ha',
          waterNeed: 'Low',
          profit: '₹33,000–₹45,000/ha',
          reason: 'Sandy soil drains water rapidly — groundnut roots thrive in loose soil and irrigation produces superior pod yields.',
          tips: ['Inoculate seeds with Rhizobium bacteria', 'Prevent water stagnation in the field', 'Harvest when leaves turn yellow'],
        },
        {
          name: 'Bajra (Pearl Millet)',
          icon: '🌾',
          duration: '70–90 days',
          yield: '2.5–3 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹25,000/ha',
          reason: 'Bajra is drought-hardy and excels in sandy soils. Scheduled irrigation significantly boosts grain production.',
          tips: ['Maintain 45 cm row spacing', 'Thin seedlings early to keep one healthy plant per spot', 'Apply nitrogen top-dressing at critical stages'],
        },
        {
          name: 'Sesame (Til)',
          icon: '🌱',
          duration: '80–95 days',
          yield: '0.5–1 ton/ha',
          waterNeed: 'Low',
          profit: '₹20,000–₹30,000/ha',
          reason: 'Sesame performs exceptionally well in well-drained sandy soil with minimal water needs.',
          tips: ['Sow shallowly as seeds are small', 'Avoid waterlogging completely', 'Harvest promptly once capsules turn golden brown'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Bajra (Pearl Millet)',
          icon: '🌾',
          duration: '70–90 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Low',
          profit: '₹14,000–₹20,000/ha',
          reason: 'Bajra is one of the most drought-tolerant grains, thriving in sandy soils solely on monsoon rain.',
          tips: ['Sow early in Kharif (June–July)', 'Choose locally adapted drought-tolerant varieties', 'Apply mulch to conserve soil moisture'],
        },
        {
          name: 'Moong Dal (Green Gram)',
          icon: '💚',
          duration: '60–75 days',
          yield: '0.8–1.2 ton/ha',
          waterNeed: 'Low',
          profit: '₹15,000–₹22,000/ha',
          reason: 'A short-duration pulse that matures reliably on monsoon rainfall even in light sandy soils.',
          tips: ['Sow with the first substantial monsoon showers', 'Fixes atmospheric nitrogen to enrich soil fertility', 'Harvest once pods mature and dry'],
        },
      ],
    },

    Clay: {
      irrigated: [
        {
          name: 'Paddy (Rice)',
          icon: '🌾',
          duration: '120–150 days',
          yield: '4–6 ton/ha',
          waterNeed: 'High',
          profit: '₹30,000–₹42,000/ha',
          reason: 'Clay soil holds moisture effectively, providing the ideal standing water environment needed for paddy.',
          tips: ['Maintain a 5 cm standing water level in the field', 'Transplant seedlings after 25–30 days', 'Apply nitrogen fertilizer in 3 split doses'],
        },
        {
          name: 'Sugarcane',
          icon: '🎋',
          duration: '12–18 months',
          yield: '60–80 ton/ha',
          waterNeed: 'High',
          profit: '₹55,000–₹70,000/ha',
          reason: 'Clay soil retains high moisture throughout long vegetative cycles, crucial for sugarcane cane elongation.',
          tips: ['Use drip irrigation to save 30–40% water', 'Maintain ratoon crops for a cost-effective second harvest', 'Incorporate organic compost before planting'],
        },
        {
          name: 'Taro (Arbi)',
          icon: '🥔',
          duration: '180–210 days',
          yield: '15–20 ton/ha',
          waterNeed: 'Medium',
          profit: '₹25,000–₹35,000/ha',
          reason: 'Taro thrives in heavy clay soils with consistent moisture and tolerates humid monsoon conditions.',
          tips: ['Plant on raised ridges for optimum root expansion', 'Tolerates partial shade', 'Perform timely weeding during early growth'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Paddy (Short Duration)',
          icon: '🌾',
          duration: '90–110 days',
          yield: '2.5–3.5 ton/ha',
          waterNeed: 'High',
          profit: '₹22,000–₹32,000/ha',
          reason: 'Clay soils trap and retain monsoon rainwater, enabling short-duration paddy cultivation without borewells.',
          tips: ['Select early-maturing varieties (e.g. MTU 1010)', 'Apply balanced fertilizer at the seedling stage', 'Spray neem oil for natural pest prevention'],
        },
        {
          name: 'Urad Dal (Black Gram)',
          icon: '⚫',
          duration: '70–90 days',
          yield: '0.8–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹25,000/ha',
          reason: 'Urad dal matures comfortably under monsoon rains in clay soils without root knot complications.',
          tips: ['Ensure proper surface drainage to avoid waterlogging', 'Sow seeds at a depth of 4 cm', 'Harvest when 80% of pods turn black'],
        },
      ],
    },

    Loamy: {
      irrigated: [
        {
          name: 'Maize (Corn)',
          icon: '🌽',
          duration: '80–95 days',
          yield: '6–8 ton/ha',
          waterNeed: 'Medium',
          profit: '₹28,000–₹38,000/ha',
          reason: 'Loamy soil offers the ideal balance of nutrient holding and drainage for maize; irrigation boosts yields by up to 40%.',
          tips: ['Maintain 60 cm row spacing and 20 cm plant spacing', 'Top-dress with nitrogen fertilizer at knee-high stage', 'Use certified hybrid seeds for maximum yield potential'],
        },
        {
          name: 'Soybean',
          icon: '🫘',
          duration: '90–100 days',
          yield: '2–2.5 ton/ha',
          waterNeed: 'Medium',
          profit: '₹24,000–₹30,000/ha',
          reason: 'Good aeration in loamy soil prevents root diseases while providing high nutrient absorption.',
          tips: ['Inoculate seeds with Rhizobium culture', 'Protect field from water stagnation', 'Irrigation at flowering (R1 stage) is critical'],
        },
        {
          name: 'Paddy (Rice)',
          icon: '🌾',
          duration: '120–150 days',
          yield: '4–5 ton/ha',
          waterNeed: 'High',
          profit: '₹30,000–₹40,000/ha',
          reason: 'Paddy produces excellent yields in loamy soil when properly puddled and supported by irrigation.',
          tips: ['Puddle field thoroughly to build an impervious base', 'Consider the System of Rice Intensification (SRI) to conserve water', 'Apply balanced potash fertilizers'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Soybean',
          icon: '🫘',
          duration: '90–100 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Medium',
          profit: '₹18,000–₹25,000/ha',
          reason: 'Soybean thrives on steady monsoon precipitation; loamy soil retains adequate moisture throughout pod development.',
          tips: ['Sow with the onset of regular monsoon rains', 'Keep field weed-free during the first 30 days', 'Choose high-germination certified seeds'],
        },
        {
          name: 'Pigeon Pea (Tur / Arhar)',
          icon: '🟡',
          duration: '150–180 days',
          yield: '1–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹20,000–₹30,000/ha',
          reason: 'Deep taproot system reaches subsoil moisture reserves, making it very dependable in rainfed loamy soils.',
          tips: ['Excellent for intercropping alongside maize or sorghum', 'Select wilt-resistant tall varieties', 'Install pheromone traps for pod borer management'],
        },
      ],
    },

    Black: {
      irrigated: [
        {
          name: 'Cotton',
          icon: '🌿',
          duration: '180–200 days',
          yield: '2.5–3.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹42,000–₹55,000/ha',
          reason: 'Black regur soil is ideal for cotton; high clay content retains moisture while irrigation boosts boll retention.',
          tips: ['Use Bt cotton varieties for bollworm resistance', 'Adopt 90x60 cm plant spacing', 'Apply potassium fertilizer for superior lint quality'],
        },
        {
          name: 'Soybean',
          icon: '🫘',
          duration: '90–100 days',
          yield: '2–2.5 ton/ha',
          waterNeed: 'Medium',
          profit: '₹24,000–₹32,000/ha',
          reason: 'Naturally rich mineral composition in black soil reduces synthetic fertilizer needs and maximizes yield with irrigation.',
          tips: ['Loosen soil with deep summer tillage', 'Treat seeds with Rhizobium bio-fertilizer', 'Provide one protective irrigation at flowering'],
        },
        {
          name: 'Sunflower',
          icon: '🌻',
          duration: '90–110 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Medium',
          profit: '₹22,000–₹30,000/ha',
          reason: 'Sunflower utilizes the depth and nutrient reserves of black soil; irrigation enhances seed size and oil concentration.',
          tips: ['Sow in north-south rows for maximum sunlight capture', 'Protect flower heads from bird damage during ripening', 'Foliar boron spray improves seed setting'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Cotton (Rainfed)',
          icon: '🌿',
          duration: '200–220 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Low',
          profit: '₹30,000–₹40,000/ha',
          reason: 'Remarkable water-holding capacity in black soil nourishes cotton throughout the monsoon without irrigation infrastructure.',
          tips: ['Select drought-tolerant indigenous or hybrid varieties', 'Perform deep summer ploughing before rains arrive', 'Intercrop with pigeon pea for risk diversification'],
        },
        {
          name: 'Soybean (Rainfed)',
          icon: '🫘',
          duration: '90–100 days',
          yield: '1.2–1.8 ton/ha',
          waterNeed: 'Low',
          profit: '₹15,000–₹22,000/ha',
          reason: 'Residual moisture in black soils sustains rainfed soybean crops reliably across central Indian farming belts.',
          tips: ['Adopt broad bed and furrow (BBF) layout', 'Practice in-situ soil moisture conservation', 'Complete sowing by late June to early July'],
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  RABI — Winter season (November to April)
  // ══════════════════════════════════════════════════════════════
  Rabi: {

    Sandy: {
      irrigated: [
        {
          name: 'Mustard (Sarson)',
          icon: '🌻',
          duration: '110–130 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Low',
          profit: '₹22,000–₹30,000/ha',
          reason: 'Mustard roots penetrate deep into sandy soil; thrives in cool winter temperatures with modest irrigation.',
          tips: ['Sow in lines and thin seedlings early', 'Spray neem oil or organic repellents for aphid control', '2–3 irrigations are sufficient'],
        },
        {
          name: 'Chickpea (Chana)',
          icon: '🫘',
          duration: '100–110 days',
          yield: '1.5–2 ton/ha',
          waterNeed: 'Low',
          profit: '₹20,000–₹28,000/ha',
          reason: 'Fast drainage in sandy soil avoids root rot; light irrigation ensures healthy pod formation.',
          tips: ['Suitable for both Desi and Kabuli varieties', 'Ensure row spacing to avoid fungal issues', 'Stop irrigation once pods mature'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Mustard (Sarson)',
          icon: '🌻',
          duration: '110–130 days',
          yield: '0.8–1.2 ton/ha',
          waterNeed: 'Low',
          profit: '₹14,000–₹20,000/ha',
          reason: 'A hardy oilseed that can mature on post-monsoon residual soil moisture in sandy terrains.',
          tips: ['Sow early in November to utilize remaining moisture', 'Choose drought-hardy regional varieties', 'Apply basal fertilizer at sowing time'],
        },
      ],
    },

    Clay: {
      irrigated: [
        {
          name: 'Wheat',
          icon: '🌾',
          duration: '120–150 days',
          yield: '4–5 ton/ha',
          waterNeed: 'Medium',
          profit: '₹35,000–₹45,000/ha',
          reason: 'Clay soil holds nutrients securely, enabling optimal fertilizer uptake and high grain yields under irrigation.',
          tips: ['Irrigate at critical stages: crown root initiation, tillering, and flowering', 'Choose disease-resistant high-yield varieties', 'Complete sowing by mid-November'],
        },
        {
          name: 'Field Peas',
          icon: '🟢',
          duration: '90–100 days',
          yield: '3–4 ton/ha',
          waterNeed: 'Low',
          profit: '₹26,000–₹35,000/ha',
          reason: 'Moisture-retaining clay soil reduces irrigation needs to primarily seedling and flowering stages.',
          tips: ['Provide bamboo or wire trellis support for tall vines', 'Prevent powdery mildew with timely organic sprays', 'Harvest tender green pods regularly'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Lentil (Masoor Dal)',
          icon: '🟤',
          duration: '100–120 days',
          yield: '1–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹25,000/ha',
          reason: 'Lentil grows reliably on residual moisture in clay fields without supplemental winter watering.',
          tips: ['Sow shallowly at 3–4 cm depth', 'Fixes nitrogen to nourish soil for the next crop', 'Protect seedlings against heavy frost'],
        },
        {
          name: 'Chickpea (Desi Chana)',
          icon: '🫘',
          duration: '100–110 days',
          yield: '1–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹15,000–₹22,000/ha',
          reason: 'Desi chickpea features deep roots capable of drawing subsoil moisture stored in heavy clay.',
          tips: ['Sow by late October ahead of peak winter cold', 'Monitor for gram pod borer pests', 'Line sowing delivers higher yields than broadcasting'],
        },
      ],
    },

    Loamy: {
      irrigated: [
        {
          name: 'Wheat',
          icon: '🌾',
          duration: '120–150 days',
          yield: '5–6 ton/ha',
          waterNeed: 'Medium',
          profit: '₹42,000–₹52,000/ha',
          reason: 'Loamy soil is the gold standard for wheat, providing optimal root aeration and moisture retention for peak yields.',
          tips: ['Use high-yielding certified seeds (e.g., HD-2967, WH-1105)', 'Provide 4–5 scheduled irrigations', 'Apply balanced NPK as basal dose at sowing'],
        },
        {
          name: 'Potato',
          icon: '🥔',
          duration: '75–120 days',
          yield: '25–35 ton/ha',
          waterNeed: 'Medium',
          profit: '₹50,000–₹80,000/ha',
          reason: 'Loose, friable loamy soil allows uniform tuber expansion and smooth harvesting without damage.',
          tips: ['Plant in raised ridges for aeration and drainage', 'Provide 5–6 light, regular irrigations', 'Follow a preventive blight management schedule'],
        },
        {
          name: 'Mustard (Sarson)',
          icon: '🌻',
          duration: '110–130 days',
          yield: '2–2.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹26,000–₹35,000/ha',
          reason: 'Well-spread root networks in loamy soil maximize nutrient uptake; irrigation boosts oil concentration.',
          tips: ['Thin seedlings to 15–20 cm spacing', 'Irrigate during flowering and pod development', 'Monitor regularly for mustard aphids'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Wheat (Rainfed)',
          icon: '🌾',
          duration: '120–150 days',
          yield: '2.5–3.5 ton/ha',
          waterNeed: 'Medium',
          profit: '₹22,000–₹30,000/ha',
          reason: 'Substantial moisture storage in deep loam supports winter wheat sown on preserved post-monsoon moisture.',
          tips: ['Sow between October 25 and November 10', 'Capitalize on morning dew and stored moisture', 'Adopt zero-tillage to minimize water loss'],
        },
        {
          name: 'Barley (Jau)',
          icon: '🌾',
          duration: '100–120 days',
          yield: '2.5–4 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹28,000/ha',
          reason: 'More drought-hardy and salt-tolerant than wheat; performs exceptionally well under rainfed conditions.',
          tips: ['Excels across varied loam textures', 'Malt-grade varieties command premium market prices', 'Low input requirement crop'],
        },
      ],
    },

    Black: {
      irrigated: [
        {
          name: 'Wheat',
          icon: '🌾',
          duration: '120–150 days',
          yield: '3.5–5 ton/ha',
          waterNeed: 'Medium',
          profit: '₹32,000–₹42,000/ha',
          reason: 'Black soils supply abundant natural potassium and minerals; yields heavily with 3–4 scheduled irrigations.',
          tips: ['Extremely popular across central India', 'Prepare field with deep ploughing', '3–4 irrigations are generally adequate'],
        },
        {
          name: 'Chickpea (Chana)',
          icon: '🫘',
          duration: '100–110 days',
          yield: '1.8–2.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹22,000–₹32,000/ha',
          reason: 'Black soil moisture supports deep root development; watering is needed only at critical branching and pod filling.',
          tips: ['Select wilt-resistant Desi varieties', 'Avoid excess water to prevent vegetative overgrowth', 'Provide one light irrigation at pod filling'],
        },
        {
          name: 'Linseed (Flaxseed)',
          icon: '🌱',
          duration: '100–120 days',
          yield: '0.8–1.2 ton/ha',
          waterNeed: 'Low',
          profit: '₹15,000–₹22,000/ha',
          reason: 'A profitable oilseed crop that capitalizes on black soil water retention with very little supplemental irrigation.',
          tips: ['Sow uniformly in rows for consistent emergence', 'Monitor for rust and powdery mildew', 'Thresh carefully to avoid seed breakage'],
        },
      ],
      nonIrrigated: [
        {
          name: 'Chickpea (Rainfed)',
          icon: '🫘',
          duration: '100–110 days',
          yield: '1.2–1.8 ton/ha',
          waterNeed: 'Low',
          profit: '₹16,000–₹24,000/ha',
          reason: 'Deep black soil stores ample subsoil moisture to bring chickpea to maturity without supplemental watering.',
          tips: ['Ideal for central Indian rainfed belts', 'Assess seedbed moisture before sowing', 'Deep root system tolerates moisture stress'],
        },
        {
          name: 'Safflower (Kusum)',
          icon: '🌼',
          duration: '130–150 days',
          yield: '1–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹25,000/ha',
          reason: 'One of the most drought-hardy oilseeds; deep taproots extract subsoil moisture up to 2 meters deep.',
          tips: ['Deep taproots access subsoil moisture reserves', 'Protect from rust disease during vegetative growth', 'Wear heavy protective gloves during harvest'],
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  ZAID — Summer season (April to June)
  // ══════════════════════════════════════════════════════════════
  Zaid: {

    Sandy: {
      irrigated: [
        {
          name: 'Watermelon',
          icon: '🍉',
          duration: '75–90 days',
          yield: '30–40 ton/ha',
          waterNeed: 'Medium',
          profit: '₹50,000–₹70,000/ha',
          reason: 'Warm sandy soil promotes deep root growth and rapid drainage, preventing fruit rot; high summer consumer demand.',
          tips: ['Popular in riverbed and dryland farming', 'Use drip irrigation to reduce water usage by 40%', 'Use silver-black plastic mulch for weed and heat control'],
        },
        {
          name: 'Cucumber',
          icon: '🥒',
          duration: '55–70 days',
          yield: '15–20 ton/ha',
          waterNeed: 'Medium',
          profit: '₹28,000–₹40,000/ha',
          reason: 'Fast-growing vine crop that thrives in warm, sandy soils with rapid drainage.',
          tips: ['Train vines on trellises for higher yield and clean fruit', 'Harvest every 2–3 days for crisp fruits', 'Irrigate during early morning rather than afternoon heat'],
        },
      ],
      nonIrrigated: [
        {
          name: '⚠️ Summer Irrigation Required',
          icon: '💧',
          duration: '—',
          yield: '—',
          waterNeed: 'High',
          profit: '—',
          reason: 'High summer temperatures (April–June) cause rapid soil evaporation; cultivation in sandy soil without irrigation is not viable.',
          tips: [
            'Arrange dependable irrigation before planting summer crops',
            'Ensure access to borewell or canal supply',
            'Consider resting the soil until the Kharif monsoon begins',
          ],
        },
      ],
    },

    Clay: {
      irrigated: [
        {
          name: 'Bitter Gourd (Karela)',
          icon: '🥬',
          duration: '60–80 days',
          yield: '10–15 ton/ha',
          waterNeed: 'Medium',
          profit: '₹24,000–₹38,000/ha',
          reason: 'Clay soil maintains the continuous moisture required for vigorous summer cucurbit vine growth.',
          tips: ['Erect sturdy 6-foot trellises for support', 'Harvest every 3–4 days to encourage new fruiting', 'Maintain good bee pollination or hand-pollinate'],
        },
        {
          name: 'Bottle Gourd (Lauki)',
          icon: '🫙',
          duration: '60–75 days',
          yield: '20–30 ton/ha',
          waterNeed: 'Medium',
          profit: '₹20,000–₹30,000/ha',
          reason: 'High yield potential when supplied with regular moisture in moisture-retaining clay soil.',
          tips: ['Plant seeds on raised beds or mounds', 'Train main vines on overhead wires', 'Harvest tender fruits around 500–700 grams'],
        },
      ],
      nonIrrigated: [
        {
          name: '⚠️ Clay Soil Zaid — Irrigation Required',
          icon: '💧',
          duration: '—',
          yield: '—',
          waterNeed: 'High',
          profit: '—',
          reason: 'Extreme summer heat quickly dries out the soil surface; growing summer crops without irrigation carries high risk.',
          tips: [
            'Secure reliable irrigation before summer planting',
            'Ensure connection to irrigation channels or tubewells',
            'Alternatively, sow green manure crops to build organic matter for Kharif',
          ],
        },
      ],
    },

    Loamy: {
      irrigated: [
        {
          name: 'Watermelon',
          icon: '🍉',
          duration: '75–90 days',
          yield: '35–45 ton/ha',
          waterNeed: 'Medium',
          profit: '₹55,000–₹80,000/ha',
          reason: 'Loam combined with drip irrigation provides the premier summer environment for sweet, uniform watermelons.',
          tips: ['Install drip irrigation systems', 'Apply black plastic mulch to preserve soil moisture', 'Test brix sweetness levels prior to bulk harvest'],
        },
        {
          name: 'Moong Dal (Catch Crop)',
          icon: '💚',
          duration: '60–65 days',
          yield: '1–1.5 ton/ha',
          waterNeed: 'Low',
          profit: '₹20,000–₹28,000/ha',
          reason: 'Fast 60-day summer catch crop that fits neatly before Kharif while fixing atmospheric nitrogen.',
          tips: ['Sow promptly in early April', '2–3 light irrigations are typically sufficient', 'Vacates the field well ahead of main monsoon planting'],
        },
        {
          name: 'Tomato',
          icon: '🍅',
          duration: '70–90 days',
          yield: '25–35 ton/ha',
          waterNeed: 'Medium',
          profit: '₹40,000–₹70,000/ha',
          reason: 'Loamy soil ensures superior root aeration and consistent nutrient uptake, yielding high-grade summer tomatoes.',
          tips: ['Stake plants securely to protect fruit from ground contact', 'Monitor for leaf curl virus and whiteflies', 'Combine drip irrigation with mulch for best results'],
        },
      ],
      nonIrrigated: [
        {
          name: '⚠️ Loamy + No Irrigation — Limited Options',
          icon: '💧',
          duration: '—',
          yield: '—',
          waterNeed: 'High',
          profit: '—',
          reason: 'Loamy soils lose surface moisture rapidly under summer heat; rainfed summer cropping is unviable.',
          tips: [
            'If minimal water is available, consider short-duration moong dal',
            'Grow sunn hemp or dhaincha as green manure',
            'Prepare field and await the Kharif monsoon for best yields',
          ],
        },
      ],
    },

    Black: {
      irrigated: [
        {
          name: 'Sesame (Til)',
          icon: '🌱',
          duration: '80–90 days',
          yield: '0.8–1.2 ton/ha',
          waterNeed: 'Low',
          profit: '₹18,000–₹28,000/ha',
          reason: 'Deep moisture retention in black soil combined with light irrigation produces high oil content in summer sesame.',
          tips: ['Sow uniformly in rows for consistent emergence', '2–3 irrigations are sufficient', 'Thresh harvested bundles over clean tarpaulins'],
        },
        {
          name: 'Moong Dal',
          icon: '💚',
          duration: '60–70 days',
          yield: '0.8–1.2 ton/ha',
          waterNeed: 'Low',
          profit: '₹15,000–₹22,000/ha',
          reason: 'Stored subsoil moisture in black soil plus supplemental irrigation allows rapid summer pulse harvesting.',
          tips: ['Sow early by mid-April', 'Apply targeted spot irrigation rather than flood irrigation', 'Follow integrated pest management (IPM) guidelines'],
        },
      ],
      nonIrrigated: [
        {
          name: '⚠️ Black Soil Zaid — Cautious Approach',
          icon: '💧',
          duration: '—',
          yield: '—',
          waterNeed: 'Medium',
          profit: '—',
          reason: 'Although black soils retain subsoil moisture, high summer temperatures (April–June) make rainfed farming precarious.',
          tips: [
            'Attempt only ultra-short duration pulses if residual moisture permits',
            'Use mulch cover to minimize evaporation loss',
            'Conduct a small trial plot before committing large acreage',
          ],
        },
      ],
    },
  },
};

// ─── State Agricultural Specialities (Rule-based agronomic mapping) ─────────
const STATE_SPECIALTIES = {
  'Punjab': ['Wheat', 'Paddy (Rice)', 'Cotton', 'Maize (Corn)', 'Sugarcane', 'Potato', 'Mustard (Sarson)'],
  'Haryana': ['Wheat', 'Paddy (Rice)', 'Mustard (Sarson)', 'Cotton', 'Sugarcane', 'Bajra (Pearl Millet)'],
  'Uttar Pradesh': ['Wheat', 'Sugarcane', 'Potato', 'Paddy (Rice)', 'Mustard (Sarson)', 'Moong Dal', 'Field Peas'],
  'Madhya Pradesh': ['Soybean', 'Wheat', 'Chickpea (Chana)', 'Chickpea (Desi Chana)', 'Mustard (Sarson)', 'Linseed (Flaxseed)'],
  'Maharashtra': ['Cotton', 'Soybean', 'Sugarcane', 'Chickpea (Chana)', 'Safflower (Kusum)', 'Linseed (Flaxseed)'],
  'Gujarat': ['Groundnut (Peanut)', 'Cotton', 'Bajra (Pearl Millet)', 'Sesame (Til)', 'Mustard (Sarson)'],
  'Rajasthan': ['Bajra (Pearl Millet)', 'Mustard (Sarson)', 'Moong Dal', 'Groundnut (Peanut)', 'Sesame (Til)'],
  'Bihar': ['Paddy (Rice)', 'Maize (Corn)', 'Wheat', 'Potato', 'Lentil (Masoor Dal)'],
  'West Bengal': ['Paddy (Rice)', 'Potato', 'Taro (Arbi)', 'Moong Dal'],
  'Assam': ['Paddy (Rice)', 'Taro (Arbi)', 'Field Peas'],
  'Andhra Pradesh': ['Paddy (Rice)', 'Groundnut (Peanut)', 'Cotton', 'Maize (Corn)', 'Sesame (Til)'],
  'Telangana': ['Cotton', 'Paddy (Rice)', 'Maize (Corn)', 'Soybean', 'Moong Dal'],
  'Karnataka': ['Maize (Corn)', 'Groundnut (Peanut)', 'Cotton', 'Sunflower', 'Paddy (Rice)'],
  'Tamil Nadu': ['Paddy (Rice)', 'Sugarcane', 'Groundnut (Peanut)', 'Sesame (Til)', 'Cotton'],
  'Kerala': ['Paddy (Rice)', 'Taro (Arbi)', 'Field Peas'],
  'Odisha': ['Paddy (Rice)', 'Moong Dal', 'Groundnut (Peanut)'],
  'Chhattisgarh': ['Paddy (Rice)', 'Soybean', 'Chickpea (Chana)', 'Linseed (Flaxseed)'],
  'Jharkhand': ['Paddy (Rice)', 'Maize (Corn)', 'Lentil (Masoor Dal)'],
  'Himachal Pradesh': ['Wheat', 'Maize (Corn)', 'Field Peas', 'Potato'],
  'Uttarakhand': ['Wheat', 'Paddy (Rice)', 'Sugarcane', 'Field Peas'],
};

// ─── Helper function ──────────────────────────────────────────────────────────

export function getRecommendations(season, soil, irrigated, state = '', nutrients = {}) {
  if (!season || !soil) return [];

  const seasonData = CROP_DB[season];
  if (!seasonData) return [];

  const soilData = seasonData[soil];
  if (!soilData) return [];

  const rawCrops = irrigated ? soilData.irrigated : soilData.nonIrrigated;
  if (!rawCrops || !Array.isArray(rawCrops)) return [];

  // Parse numerical nutrient parameters
  const ph = nutrients.ph ? parseFloat(nutrients.ph) : null;
  const n = nutrients.n ? parseFloat(nutrients.n) : null;
  const p = nutrients.p ? parseFloat(nutrients.p) : null;
  const k = nutrients.k ? parseFloat(nutrients.k) : null;

  // Clone objects so we don't mutate the base database
  const crops = rawCrops.map(c => {
    const crop = { ...c };
    const advisoryNotes = [];

    // 1. Soil pH Rule Assessment
    if (ph !== null && !isNaN(ph)) {
      if (ph < 5.5) {
        if (/paddy|rice|taro/i.test(crop.name)) {
          advisoryNotes.push(`Acid-tolerant crop (pH ${ph})`);
        } else {
          advisoryNotes.push(`Low pH (${ph}): Liming recommended for yield protection`);
        }
      } else if (ph > 8.0) {
        if (/cotton|mustard|barley/i.test(crop.name)) {
          advisoryNotes.push(`Alkaline-tolerant crop (pH ${ph})`);
        } else {
          advisoryNotes.push(`Alkaline pH (${ph}): Gypsum application advised`);
        }
      } else {
        advisoryNotes.push(`Optimal pH ${ph} for balanced nutrient uptake`);
      }
    }

    // 2. Nitrogen (N) Rule Assessment
    if (n !== null && !isNaN(n)) {
      const isLegume = /dal|gram|soybean|pea|groundnut|lentil/i.test(crop.name);
      if (n < 50 && isLegume) {
        crop.isNitrogenFixer = true;
        advisoryNotes.push(`Biological N-fixer: Ideal for low N soil (${n} kg/ha)`);
      } else if (n > 90 && !isLegume) {
        advisoryNotes.push(`High N demand matched (${n} kg/ha soil level)`);
      }
    }

    // 3. Potassium (K) & Phosphorus (P) Rule Assessment
    if (k !== null && !isNaN(k) && k > 80) {
      if (/potato|taro|cotton|sugarcane/i.test(crop.name)) {
        advisoryNotes.push(`High K availability (${k} kg/ha) promotes tuber & fiber quality`);
      }
    }

    if (advisoryNotes.length > 0) {
      crop.nutrientAdvisory = advisoryNotes.join(' • ');
    }

    return crop;
  });

  if (state && STATE_SPECIALTIES[state]) {
    const popularInState = STATE_SPECIALTIES[state];
    crops.forEach(crop => {
      const matches = popularInState.some(p => crop.name.toLowerCase().includes(p.toLowerCase()));
      if (matches) {
        crop.isStateRecommended = true;
        crop.stateNote = `High commercial suitability in ${state}`;
      }
    });
  }

  // Sort: state-recommended and nutrient-optimized crops first
  crops.sort((a, b) => {
    const scoreA = (a.isStateRecommended ? 2 : 0) + (a.isNitrogenFixer ? 1 : 0);
    const scoreB = (b.isStateRecommended ? 2 : 0) + (b.isNitrogenFixer ? 1 : 0);
    return scoreB - scoreA;
  });

  return crops;
}
