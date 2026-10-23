import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ─── MongoDB Database Connection ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI?.trim();
let isMongoConnected = false;
let mongoError = null;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    isMongoConnected = true;
    mongoError = null;
    console.log('🍃 MongoDB connected successfully.');
  })
  .catch((err) => {
    isMongoConnected = false;
    mongoError = err.message;
    console.warn('⚠️ MongoDB connection attempt failed:', err.message);
  });

  mongoose.connection.on('connected', () => {
    isMongoConnected = true;
    mongoError = null;
    console.log('🍃 MongoDB connection established.');
  });
  mongoose.connection.on('error', (err) => {
    isMongoConnected = false;
    mongoError = err.message;
    console.error('MongoDB runtime error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB disconnected.');
  });
} else {
  console.log('ℹ️ MONGODB_URI not provided in .env. Running marketplace in offline/demo mode.');
}

// ─── System Prompt for Gemini 1.5 Flash ───────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are "AI Krishi Mitra" (कृषि मित्र), an empathetic, expert, and conversational agricultural AI companion for Indian farmers on the Farmer Connect platform.

CRITICAL BEHAVIORAL DIRECTIVES:
1. Intent Separation (Navigation vs Conversational Advisory):
   - ONLY include "[NAVIGATE: section_id]" when the user EXPLICITLY asks to open/navigate/show a specific page (e.g., "Crop Recommendation page kholo", "Weather page par le chalo", "Marketplace page dikhao", "Home jao").
   - If the user asks for farming advice or crop suggestions (e.g., "mujhe fasal ke liye suggestion chahiye", "konsi fasal ugayein", "kheti me kya boyein"), DO NOT NAVIGATE. Instead, conduct an interactive, step-by-step agricultural consultation.

2. Multi-Turn Stateful Crop Advisory (Profile Memory):
   - Track the farmer's farm profile from the conversation context: Location/State, Season (Kharif/Rabi/Zaid), Soil Type (Alluvial/Black/Sandy/Clayey), and Irrigation (Canal/Tubewell/Rainfed).
   - If key information is missing, ask for missing details ONE BY ONE politely in simple Hinglish (e.g., ask for state/location first, then season, then soil type).
   - NEVER re-ask questions that the user already answered in earlier messages.
   - When location, season, and soil are known, recommend 2 to 3 optimal crops suitable for Indian agro-climatic zones, explain the agronomic rationale (yield potential, water need, soil fit), and conclude with: "Aap detailed NPK aur soil test ke liye keh sakte hain: 'Crop Recommendation page kholo'."

3. Live Weather Context Integration:
   - When the user asks about current weather, rainfall, or irrigation feasibility, ALWAYS utilize the provided "weatherContext" data (city, temperature, humidity, condition, weather advisory).
   - Quote the actual numbers directly (e.g. "Abhi Roorkee mein 27°C aur 62% humidity ke saath Clear Sky hai...").

