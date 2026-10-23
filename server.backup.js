import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
function getOfflineFallbackAnswer(query, history = [], currentProfile = {}, weatherContext = null) {
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

  // 2. Weather Question with Live Data
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

  // 3. Multi-Turn Interactive Crop Recommendation
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
    const { message, history = [], profile = {}, weatherContext = null } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // If Gemini key is missing or invalid, run through the stateful agronomy engine
    if (!apiKey || apiKey.length < 10) {
      const fallback = getOfflineFallbackAnswer(message, history, profile, weatherContext);
      return res.json({
        reply: fallback.text,
        navigate: fallback.navigate,
        profile: fallback.profile,
        isGeminiActive: false,
        note: 'Running in stateful agronomy engine. Add GEMINI_API_KEY to .env for full Gemini 1.5 Flash.',
      });
    }

    // Format rich system instruction with current context
    const contextualSystemInstruction = `${SYSTEM_INSTRUCTION}

CURRENT REAL-TIME CONTEXT:
- Farmer Profile Memory: ${JSON.stringify(profile)}
- Current Live Weather: ${weatherContext ? JSON.stringify(weatherContext) : 'City: Roorkee, Temp: 27°C, Condition: Clear Sky, Humidity: 62%'}

Remember: If the user is asking for crop advice, remember what they've already told you in the profile memory. Do not re-ask known details!`;

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

app.listen(PORT, () => {
  console.log(`🌾 Farmer Connect Krishi Mitra Server running on http://localhost:${PORT}`);
});