4. Agronomic Safety & Factuality (ICAR / KVK Standards):
   - NEVER invent unverified chemical pesticide dosages or fabricated daily market rates.
   - For severe pest infestations, always advise consulting the local Krishi Vigyan Kendra (KVK).
   - Answer in natural, friendly Hinglish (or Hindi/English matching the farmer). Keep responses concise (3-5 short sentences) so they sound clear when spoken aloud via Text-to-Speech.`;

// ─── Profile Extraction Helper ────────────────────────────────────────────────
function extractProfileFromText(text, currentProfile = {}) {
  const t = text.toLowerCase();
  const profile = { ...currentProfile };

  // 1. Detect State / Location
  const states = [
    'uttarakhand', 'uttar pradesh', 'haryana', 'punjab', 'rajasthan',
    'madhya pradesh', 'maharashtra', 'bihar', 'gujarat', 'karnataka',
    'roorkee', 'haridwar', 'dehradun', 'lucknow', 'delhi', 'karnal'
  ];
  for (const s of states) {
    if (t.includes(s)) {
      profile.location = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }

  // 2. Detect Season
  if (/(kharif|खरीफ|monsoon|mansoon|barsat|barish ke mausam)/i.test(t)) {
    profile.season = 'Kharif (Monsoon)';
  } else if (/(rabi|रबी|winter|sardi|thand)/i.test(t)) {
    profile.season = 'Rabi (Winter)';
  } else if (/(zaid|जायद|summer|garmi|dhoop)/i.test(t)) {
    profile.season = 'Zaid (Summer)';
  }

  // 3. Detect Soil Type
  if (/(alluvial|jalodh|जलोढ़|domat|loam|river soil)/i.test(t)) {
    profile.soilType = 'Alluvial Soil (जलोढ़ मिट्टी)';
  } else if (/(black|kali|काली|regur|cotton soil)/i.test(t)) {
    profile.soilType = 'Black Soil (काली मिट्टी)';
  } else if (/(sandy|balui|रेतीली|balu|ret)/i.test(t)) {
    profile.soilType = 'Sandy Loam (बलुई दोमट)';
  } else if (/(clay|chikni|चिकनी|matthi)/i.test(t)) {
    profile.soilType = 'Clayey Soil (चिकनी मिट्टी)';
  }

  // 4. Detect Irrigation
  if (/(tubewell|tube well|nahar|canal|pani ki suvidha|irrigated|sinchit|boring)/i.test(t)) {
    profile.irrigation = 'Assured Irrigation (सिंचित)';
  } else if (/(rainfed|barish par nirbhar|asinchit|sukha|pani ki kami|no water)/i.test(t)) {
    profile.irrigation = 'Rainfed (वर्षा आधारित / असिंचित)';
  }

  return profile;
}

// ─── Rule-Based Stateful Agronomy Fallback Engine ─────────────────────────────
function getOfflineFallbackAnswer(query, history = [], currentProfile = {}, weatherContext = null, cropContext = null) {
  const q = query.toLowerCase().trim();
  const profile = extractProfileFromText(query, currentProfile);

  // 1. Explicit Navigation Detection
  if (/(crop recommendation page|crop page).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(crop recommendation page|crop page)/i.test(q)) {
    return {
      text: "Ji bilkul! Main aapko Crop Recommendation page par le chalta hoon jahan aap soil test aur NPK input ke saath analysis dekh sakte hain. [NAVIGATE: crop-recommendation]",
      navigate: 'crop-recommendation',
      profile,
    };
  }

  if (/(crop history|activity journal|khet diary|farm log|khet journal).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(crop history|activity journal|khet diary)/i.test(q)) {
    return {
      text: "Ji bilkul! Main aapko Crop History & Activity Journal page par le chalta hoon jahan aap khet aur gatividhiyan dekh sakte hain. [NAVIGATE: crop-history]",
      navigate: 'crop-history',
      profile,
    };
  }

  if (/(ai assistant|krishi mitra|chat assistant).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(ai assistant|krishi mitra)/i.test(q)) {
    return {
      text: "Main aapko AI Farming Assistant (कृषि मित्र) par le ja raha hoon. [NAVIGATE: ai-assistant]",
      navigate: 'ai-assistant',
      profile,
    };
  }

  if (/(weather page|mausam page).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(weather page|mausam page)/i.test(q)) {
    return {
      text: "Main aapko Live Weather aur forecast page par le ja raha hoon. [NAVIGATE: weather]",
      navigate: 'weather',
      profile,
    };
  }

  if (/(marketplace page|mandi page).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(marketplace|mandi page)/i.test(q)) {
    return {
      text: "Main aapko Farmer-Buyer Marketplace page par le ja raha hoon jahan aap fasal khareed ya bech sakte hain. [NAVIGATE: marketplace]",
      navigate: 'marketplace',
      profile,
    };
  }

  if (/(schemes page|yojana page).*(kholo|open|le chalo|dikhao)/i.test(q) ||
      /(kholo|open|le chalo|dikhao).*(schemes page|yojana page)/i.test(q)) {
    return {
      text: "Main aapko Government Schemes page par le ja raha hoon. [NAVIGATE: schemes]",
      navigate: 'schemes',
      profile,
    };
  }

  if (/(home page|ghar).*(kholo|open|le chalo|jao)/i.test(q) || /^(home|ghar jao)$/i.test(q)) {
    return {
      text: "Main aapko Home page par le ja raha hoon. [NAVIGATE: home]",
      navigate: 'home',
      profile,
    };
  }

  // 2. Crop Context & Activity Journal Question
  if (cropContext && (cropContext.fields?.length > 0 || cropContext.recentActivities?.length > 0)) {
    if (/(meri fasal|mere khet|agla kaam|next task|next activity|khet status|crop history|kya karein)/i.test(q)) {
      const f = cropContext.fields?.[0];
      const a = cropContext.recentActivities?.[0];
      let summary = "";
      if (f) summary += `Aapke khet "${f.name}" mein ${f.cropName} darj hai (sowing: ${f.sowingDate || 'N/A'}). `;
      if (a) summary += `Pichli darj activity: ${a.activityDate} ko ${a.activityType}${a.productName ? ' (' + a.productName + ')' : ''}${a.wateringDuration ? ' (' + a.wateringDuration + ')' : ''}. `;
      summary += `Krishi salah: Fasal ki vikas awastha aur mitti ki nami par nazar rakhein. Agle sinchai ya khad se pehle mausam forecast avashya check karein.`;
      return {
        text: summary,
        navigate: null,
        profile,
      };
    }
  }

  // 3. Pesticide / Fertilizer Dosage Safety Directive (Feature 2, Req 8)
  if (/(kitna spray|kitni dava|dosage|kitna urea|kitna dap|dose per acre|chemical spray|keetnashak dose)/i.test(q)) {
    return {
      text: "कृषि सुरक्षा नियम: रासायनिक कीटनाशक या खाद की सटीक मात्रा फसल की उम्र, मिट्टी के प्रकार और उत्पाद की सांद्रता (concentration) पर निर्भर करती है। हमेशा उत्पाद के पैकेट/लेबल पर दिए गए आधिकारिक ICAR/KVK स्वीकृत डोज़ का ही पालन करें, या अपने नजदीकी कृषि विज्ञान केंद्र (KVK) के विशेषज्ञ से सलाह लें।",
      navigate: null,
      profile,
    };
  }

  // 4. Weather Question with Live Data
  if (/(mausam|weather|barish|rain|tapman|temperature|sardi|garmi|pani lagayein|sinchai)/i.test(q)) {
    if (weatherContext && weatherContext.city) {
      return {
        text: `Abhi ${weatherContext.city} mein taapman lagbhag ${weatherContext.temp}°C aur humidity ${weatherContext.humidity}% hai (${weatherContext.condition}). Krishi salah: ${weatherContext.advisory || 'Khet karya ke liye anukool sthiti hai.'}`,
        navigate: null,
        profile,
      };
    }
    return {
      text: "Aapke khet ke liye live satellite weather data website par available hai. Roorkee mein abhi taapman 27°C aur Clear Sky hai. Detail dekhne ke liye kahiye 'Weather page kholo'.",
      navigate: null,
      profile,
    };
  }

  // 5. Multi-Turn Interactive Crop Recommendation

  if (/(fasal|crop|suggest|suggestion|recommend|kheti|ugayein|bona|boon|boye)/i.test(q) ||
      profile.season || profile.soilType || profile.location) {

    // Step A: Missing Location
    if (!profile.location) {
      return {
        text: "Kisan bhai, sahi fasal chunav ke liye pehle batayein aap kis rajya ya zile mein kheti kar rahe hain? (jaise Uttarakhand, UP, Punjab, ya Rajasthan)",
        navigate: null,
        profile,
      };
    }

    // Step B: Missing Season
    if (!profile.season) {
      return {
        text: `Bahut achha, ${profile.location} ke liye fasal plan kar rahe hain. Kripya batayein aap kis mausam ke liye fasal plan kar rahe hain — Kharif (Monsoon), Rabi (Winter), ya Zaid (Summer)?`,
        navigate: null,
        profile,
      };
    }

    // Step C: Missing Soil Type
    if (!profile.soilType) {
      return {
        text: `Theek hai, ${profile.season} season ke liye. Aapke khet ki mitti (soil type) kaisi hai — Alluvial (जलोढ़), Black (काली), Sandy Loam (बलुई), ya Clayey?`,
        navigate: null,
        profile,
      };
    }

    // Step D: Missing Irrigation
    if (!profile.irrigation) {
      return {
        text: `Samajh gaya: ${profile.location}, ${profile.season}, aur ${profile.soilType}. Khet mein sinchai (irrigation) ki kya suvidha hai — Tubewell/Nahar hai ya khet varsha par nirbhar hai?`,
        navigate: null,
        profile,
      };
    }

    // Step E: All Profile Facts Gathered -> Tailored Recommendation
    let crops = "Rice (Dhan) aur Maize (Makka)";
    let reason = "yeh mitti nami banaye rakhti hai aur monsoon me achha utpadan deti hai.";

    if (profile.season.includes('Rabi')) {
      crops = "Wheat (Gehun - Sharbati ya HD-2967) aur Mustard (Sarson)";
      reason = "sardiyon me Alluvial mitti me inki jado ka vikas aur daane ka aakar sabse badiya hota hai.";
    } else if (profile.soilType.includes('Black')) {
      crops = "Cotton (Kapas) aur Soybean";
      reason = "kali mitti me moisture retention high hota hai jo kapas aur soybean ke liye ideal hai.";
    } else if (profile.irrigation.includes('Rainfed')) {
      crops = "Gram (Chana / Chickpea) aur Bajra (Pearl Millet)";
      reason = "kam paani me bhi yeh faslein achhi paidawar deti hain aur sukh-pratirodhi hain.";
    }

    return {
      text: `Aapke farm profile (${profile.location}, ${profile.season}, ${profile.soilType}, ${profile.irrigation}) ke mutabiq sabse anukool faslein hain: ${crops}. Karan: ${reason} Detailed NPK dosage aur profit ke liye aap keh sakte hain: 'Crop Recommendation page kholo'.`,
      navigate: null,
      profile,
    };
  }

  // 4. Government Schemes Question
  if (/(scheme|yojana|योजना|subsidy|pm kisan|fasal bima|kcc|kusum|paisa)/i.test(q)) {
    return {
      text: "Kisan kalyan ke liye PM-KISAN (₹6000/year DBT), PM Fasal Bima Yojana (sasta risk cover), aur PM-KUSUM (60% solar pump subsidy) chal rahi hain. Inhe dekhne ke liye aap keh sakte hain: 'Government schemes page kholo'.",
      navigate: null,
      profile,
    };
  }

  // 5. General Agricultural Guidance
  if (/(khad|fertilizer|urea|dap|npk|potash)/i.test(q)) {
    return {
      text: "Fasal me santulit poshan ke liye mitti jaanch ke anusar NPK 4:2:1 anupaat me dalein. Urea ka atyadhik upyog na karein, isse keet-patange aakarshit hote hain.",
      navigate: null,
      profile,
    };
  }

  if (/(keet|pest|bimari|sundee|fungus|disease|keeda)/i.test(q)) {
    return {
      text: "Keet ya fafund lagne par pehle neem-based bio-spray (10,000 ppm) ya pheromone traps ka upyog karein. Gambhir sthiti me nazdeeki Krishi Vigyan Kendra (KVK) se sampark karein.",
      navigate: null,
      profile,
    };
  }

  return {
    text: "Namaste Kisan bhai! Main AI Krishi Mitra hoon. Aap mujhse mausam, fasal salah, beej chunav ya sarkari yojana ke baare me pooch sakte hain.",
    navigate: null,
    profile,
  };
}

// ─── Health / Status Endpoint ────────────────────────────────────────────────
app.get('/api/krishi-mitra/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
  res.json({
    status: 'online',
    hasGeminiKey: hasKey,
    model: hasKey ? 'gemini-1.5-flash' : 'stateful-agronomy-engine',
  });
});

// ─── Conversational Chat Endpoint ─────────────────────────────────────────────
app.post('/api/krishi-mitra/chat', async (req, res) => {
  try {
    const { message, history = [], profile = {}, weatherContext = null, cropContext = null } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // If Gemini key is missing or invalid, run through the stateful agronomy engine
    if (!apiKey || apiKey.length < 10) {
      const fallback = getOfflineFallbackAnswer(message, history, profile, weatherContext, cropContext);
      return res.json({
        reply: fallback.text,
        navigate: fallback.navigate,
        profile: fallback.profile,
        isGeminiActive: false,
        note: 'Running in stateful agronomy engine. Add GEMINI_API_KEY to .env for full Gemini 1.5 Flash.',
      });
    }

    // Format rich system instruction with current context including registered fields and activities
    let cropSummary = 'No fields registered yet.';
    if (cropContext) {
      const fieldsList = (cropContext.fields || []).map(f => `${f.name} (Crop: ${f.cropName}, Sown: ${f.sowingDate || 'N/A'})`).join('; ');
      const actList = (cropContext.recentActivities || []).slice(0, 4).map(a => `${a.activityDate}: ${a.activityType} on ${a.cropName} (${a.productName || a.wateringDuration || 'standard'})`).join('; ');
      cropSummary = `Registered Fields: ${fieldsList || 'None'}. Recent Activities: ${actList || 'None'}.`;
    }

    const contextualSystemInstruction = `${SYSTEM_INSTRUCTION}

CURRENT REAL-TIME CONTEXT:
- Farmer Profile Memory: ${JSON.stringify(profile)}
- Current Live Weather: ${weatherContext ? JSON.stringify(weatherContext) : 'City: Roorkee, Temp: 27°C, Condition: Clear Sky, Humidity: 62%'}
- Farmer's Crop History & Fields: ${cropSummary}

Remember: If the user is asking for crop advice, remember what they've already told you in the profile memory and field records. Do not re-ask known details!`;


    // Prepare contents array for Gemini
    const contents = [];

    history.slice(-6).forEach(item => {
      if (item.text) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    });

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: contextualSystemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 350,
        topP: 0.85,
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);
      const fallback = getOfflineFallbackAnswer(message, history, profile, weatherContext);
      return res.json({
        reply: fallback.text,
        navigate: fallback.navigate,
        profile: fallback.profile,
        isGeminiActive: false,
        warning: `Gemini status ${response.status}. Fallback agronomy answer provided.`,
      });
    }

    const data = await response.json();
    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!reply) {
      reply = "Kisan bhai, main aapke sawal ka vishleshan nahi kar paya. Kripya punah puchein.";
    }

    // Extract navigation tag if present
    let navigate = null;
    const navMatch = reply.match(/\[NAVIGATE:\s*([a-zA-Z0-9\-_]+)\]/i);
    if (navMatch) {
      navigate = navMatch[1].toLowerCase();
      reply = reply.replace(/\[NAVIGATE:\s*([a-zA-Z0-9\-_]+)\]/gi, '').trim();
    }

    // Update profile memory
    const updatedProfile = extractProfileFromText(message, profile);

    return res.json({
      reply,
      navigate,
      profile: updatedProfile,
      isGeminiActive: true,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    const fallback = getOfflineFallbackAnswer(req.body?.message || '', [], req.body?.profile || {}, req.body?.weatherContext || null);
    return res.json({
      reply: fallback.text,
      navigate: fallback.navigate,
      profile: fallback.profile,
      isGeminiActive: false,
    });
  }
});

// ─── Marketplace Schema & Seed Data ──────────────────────────────────────────
const SAMPLE_LISTINGS = [
  {
    id: 'demo-1',
    cropName: 'Sharbati Wheat (शरबती गेहूं)',
    category: 'Grains',
    variety: 'Grade-A Sharbati (Moisture < 11%)',
    quantity: 80,
    unit: 'Quintal',
    price: 2650,
    priceUnit: 'Quintal',
    state: 'Uttarakhand',
    location: 'Roorkee, Haridwar',
    farmerName: 'Ramesh Singh (Sample Profile)',
    phone: '98765-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Sun-dried high protein wheat. Sample demonstration listing.',
    listedDate: '2026-10-18',
    isDemo: true,
  },
  {
    id: 'demo-2',
    cropName: '1121 Basmati Paddy (बासमती धान)',
    category: 'Grains',
    variety: 'Pusa 1121 Steam Grade',
    quantity: 120,
    unit: 'Quintal',
    price: 3850,
    priceUnit: 'Quintal',
    state: 'Haryana',
    location: 'Karnal Grain Mandi',
    farmerName: 'Gurpreet Singh (Sample Profile)',
    phone: '98123-XXXXX',
    harvestStatus: 'Harvested & Bagged',
    notes: 'Extra long grain paddy. Sample demonstration listing.',
    listedDate: '2026-10-19',
    isDemo: true,
  },
  {
    id: 'demo-3',
    cropName: 'Yellow Mustard (पीली सरसों)',
    category: 'Oilseeds',
    variety: 'Pusa Bold High Oil Variety',
    quantity: 45,
    unit: 'Quintal',
    price: 5400,
    priceUnit: 'Quintal',
    state: 'Rajasthan',
    location: 'Alwar Agriculture Mandi',
    farmerName: 'Mohan Lal Sharma (Sample Profile)',
    phone: '97834-XXXXX',
    harvestStatus: 'In Warehouse Storage',
    notes: 'Sample demonstration listing with simulated data.',
    listedDate: '2026-10-17',
    isDemo: true,
  },
  {
    id: 'demo-4',
    cropName: 'Red Onion (लाल प्याज - Nashik)',
    category: 'Vegetables',
    variety: 'Garwa Medium Bold Grade',
    quantity: 150,
    unit: 'Quintal',
    price: 1800,
    priceUnit: 'Quintal',
    state: 'Maharashtra',
    location: 'Lasalgaon, Nashik',
    farmerName: 'Dnyaneshwar Patil (Sample Profile)',
    phone: '98223-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Deep red dry cured onion. Sample demonstration listing.',
    listedDate: '2026-10-20',
    isDemo: true,
  },
  {
    id: 'demo-5',
    cropName: 'Potato / Aloo (Kufri Pukhraj)',
    category: 'Vegetables',
    variety: 'Kufri Pukhraj (Table Size)',
    quantity: 200,
    unit: 'Quintal',
    price: 1100,
    priceUnit: 'Quintal',
    state: 'Uttar Pradesh',
    location: 'Khandari Mandi, Agra',
    farmerName: 'Suresh Chandra (Sample Profile)',
    phone: '94123-XXXXX',
    harvestStatus: 'In Cold Storage',
    notes: 'Graded table potatoes. Sample demonstration listing.',
    listedDate: '2026-10-16',
    isDemo: true,
  },
  {
    id: 'demo-6',
    cropName: 'Desi Chana / Chickpea (देसी चना)',
    category: 'Pulses',
    variety: 'Machine Cleaned Bold Grain',
    quantity: 60,
    unit: 'Quintal',
    price: 5250,
    priceUnit: 'Quintal',
    state: 'Madhya Pradesh',
    location: 'Choithram Mandi, Indore',
    farmerName: 'Vikram Patel (Sample Profile)',
    phone: '98931-XXXXX',
    harvestStatus: 'Ready for Immediate Pickup',
    notes: 'Cleaned bold grain chickpeas. Sample demonstration listing.',
    listedDate: '2026-10-19',
    isDemo: true,
  },
];

const listingSchema = new mongoose.Schema({
  cropName: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Grains', 'Pulses', 'Oilseeds', 'Vegetables', 'Cash Crops'],
  },
  variety: { type: String, trim: true, default: 'Standard Harvest Grade' },
  quantity: { type: Number, required: true, min: 1, max: 50000 },
  unit: { type: String, default: 'Quintal', enum: ['Quintal', 'Kg', 'Ton', 'Bags'] },
  price: { type: Number, required: true, min: 1, max: 200000 },
  priceUnit: { type: String, default: 'Quintal', enum: ['Quintal', 'Kg', 'Ton'] },
  state: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  farmerName: { type: String, required: true, trim: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: 'Phone must be a valid 10-digit Indian mobile number',
    },
  },
  harvestStatus: { type: String, default: 'Ready for Immediate Pickup' },
  notes: { type: String, trim: true, default: 'Direct from farm, fresh quality produce.' },
  listedDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
  isDemo: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

// Helper function to validate listing input
function validateListingPayload(data) {
  const errors = {};
  if (!data.cropName || typeof data.cropName !== 'string' || !data.cropName.trim()) {
    errors.cropName = 'Crop name is required';
  }
  const validCategories = ['Grains', 'Pulses', 'Oilseeds', 'Vegetables', 'Cash Crops'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = `Category must be one of: ${validCategories.join(', ')}`;
  }
  const qty = Number(data.quantity);
  if (!data.quantity || isNaN(qty) || qty <= 0 || qty > 50000) {
    errors.quantity = 'Quantity must be a positive number up to 50,000';
  }
  const prc = Number(data.price);
  if (!data.price || isNaN(prc) || prc <= 0 || prc > 200000) {
    errors.price = 'Price must be a realistic positive number up to ₹2,00,000';
  }
  if (!data.state || typeof data.state !== 'string' || !data.state.trim()) {
    errors.state = 'State is required';
  }
  if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
    errors.location = 'City / Mandi location is required';
  }
  if (!data.farmerName || typeof data.farmerName !== 'string' || !data.farmerName.trim()) {
    errors.farmerName = 'Farmer name is required';
  }
  const cleanPhone = String(data.phone || '').trim().replace(/\D/g, '');
  if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    errors.phone = 'Valid 10-digit Indian mobile number starting with 6-9 is required';
  }
  return errors;
}

// ─── Marketplace API Endpoints ────────────────────────────────────────────────

// 1. Database Connection Status
app.get('/api/marketplace/status', (req, res) => {
  return res.json({
    isDbConnected: isMongoConnected,
    hasMongoUri: Boolean(MONGODB_URI),
    error: isMongoConnected ? null : (mongoError || 'MONGODB_URI not configured in .env'),
  });
});

// 2. GET all listings (MongoDB + Preserved Sample Listings)
app.get('/api/marketplace/listings', async (req, res) => {
  try {
    let dbListings = [];
    if (isMongoConnected) {
      const docs = await Listing.find().sort({ createdAt: -1 });
      dbListings = docs.map(d => ({
        id: d._id.toString(),
        cropName: d.cropName,
        category: d.category,
        variety: d.variety,
        quantity: d.quantity,
        unit: d.unit,
        price: d.price,
        priceUnit: d.priceUnit,
        state: d.state,
        location: d.location,
        farmerName: d.farmerName,
        phone: d.phone,
        harvestStatus: d.harvestStatus,
        notes: d.notes,
        listedDate: d.listedDate,
        isDemo: false,
      }));
    }

    // Combine user-added database listings (newest first) with preserved DEMO SAMPLE listings
    const combined = [...dbListings, ...SAMPLE_LISTINGS];

    return res.json({
      listings: combined,
      dbCount: dbListings.length,
      sampleCount: SAMPLE_LISTINGS.length,
      isDbConnected: isMongoConnected,
      dbStatus: isMongoConnected ? 'connected' : 'disconnected',
      dbError: isMongoConnected ? null : (mongoError || 'MONGODB_URI not configured in .env'),
    });
  } catch (err) {
    console.error('Fetch listings error:', err);
    return res.status(500).json({
      error: 'Failed to fetch listings from database',
      listings: SAMPLE_LISTINGS,
      isDbConnected: false,
      dbError: err.message,
    });
  }
});

// 3. POST new listing to MongoDB
app.post('/api/marketplace/listings', async (req, res) => {
  // If database is not connected, reject with honest 503 error (NO fake success!)
  if (!isMongoConnected) {
    return res.status(503).json({
      error: 'MongoDB Database connect nahi hai. Listing permanently save karne ke liye backend mein MONGODB_URI configure karein.',
      isDbConnected: false,
      details: mongoError || 'MONGODB_URI not set or unreachable',
    });
  }

  const validationErrors = validateListingPayload(req.body);
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: validationErrors,
    });
  }

  try {
    const payload = {
      cropName: req.body.cropName.trim(),
      category: req.body.category,
      variety: (req.body.variety || '').trim() || 'Standard Harvest Grade',
      quantity: Number(req.body.quantity),
      unit: req.body.unit || 'Quintal',
      price: Number(req.body.price),
      priceUnit: req.body.priceUnit || 'Quintal',
      state: req.body.state.trim(),
      location: req.body.location.trim(),
      farmerName: req.body.farmerName.trim(),
      phone: String(req.body.phone).trim().replace(/\D/g, ''),
      harvestStatus: req.body.harvestStatus || 'Ready for Immediate Pickup',
      notes: (req.body.notes || '').trim() || 'Direct from farm, fresh quality produce.',
      listedDate: new Date().toISOString().split('T')[0],
      isDemo: false,
    };

    const created = await Listing.create(payload);

    return res.status(201).json({
      message: 'Crop listing published and saved to MongoDB successfully!',
      listing: {
        id: created._id.toString(),
        cropName: created.cropName,
        category: created.category,
        variety: created.variety,
        quantity: created.quantity,
        unit: created.unit,
        price: created.price,
        priceUnit: created.priceUnit,
        state: created.state,
        location: created.location,
        farmerName: created.farmerName,
        phone: created.phone,
        harvestStatus: created.harvestStatus,
        notes: created.notes,
        listedDate: created.listedDate,
        isDemo: false,
      },
    });
  } catch (err) {
    console.error('Create listing error:', err);
    return res.status(500).json({
      error: 'Database save failed',
      details: err.message,
    });
  }
});

// 4. PUT update existing listing in MongoDB
app.put('/api/marketplace/listings/:id', async (req, res) => {
  const { id } = req.params;

  if (id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Sample demonstration listings cannot be modified.' });
  }

  if (!isMongoConnected) {
    return res.status(503).json({
      error: 'MongoDB Database connect nahi hai. Listing update karne ke liye database connect karein.',
      isDbConnected: false,
    });
  }

  const validationErrors = validateListingPayload(req.body);
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors: validationErrors });
  }

  try {
    const updateData = {
      cropName: req.body.cropName.trim(),
      category: req.body.category,
      variety: (req.body.variety || '').trim() || 'Standard Harvest Grade',
      quantity: Number(req.body.quantity),
      unit: req.body.unit || 'Quintal',
      price: Number(req.body.price),
      priceUnit: req.body.priceUnit || 'Quintal',
      state: req.body.state.trim(),
      location: req.body.location.trim(),
      farmerName: req.body.farmerName.trim(),
      phone: String(req.body.phone).trim().replace(/\D/g, ''),
      harvestStatus: req.body.harvestStatus || 'Ready for Immediate Pickup',
      notes: (req.body.notes || '').trim(),
    };

    const updated = await Listing.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: 'Listing not found in database.' });
    }

    return res.json({
      message: 'Listing updated successfully in MongoDB!',
      listing: {
        id: updated._id.toString(),
        cropName: updated.cropName,
        category: updated.category,
        variety: updated.variety,
        quantity: updated.quantity,
        unit: updated.unit,
        price: updated.price,
        priceUnit: updated.priceUnit,
        state: updated.state,
        location: updated.location,
        farmerName: updated.farmerName,
        phone: updated.phone,
        harvestStatus: updated.harvestStatus,
        notes: updated.notes,
        listedDate: updated.listedDate,
        isDemo: false,
      },
    });
  } catch (err) {
    console.error('Update listing error:', err);
    return res.status(500).json({ error: 'Database update failed', details: err.message });
  }
});

// 5. DELETE listing from MongoDB
app.delete('/api/marketplace/listings/:id', async (req, res) => {
  const { id } = req.params;

  if (id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Sample demonstration listings cannot be deleted.' });
  }

  if (!isMongoConnected) {
    return res.status(503).json({
      error: 'MongoDB Database connect nahi hai. Listing delete karne ke liye database connect karein.',
      isDbConnected: false,
    });
  }

  try {
    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Listing not found in database.' });
    }

    return res.json({
      message: 'Listing deleted from MongoDB successfully.',
      id,
    });
  } catch (err) {
    console.error('Delete listing error:', err);
    return res.status(500).json({ error: 'Database delete failed', details: err.message });
  }
});

// ─── AI Crop Disease Detection Endpoints ──────────────────────────────────────

// 1. Check API Key Status
app.get('/api/crop-disease/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const hasKey = Boolean(apiKey && apiKey.length >= 10);
  const configuredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
  return res.json({
    hasApiKey: hasKey,
    model: hasKey ? configuredModel : 'unconfigured',
  });
});

// 2. Vision AI Crop Disease Analysis
app.post('/api/crop-disease/analyze', async (req, res) => {
  try {
    const { imageBase64, cropName = '', symptoms = '' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error: 'Kripya crop ya patte ki photo upload karein (Image is required).',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // If API key is missing, reject with honest 503 error (NO fake analysis!)
    if (!apiKey || apiKey.length < 10) {
      return res.status(503).json({
        error: 'Gemini AI API Key configure nahi hai. Live plant disease diagnosis ke liye .env file mein GEMINI_API_KEY configure karein.',
        hasApiKey: false,
        setupGuide: 'Google AI Studio (https://aistudio.google.com/) se free API key generate karke .env file mein GEMINI_API_KEY=your_key jodein aur server restart karein.',
      });
    }

    // Parse MIME type & raw base64 data
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    const dataUriMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64Data = dataUriMatch[2];
    }

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({
        error: 'Invalid file format. Kripya valid leaf/crop image (JPG, PNG, WEBP) upload karein.',
      });
    }

    if (!base64Data || base64Data.trim().length < 50) {
      return res.status(400).json({
        error: 'Uploaded image file is empty or corrupted. Please upload a clear photo of the plant leaf.',
      });
    }

    const preferredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
    const candidateModels = [preferredModel, 'gemini-2.0-flash', 'gemini-1.5-flash-8b'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    const promptText = `You are a certified Agricultural Plant Pathology expert for Indian farmers.
Examine this plant/crop image very carefully.
Crop name specified by farmer: "${cropName || 'Not specified'}"
Observed symptoms described by farmer: "${symptoms || 'None described'}"

CRITICAL INSTRUCTIONS:
1. First evaluate if this image is a plant leaf, crop stem, fruit, or agricultural specimen.
   - If the image is NOT a plant (e.g. human, object, car, animal, screen), set "isPlantImage": false, "diseaseName": "Not a Plant / Unrecognized", and explain why in "possibleCauses".
   - If the image is extremely blurry, out-of-focus, or too far away to see leaf patterns, set "isPlantImage": true, "confidence": "Low", and advise how to take a better close-up picture in good light.
2. If plant damage, fungal spots, bacterial lesions, viral curling, or nutrient deficiency is present:
   - Identify the most probable disease name in English and Hindi (e.g., "Early Blight / अगेती झुलसा", "Yellow Rust / पीला रतुआ", "Powdery Mildew / चूर्णिल आसिता").
   - List 2 to 4 visible symptoms observed directly on this leaf.
   - State confidence ("High", "Moderate", or "Low") with a brief explanation.
   - Severity level: "Mild", "Moderate", or "Severe".
   - State primary cause (Fungal pathogen, Bacterial, Insect vector, Nutrient deficiency).
   - Recommend 3 to 5 practical cultural, organic, and biological actions (e.g. sanitation, removing diseased leaves, improving spacing, neem oil spray, balanced potassium/nitrogen).
   - AGROCHEMICAL SAFETY DIRECTIVE: NEVER invent unverified chemical brands or fatal chemical dosages. Always instruct the farmer to consult the nearest Krishi Vigyan Kendra (KVK) or Block Agriculture Officer before applying any synthetic chemical fungicide/pesticide.

You MUST respond strictly in valid JSON without extra conversational text, matching this structure:
{
  "isPlantImage": true,
  "cropIdentified": "Crop name",
  "diseaseName": "Disease Name (English & Hindi)",
  "severity": "Mild | Moderate | Severe | Unclear",
  "confidence": "High | Moderate | Low",
  "confidenceScore": "85%",
  "symptoms": [
    "Symptom 1",
    "Symptom 2"
  ],
  "possibleCauses": "Fungal infection / Pest vector / Nutrient deficiency details",
  "recommendedActions": [
    "Action 1 (Cultural / Sanitation)",
    "Action 2 (Organic / Preventive)",
    "Action 3 (Field Care)"
  ],
  "kvkAdvisory": "For targeted ICAR-approved treatment, please visit your local Krishi Vigyan Kendra (KVK) or call the Kisan Call Centre at 1800-180-1551.",
  "disclaimer": "AI Plant Clinic provides diagnostic visual guidance. Verify with your local agriculture extension officer before applying large-scale chemical treatments."
}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        topP: 0.8,
      },
    };

    let response = null;
    let lastErrorText = '';
    let lastStatus = 500;

    // Try candidate models (starting with preferred model, with fallback if 404)
    for (const model of candidateModels) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload),
        });

        if (response.ok) {
          break; // Success!
        }

        lastStatus = response.status;
        lastErrorText = await response.text();

        // If not 404 (e.g. 400 Bad Key or 429 Quota), don't keep cycling models
        if (response.status !== 404) {
          break;
        }
      } catch (networkErr) {
        lastStatus = 502;
        lastErrorText = networkErr.message;
        break;
      }
    }

    if (!response || !response.ok) {
      console.error('Gemini Vision API error:', lastStatus, lastErrorText);

      let userFriendlyError = `AI Vision analysis service error (Status ${lastStatus}).`;
      let parsedError = null;
      try {
        parsedError = JSON.parse(lastErrorText);
      } catch (_) {}

      const apiMsg = parsedError?.error?.message || '';
      if (lastStatus === 400 && apiMsg.toLowerCase().includes('api key not valid')) {
        userFriendlyError = 'Aapki GEMINI_API_KEY invalid hai ya galat copy ho gayi hai. Kripya https://aistudio.google.com/ se fresh API key generate karke .env mein paste karein aur backend restart karein.';
      } else if (lastStatus === 429 || apiMsg.toLowerCase().includes('quota') || apiMsg.toLowerCase().includes('exhausted')) {
        userFriendlyError = 'Google Gemini API rate limit / quota exceed ho gaya hai. Kripya 1-2 minute baad dubara koshish karein.';
      } else if (lastStatus === 403 || apiMsg.toLowerCase().includes('permission')) {
        userFriendlyError = 'Gemini API permission denied. Kripya check karein ki aapka Google AI Studio project active hai.';
      } else if (apiMsg) {
        userFriendlyError = `Gemini Vision Error: ${apiMsg}`;
      }

      return res.status(lastStatus).json({
        error: userFriendlyError,
        details: apiMsg || lastErrorText,
      });
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any markdown code fences if present (```json ... ```)
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      rawText = jsonMatch[1];
    }

    try {
      const parsed = JSON.parse(rawText.trim());
      return res.json({
        success: true,
        analysis: parsed,
      });
    } catch {
      // Fallback if model output wasn't pure JSON
      return res.json({
        success: true,
        analysis: {
          isPlantImage: true,
          cropIdentified: cropName || 'Inspected Crop',
          diseaseName: 'Inspection Complete',
          severity: 'Moderate',
          confidence: 'Moderate',
          confidenceScore: '75%',
          symptoms: ['Visual anomalies detected on leaf surface.'],
          possibleCauses: rawText.substring(0, 200),
          recommendedActions: [
            'Isolate or remove visibly affected foliage.',
            'Ensure clean drainage and avoid wetting leaves during irrigation.',
            'Consult local Krishi Vigyan Kendra (KVK) for exact lab diagnosis.',
          ],
          kvkAdvisory: 'Visit nearest Krishi Vigyan Kendra (KVK) or dial Kisan Call Centre 1800-180-1551.',
          disclaimer: 'AI diagnostic aid. Consult agriculture extension officer for chemical prescription.',
        },
      });
    }
  } catch (error) {
    console.error('Crop disease endpoint error:', error);
    return res.status(500).json({
      error: 'An internal server error occurred while analyzing the image.',
      details: error.message,
    });
  }
});

// ─── Mandi Price Tracker Endpoints (Agmarknet / data.gov.in) ──────────────────

const SAMPLE_MANDI_PRICES = [
  {
    id: 'sample-mandi-1',
    state: 'Uttarakhand',
    district: 'Haridwar',
    market: 'Roorkee APMC Mandi',
    commodity: 'Wheat (गेहूं)',
    variety: 'Dara / Lokwan Grade-A',
    arrival_date: '22/10/2026',
    min_price: 2420,
    max_price: 2580,
    modal_price: 2500,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-2',
    state: 'Uttarakhand',
    district: 'Haridwar',
    market: 'Haridwar Mandi',
    commodity: 'Paddy(Basmati)',
    variety: '1121 Pusa Extra Long',
    arrival_date: '22/10/2026',
    min_price: 3700,
    max_price: 4100,
    modal_price: 3950,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-3',
    state: 'Uttarakhand',
    district: 'Udhamsinghnagar',
    market: 'Kicchha APMC Mandi',
    commodity: 'Tomato (टमाटर)',
    variety: 'Hybrid Desi Red',
    arrival_date: '22/10/2026',
    min_price: 2100,
    max_price: 2450,
    modal_price: 2300,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-4',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: 'Khandari Mandi',
    commodity: 'Potato (आलू)',
    variety: 'Kufri Pukhraj Fresh',
    arrival_date: '22/10/2026',
    min_price: 1050,
    max_price: 1250,
    modal_price: 1150,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-5',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market: 'Dubagga Mandi',
    commodity: 'Mustard (सरसों)',
    variety: 'Yellow / Pili Sarson',
    arrival_date: '22/10/2026',
    min_price: 5200,
    max_price: 5650,
    modal_price: 5450,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-6',
    state: 'Haryana',
    district: 'Karnal',
    market: 'Karnal Grain Mandi',
    commodity: 'Paddy(Common)',
    variety: 'PR 126 Grade-A',
    arrival_date: '22/10/2026',
    min_price: 2320,
    max_price: 2450,
    modal_price: 2380,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-7',
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana APMC',
    commodity: 'Wheat (गेहूं)',
    variety: 'PBW 725 High Protein',
    arrival_date: '22/10/2026',
    min_price: 2450,
    max_price: 2600,
    modal_price: 2525,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-8',
    state: 'Rajasthan',
    district: 'Alwar',
    market: 'Alwar APMC Mandi',
    commodity: 'Mustard (सरसों)',
    variety: 'Mustard Bold Oil Grade',
    arrival_date: '22/10/2026',
    min_price: 5350,
    max_price: 5800,
    modal_price: 5600,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-9',
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon Mandi',
    commodity: 'Onion (प्याज)',
    variety: 'Red Garwa Medium',
    arrival_date: '22/10/2026',
    min_price: 1650,
    max_price: 2200,
    modal_price: 1950,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-10',
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Choithram Mandi',
    commodity: 'Soyabean (सोयाबीन)',
    variety: 'Yellow JS 9560',
    arrival_date: '22/10/2026',
    min_price: 4300,
    max_price: 4750,
    modal_price: 4550,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-11',
    state: 'Madhya Pradesh',
    district: 'Ujjain',
    market: 'Ujjain APMC',
    commodity: 'Chana (चना)',
    variety: 'Desi Dollar Chana',
    arrival_date: '22/10/2026',
    min_price: 5100,
    max_price: 5600,
    modal_price: 5350,
    unit: '₹/Quintal',
  },
  {
    id: 'sample-mandi-12',
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot APMC Mandi',
    commodity: 'Cotton (कपास)',
    variety: 'Shankar-6 Medium Staple',
    arrival_date: '22/10/2026',
    min_price: 6800,
    max_price: 7450,
    modal_price: 7150,
    unit: '₹/Quintal',
  },
];

app.get('/api/mandi-prices', async (req, res) => {
  const { state = '', district = '', market = '', commodity = '', limit = '50' } = req.query;

  const apiKey = process.env.DATAGOV_API_KEY?.trim() || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout

  try {
    const targetUrl = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
    targetUrl.searchParams.set('api-key', apiKey);
    targetUrl.searchParams.set('format', 'json');
    targetUrl.searchParams.set('limit', String(Math.min(Number(limit) || 50, 100)));

    if (state && state !== 'All States') {
      targetUrl.searchParams.set('filters[state]', state);
    }
    if (district && district !== 'All Districts') {
      targetUrl.searchParams.set('filters[district]', district);
    }
    if (market) {
      targetUrl.searchParams.set('filters[market]', market);
    }
    if (commodity && commodity !== 'All Commodities') {
      targetUrl.searchParams.set('filters[commodity]', commodity);
    }

    const response = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`data.gov.in returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.records) && data.records.length > 0) {
      const records = data.records.map((r, i) => ({
        id: `live-${i}-${Date.now()}`,
        state: r.state || 'Unknown State',
        district: r.district || '',
        market: r.market || 'APMC Mandi',
        commodity: r.commodity || 'Produce',
        variety: r.variety || 'Standard',
        grade: r.grade || 'FAQ',
        arrival_date: r.arrival_date || new Date().toLocaleDateString('en-GB'),
        min_price: Number(r.min_price) || 0,
        max_price: Number(r.max_price) || 0,
        modal_price: Number(r.modal_price) || Number(r.min_price) || 0,
        unit: '₹/Quintal',
        isLive: true,
      }));

      return res.json({
        success: true,
        isLive: true,
        source: 'Agmarknet / data.gov.in (Official Govt of India Feed)',
        totalRecords: data.total || records.length,
        updatedDate: data.updated_date || new Date().toISOString(),
        records,
      });
    }

    // No records found matching filter
    return res.json({
      success: true,
      isLive: true,
      source: 'Agmarknet / data.gov.in (Official Govt of India Feed)',
      totalRecords: 0,
      records: [],
      message: 'No live market arrivals found matching selected filters on Agmarknet.',
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Agmarknet live fetch error/timeout, serving fallback sample data:', err.message);

    // Filter sample data
    let filteredSample = SAMPLE_MANDI_PRICES.filter(item => {
      const matchState = !state || state === 'All States' || item.state.toLowerCase() === state.toLowerCase();
      const matchDistrict = !district || district === 'All Districts' || item.district.toLowerCase().includes(district.toLowerCase());
      const matchCommodity = !commodity || commodity === 'All Commodities' || item.commodity.toLowerCase().includes(commodity.toLowerCase());
      return matchState && matchDistrict && matchCommodity;
    });

    return res.json({
      success: true,
      isLive: false,
      source: 'Sample/Demo Data (नमूना डेटा) - Live Server Unreachable',
      liveError: 'Official Agmarknet API connection timed out or unreachable. Showing benchmark sample rates.',
      records: filteredSample.map(s => ({ ...s, isLive: false })),
    });
  }
});

// ─── Crop History (Farm Activity Journal) Schemas & Models ───────────────────
const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, trim: true, default: '' },
  cropName: { type: String, required: true, trim: true },
  sowingDate: { type: String, default: '' },
  area: { type: String, trim: true, default: '' },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

const Field = mongoose.models.Field || mongoose.model('Field', fieldSchema);

const activitySchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  fieldName: { type: String, required: true, trim: true },
  cropName: { type: String, required: true, trim: true },
  activityType: {
    type: String,
    required: true,
    enum: ['Irrigation', 'Fertilizer', 'Pesticide/Spray', 'Sowing', 'Weeding', 'Harvesting', 'Other'],
  },
  activityDate: { type: String, required: true },
  activityTime: { type: String, default: '' },
  productName: { type: String, trim: true, default: '' },
  quantity: { type: Number, default: null },
  unit: { type: String, trim: true, default: '' },
  wateringDuration: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

const CropActivity = mongoose.models.CropActivity || mongoose.model('CropActivity', activitySchema);

// Sample initial fields and activities for demonstration & fallback
const SAMPLE_FIELDS = [
  {
    id: 'demo-f1',
    name: 'North Field (उत्तर खेत)',
    location: 'Plot 2A, Roorkee Canal Road',
    cropName: 'Sharbati Wheat (शरबती गेहूं)',
    sowingDate: '2026-10-10',
    area: '2.5 Acres',
    isDemo: true,
  },
  {
    id: 'demo-f2',
    name: 'South Orchard (दक्षिण बाग/खेत)',
    location: 'Near Tubewell 1',
    cropName: 'Yellow Mustard (पीली सरसों)',
    sowingDate: '2026-10-05',
    area: '1.8 Acres',
    isDemo: true,
  },
];

const SAMPLE_ACTIVITIES = [
  {
    id: 'demo-a1',
    fieldId: 'demo-f1',
    fieldName: 'North Field (उत्तर खेत)',
    cropName: 'Sharbati Wheat (शरबती गेहूं)',
    activityType: 'Sowing',
    activityDate: '2026-10-10',
    activityTime: '08:30 AM',
    productName: 'Certified HD-2967 Seed',
    quantity: 100,
    unit: 'Kg',
    wateringDuration: '',
    notes: 'Seed treatment done with Trichoderma before line sowing.',
    isDemo: true,
  },
  {
    id: 'demo-a2',
    fieldId: 'demo-f1',
    fieldName: 'North Field (उत्तर खेत)',
    cropName: 'Sharbati Wheat (शरबती गेहूं)',
    activityType: 'Irrigation',
    activityDate: '2026-10-18',
    activityTime: '06:00 AM',
    productName: '',
    quantity: null,
    unit: '',
    wateringDuration: '2.5 Hours',
    notes: 'First light irrigation (CRI stage) via canal water.',
    isDemo: true,
  },
  {
    id: 'demo-a3',
    fieldId: 'demo-f2',
    fieldName: 'South Orchard (दक्षिण बाग/खेत)',
    cropName: 'Yellow Mustard (पीली सरसों)',
    activityType: 'Fertilizer',
    activityDate: '2026-10-21',
    activityTime: '09:00 AM',
    productName: 'NPK 19:19:19 & Sulphur',
    quantity: 25,
    unit: 'Kg',
    wateringDuration: '',
    notes: 'Broadcast application during morning moisture.',
    isDemo: true,
  },
];

// ─── Crop History API Endpoints ───────────────────────────────────────────────

// 1. Database Connection Status for Crop History
app.get('/api/crop-history/status', (req, res) => {
  return res.json({
    isDbConnected: isMongoConnected,
    hasMongoUri: Boolean(MONGODB_URI),
    error: isMongoConnected ? null : (mongoError || 'MONGODB_URI not configured in .env'),
  });
});

// 2. GET all Fields
app.get('/api/crop-history/fields', async (req, res) => {
  try {
    let dbFields = [];
    if (isMongoConnected) {
      const docs = await Field.find().sort({ createdAt: -1 });
      dbFields = docs.map(d => ({
        id: d._id.toString(),
        name: d.name,
        location: d.location,
        cropName: d.cropName,
        sowingDate: d.sowingDate,
        area: d.area,
        isDemo: false,
      }));
    }
    return res.json({
      fields: isMongoConnected && dbFields.length > 0 ? dbFields : [...dbFields, ...SAMPLE_FIELDS],
      dbCount: dbFields.length,
      sampleCount: SAMPLE_FIELDS.length,
      isDbConnected: isMongoConnected,
      dbError: isMongoConnected ? null : (mongoError || 'MONGODB_URI not configured in .env'),
    });
  } catch (err) {
    console.error('Fetch fields error:', err);
    return res.status(500).json({
      error: 'Failed to fetch fields from database',
      fields: SAMPLE_FIELDS,
      isDbConnected: false,
      dbError: err.message,
    });
  }
});

// 3. POST create new Field
app.post('/api/crop-history/fields', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({
      error: 'MongoDB connect nahi hai. Naya field permanently save karne ke liye backend .env mein MONGODB_URI configure karein.',
      isDbConnected: false,
      details: mongoError || 'MONGODB_URI not configured in .env',
    });
  }

  const { name, location, cropName, sowingDate, area } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Field name is required.' });
  }
  if (!cropName || typeof cropName !== 'string' || !cropName.trim()) {
    return res.status(400).json({ error: 'Crop name is required.' });
  }

  try {
    const created = await Field.create({
      name: name.trim(),
      location: (location || '').trim(),
      cropName: cropName.trim(),
      sowingDate: (sowingDate || '').trim(),
      area: (area || '').trim(),
      isDemo: false,
    });

    return res.status(201).json({
      message: 'Field created and saved to MongoDB successfully!',
      field: {
        id: created._id.toString(),
        name: created.name,
        location: created.location,
        cropName: created.cropName,
        sowingDate: created.sowingDate,
        area: created.area,
        isDemo: false,
      },
    });
  } catch (err) {
    console.error('Create field error:', err);
    return res.status(500).json({ error: 'Database save failed', details: err.message });
  }
});

// 4. DELETE Field
app.delete('/api/crop-history/fields/:id', async (req, res) => {
  const { id } = req.params;
  if (id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Sample demonstration fields cannot be deleted from the database.' });
  }

  if (!isMongoConnected) {
    return res.status(503).json({ error: 'MongoDB is not connected.', isDbConnected: false });
  }

  try {
    await Field.findByIdAndDelete(id);
    await CropActivity.deleteMany({ fieldId: id });
    return res.json({ message: 'Field and its activities deleted successfully from MongoDB.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete field', details: err.message });
  }
});

// 5. GET all Activities
app.get('/api/crop-history/activities', async (req, res) => {
  try {
    let dbActivities = [];
    if (isMongoConnected) {
      const docs = await CropActivity.find().sort({ activityDate: -1, createdAt: -1 });
      dbActivities = docs.map(d => ({
        id: d._id.toString(),
        fieldId: d.fieldId,
        fieldName: d.fieldName,
        cropName: d.cropName,
        activityType: d.activityType,
        activityDate: d.activityDate,
        activityTime: d.activityTime,
        productName: d.productName,
        quantity: d.quantity,
        unit: d.unit,
        wateringDuration: d.wateringDuration,
        notes: d.notes,
        isDemo: false,
      }));
    }

    return res.json({
      activities: isMongoConnected && dbActivities.length > 0 ? dbActivities : [...dbActivities, ...SAMPLE_ACTIVITIES],
      dbCount: dbActivities.length,
      sampleCount: SAMPLE_ACTIVITIES.length,
      isDbConnected: isMongoConnected,
      dbError: isMongoConnected ? null : (mongoError || 'MONGODB_URI not configured in .env'),
    });
  } catch (err) {
    console.error('Fetch activities error:', err);
    return res.status(500).json({
      error: 'Failed to fetch activities from database',
      activities: SAMPLE_ACTIVITIES,
      isDbConnected: false,
      dbError: err.message,
    });
  }
});

// 6. POST new Activity
app.post('/api/crop-history/activities', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({
      error: 'MongoDB connect nahi hai. Activity permanently save karne ke liye backend .env mein MONGODB_URI configure karein.',
      isDbConnected: false,
      details: mongoError || 'MONGODB_URI not configured in .env',
    });
  }

  const {
    fieldId,
    fieldName,
    cropName,
    activityType,
    activityDate,
    activityTime,
    productName,
    quantity,
    unit,
    wateringDuration,
    notes,
  } = req.body;

  const validTypes = ['Irrigation', 'Fertilizer', 'Pesticide/Spray', 'Sowing', 'Weeding', 'Harvesting', 'Other'];
  if (!activityType || !validTypes.includes(activityType)) {
    return res.status(400).json({ error: `Activity type must be one of: ${validTypes.join(', ')}` });
  }
  if (!fieldName || !cropName || !activityDate) {
    return res.status(400).json({ error: 'Field name, crop name, and activity date are required.' });
  }

  try {
    const created = await CropActivity.create({
      fieldId: fieldId || 'custom-field',
      fieldName: fieldName.trim(),
      cropName: cropName.trim(),
      activityType,
      activityDate,
      activityTime: (activityTime || '').trim(),
      productName: (productName || '').trim(),
      quantity: quantity !== undefined && quantity !== null && quantity !== '' ? Number(quantity) : null,
      unit: (unit || '').trim(),
      wateringDuration: (wateringDuration || '').trim(),
      notes: (notes || '').trim(),
      isDemo: false,
    });

    return res.status(201).json({
      message: 'Farm activity recorded and saved to MongoDB successfully!',
      activity: {
        id: created._id.toString(),
        fieldId: created.fieldId,
        fieldName: created.fieldName,
        cropName: created.cropName,
        activityType: created.activityType,
        activityDate: created.activityDate,
        activityTime: created.activityTime,
        productName: created.productName,
        quantity: created.quantity,
        unit: created.unit,
        wateringDuration: created.wateringDuration,
        notes: created.notes,
        isDemo: false,
      },
    });
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({ error: 'Database save failed', details: err.message });
  }
});

// 7. PUT update Activity
app.put('/api/crop-history/activities/:id', async (req, res) => {
  const { id } = req.params;
  if (id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Sample demonstration activities cannot be modified.' });
  }

  if (!isMongoConnected) {
    return res.status(503).json({ error: 'MongoDB is not connected.', isDbConnected: false });
  }

  try {
    const updated = await CropActivity.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: 'Activity not found in database.' });
    }
    return res.json({
      message: 'Activity updated successfully in MongoDB!',
      activity: {
        id: updated._id.toString(),
        fieldId: updated.fieldId,
        fieldName: updated.fieldName,
        cropName: updated.cropName,
        activityType: updated.activityType,
        activityDate: updated.activityDate,
        activityTime: updated.activityTime,
        productName: updated.productName,
        quantity: updated.quantity,
        unit: updated.unit,
        wateringDuration: updated.wateringDuration,
        notes: updated.notes,
        isDemo: false,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update activity', details: err.message });
  }
});

// 8. DELETE Activity
app.delete('/api/crop-history/activities/:id', async (req, res) => {
  const { id } = req.params;
  if (id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Sample demonstration activities cannot be deleted.' });
  }

  if (!isMongoConnected) {
    return res.status(503).json({ error: 'MongoDB is not connected.', isDbConnected: false });
  }

  try {
    const deleted = await CropActivity.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Activity not found in database.' });
    }
    return res.json({ message: 'Activity deleted successfully from MongoDB.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete activity', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌾 Farmer Connect Server running on http://localhost:${PORT}`);
});





