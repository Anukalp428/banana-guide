# 🌾 Farmer Connect (किसान कनेक्ट)
### *Smart Full-Stack Agricultural Assistance & Farm Management Platform*

**Farmer Connect** ek modern, full-stack web application hai jo Indian farmers (किसानों) ko data-driven farming tools, live weather advisories, marketplace access, smart farm journaling aur artificial intelligence (AI) ke madhyam se empower karta hai.

---

## 📑 Table of Contents (अनुक्रमणिका)
1. [Overview (प्रोजेक्ट परिचय)](#-overview-प्रोजेक्ट-परिचय)
2. [Tech Stack (तकनीकी स्टैक)](#-tech-stack-तकनीकी-स्टैक)
3. [Key Modules & Features (मुख्य फीचर्स)](#-key-modules--features-मुख्य-फीचर्स)
4. [Project Structure (प्रोजेक्ट फ़ाइल संरचना)](#-project-structure-प्रोजेक्ट-फ़ाइल-संरचना)
5. [Backend API Endpoints (बैकएंड एपीआई)](#-backend-api-endpoints-बैकएंड-एपीआई)
6. [Environment Variables Setup (.env)](#-environment-variables-setup-env)
7. [Installation & Setup Guide (शुरू कैसे करें)](#-installation--setup-guide-शुरू-कैसे-करें)
8. [Agronomic Safety & Ethics (सुरक्षा व मानक)](#-agronomic-safety--ethics-सुरक्षा-व-मानक)

---

## 🌟 Overview (प्रोजेक्ट परिचय)

Farmer Connect ka mukhya uddeshya kisan bhaiyon ko ek hi jagah sabhi zaroori agricultural suvidhayein pradan karna hai:
- Mitti aur mausam ke anusar sahi fasal ka chunav karna.
- Fasalon mein lagne wale keet aur bimariyon ki pehchan aur upchar.
- Live APMC Mandi rates check karna aur sidhe buyers ko fasal bechna.
- Real-time satellite weather aur 30-minute rain alerts prapt karna.
- Apne khet ki har gatividhi (sowing, irrigation, fertilizer) ka digital journal banana.
- 24/7 AI Krishi Mitra se apni bhasha (Hindi / Hinglish / English) mein salah lena.

---

## 🛠️ Tech Stack (तकनीकी स्टैक)

### Frontend (क्लाइंट साइड)
- **Framework & Core**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) (Ultra-fast build & HMR)
- **Styling**: Vanilla CSS3 (Custom design system tailored with agricultural theme: `#15803D` green, `#E8F5E9` light green, glassmorphism, responsive flex/grid layouts)
- **Web APIs**:
  - **Web Speech API (`SpeechRecognition`)**: Hands-free voice commands aur voice dictation ke liye.
  - **SpeechSynthesis API**: AI responses ko aawaz mein sunne ke liye.
  - **HTML5 Geolocation & LocalStorage**: Offline state aur persistence ke liye.

### Backend (सर्वर साइड)
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Web Framework**: [Express.js v5](https://expressjs.com/)
- **CORS & Middleware**: Express JSON body parser with 15MB limit, CORS enabled.
- **Environment Management**: `dotenv`

### Database (डेटाबेस)
- **Primary Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Reliable Fallback**: Seamless Local Demo Mode (`localStorage` + in-memory sync) jab MongoDB connect na ho, jisse website bina kisi server crash ke run karti hai.

### AI & Third-Party APIs (बाहरी सेवाएं)
- **AI Engine**: [Google Gemini 1.5 Flash API](https://aistudio.google.com/) via Generative Language REST API
- **Fallback AI**: Built-in Rule-Based Stateful Agronomy Engine (ICAR/KVK aligned)
- **Live Weather**: [Open-Meteo Weather API](https://open-meteo.com/) (Free satellite radar & hourly precipitation)
- **Mandi Prices**: [Agmarknet / data.gov.in](https://data.gov.in/) (Official Government of India agricultural prices feed with benchmark fallback)

---

## 🚀 Key Modules & Features (मुख्य फीचर्स)

### 1. 🧭 Sticky Navbar & Voice Navigation
- **Dynamic Scroll-Spy**: Page scroll hone par current active section automatically highlight hota hai.
- **Mobile Drawer**: Responsive hamburger menu mobile users ke liye.
- **Integrated Voice Navigation**: Floating microphone button jo bolkar sections kholne ki suvidha deta hai ("Weather", "Mandi", "Crop History", "AI Assistant", etc.).

### 2. 🌱 Crop Recommendation (स्मार्ट फसल सलाह)
- **Soil & NPK Input**: Nitrogen (N), Phosphorus (P), Potassium (K), Soil pH, aur Season select karein.
- **Scientific Algorithm**: Agro-climatic zone data ke aadhar par top recommended crops, expected yield, aur agronomic reasoning generate hoti hai.

### 3. 🔎 Crop Disease Detection (फसल रोग निदान)
- **Plant Pathology Engine**: Leaf symptoms, discoloration, ya fungal spots ke adhar par bimariyon ki pehchan.
- **Organic & Chemical Treatments**: Neem oil, Trichoderma jaise bio-solutions ke saath safe pesticide precautions.

### 4. 🌧️ Live Weather & Smart Rain Alert (मौसम व बारिश चेतावनी)
- **Open-Meteo Integration**: Temperature, Humidity, Wind speed, Sunrise/Sunset, aur 7-day forecast.
- **Rain Timeline**: Next 2 hours ka timeline jo hourly precipitation (mm) aur weather code dikhata hai.
- **Alert Levels**: `CLEAR`, `WATCH`, `PREPARE`, aur `SEVERE` alert levels kisan ko fasal dhakne ya irrigation postpone karne ki actionable advisory ke saath.

### 5. 📊 Mandi Price Tracker (मंडी भाव ट्रैकर)
- **Live Agmarknet Data**: State, District aur Commodity ke anusar Minimum, Maximum, aur Modal price (₹/Quintal).
- **Offline Benchmark Fallback**: Agar government API rate-limit ya down ho, toh benchmark sample rates dikhata hai with clear source transparency.

### 6. 🛒 Farmer-Buyer Marketplace (किसान मंडी बाजार)
- **Direct Selling**: Kisan apni fasal ki listing create kar sakte hain (Crop name, category, quantity, price, location, contact).
- **Database Persistence**: Listings seedhe MongoDB mein save hoti hain (agar DB connect ho) ya local demo mode mein persistent rehti hain.
- **Category Filters**: Grains, Pulses, Oilseeds, Vegetables, Cash Crops.

### 7. 🌾 Crop History / Farm Activity Journal (खेत डायरी)
- **Field Manager**: Multiple fields register karein (Field Name, Location, Main Crop, Sowing Date, Area).
- **Activity Logging**:
  - Activity Types: Irrigation (💧), Fertilizer (🧪), Pesticide/Spray (🛡️), Sowing (🌱), Weeding (🌿), Harvesting (🌾), Other (📝).
  - Auto-fills crop name from selected field.
  - Watering duration, product name, quantity & unit, and notes.
- **Chronological Timeline**: Date-wise grouped activity cards.
- **Search & Filters**: Field-wise, activity-type, aur date search.
- **Edit & Delete**: Activities ko update ya delete karne ki poori suvidha.
- **Honest DB Status**: MongoDB connect na hone par clear notification aur persistent local storage fallback.

### 8. 🤖 AI Farming Assistant (AI Krishi Mitra)
- **Multilingual Support**: Hindi, Hinglish, aur English mein baat karein.
- **Dual Engine Architecture**:
  - **Online**: Google Gemini 1.5 Flash (`GEMINI_API_KEY`).
  - **Offline/Local**: ICAR/KVK-standard rule-based stateful agronomy engine.
- **Context Awareness**: User ke registered fields aur recent Crop History activities ko samajhkar personalized advice deta hai.
- **Weather Awareness**: Live local temperature aur humidity context ko chat mein use karta hai.
- **Voice-Enabled**: Mic button se bolkar question poochein aur speaker button se uttar sunein (Speech Synthesis).
- **Suggested Question Chips**: Quick prompt chips for fast interaction.

### 9. 📜 Government Schemes Portal (सरकारी योजनाएं)
- **Verified Schemes**: PM-KISAN Samman Nidhi, PM Fasal Bima Yojana, PM-KUSUM Solar Pump, Kisan Credit Card (KCC).
- **Scheme Details**: Eligibility, required documents, benefits, and direct application links.

---

## 📂 Project Structure (प्रोजेक्ट फ़ाइल संरचना)

```text
Farmer website/
├── public/                       # Static assets
│   ├── favicon.svg
│   ├── hero-bg.png
│   └── icons.svg
├── src/
│   ├── assets/                   # Images and icons
│   ├── components/               # React UI Components
│   │   ├── AiFarmingAssistant.jsx & .css    # AI Krishi Mitra chat module
│   │   ├── Contact.jsx & .css               # Contact & Helpline section
│   │   ├── CropCards.jsx & .css             # Crop knowledge cards
│   │   ├── CropDiseaseDetection.jsx & .css  # Disease clinic module
│   │   ├── CropHistory.jsx & .css           # Farm activity journal & field manager
│   │   ├── CropRecommendation.jsx & .css    # NPK crop recommender
│   │   ├── Footer.jsx & .css                # Website footer
│   │   ├── GovernmentSchemes.jsx & .css     # Schemes directory
│   │   ├── Hero.jsx & .css                  # Hero banner & CTA
│   │   ├── MandiPriceTracker.jsx & .css     # APMC market price tracker
│   │   ├── Marketplace.jsx & .css           # Farmer produce trading
│   │   ├── Navbar.jsx & .css                # Navigation with scroll-spy
│   │   ├── RainAlertBanner.jsx & .css       # Smart rain alert banner
│   │   ├── useRainAlert.js                  # Custom weather & rain polling hook
│   │   ├── VoiceAssistant.jsx & .css        # Hands-free voice navigation FAB
│   │   └── WeatherSection.jsx & .css        # Live Open-Meteo weather forecast
│   ├── data/
│   │   └── cropData.js                      # Agronomic crop reference dataset
│   ├── App.css                              # App-level styling
│   ├── App.jsx                              # Main Application assembly
│   ├── index.css                            # Global CSS variables & design tokens
│   └── main.jsx                             # React DOM entry point
├── .env                                     # Local environment variables
├── .env.example                             # Template environment file
├── index.html                               # HTML5 template with SEO tags
├── package.json                             # Dependencies and scripts
├── server.js                                # Express backend & API endpoints
└── vite.config.js                           # Vite bundler & API proxy configuration
```

---

## 🔌 Backend API Endpoints (बैकएंड एपीआई)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/krishi-mitra/status` | Checks Gemini API key configuration & active model |
| `POST` | `/api/krishi-mitra/chat` | AI conversational endpoint (accepts `message`, `cropContext`, `weatherContext`) |
| `GET` | `/api/marketplace/status` | Returns MongoDB connection status for marketplace |
| `GET` | `/api/marketplace/listings` | Fetches crop listings (database + sample demo listings) |
| `POST` | `/api/marketplace/listings` | Creates a new crop listing in MongoDB |
| `PUT` | `/api/marketplace/listings/:id` | Updates an existing listing |
| `DELETE` | `/api/marketplace/listings/:id` | Deletes a listing |
| `GET` | `/api/mandi-prices` | Fetches live Agmarknet prices or sample benchmark rates |
| `GET` | `/api/crop-history/status` | Returns database status for Crop History |
| `GET` | `/api/crop-history/fields` | Retrieves registered farm fields |
| `POST` | `/api/crop-history/fields` | Saves a new field to MongoDB |
| `DELETE` | `/api/crop-history/fields/:id`| Deletes a field and its linked activities |
| `GET` | `/api/crop-history/activities` | Retrieves farm activity journal entries |
| `POST` | `/api/crop-history/activities` | Records a new farm activity (Irrigation, Sowing, etc.) |
| `PUT` | `/api/crop-history/activities/:id` | Updates a farm activity entry |
| `DELETE` | `/api/crop-history/activities/:id` | Deletes a farm activity entry |

---

## 🔐 Environment Variables Setup (.env)

Project root mein `.env` file banayein ya update karein:

```env
# Server Port (Default: 5001)
PORT=5001

# Google Gemini API Key (Google AI Studio se prapt karein: https://aistudio.google.com/)
# Agar blank chhodte hain, toh stateful agronomy engine automatically active rehta hai.
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (Atlas Cloud Free Tier ya Local MongoDB)
# Agar blank chhodte hain, toh website offline/local demo mode mein chalti hai.
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/farmer_connect
```

---

## 💻 Installation & Setup Guide (शुरू कैसे करें)

### 1. Prerequisites (आवश्यकताएं)
- **Node.js**: v18.0.0 ya usse naya
- **npm**: v9.0.0 ya usse naya

### 2. Dependencies Install Karein
```bash
npm install
```

### 3. Application Run Karein

Farmer Connect ko chalane ke liye 2 terminals ka use karein:

**Terminal 1 (Backend Server):**
```bash
npm run server
```
*Server `http://localhost:5001` par live ho jayega.*

**Terminal 2 (Frontend Client):**
```bash
npm run dev
```
*Vite frontend `http://localhost:5173` par open ho jayega.*

### 4. Production Build Banayein
```bash
npm run build
```
*Production files `dist/` directory mein compile ho jayengi.*

---

## 🛡️ Agronomic Safety & Ethics (सुरक्षा व मानक)

1. **No Fabricated Dosages**: Chemical pesticide ya insecticide ke unverified dosages fabricate nahi kiye jaate. Kisan ko packet label aur KVK (Krishi Vigyan Kendra) se salah lene ki transparent advisory di jaati hai.
2. **Honest Data Transparency**: Jab koi external API ya database unavailable ho, application fake data display karne ke bajaye **DEMO DATA / BENCHMARK** ka clear indicator show karti hai.
3. **Inclusive & Accessible**: Voice Assistant aur simple Hinglish/Hindi interface gaon aur remote kshetra ke kisan bhaiyon ke liye sahaj aur aasan banata hai.

---

**Developed with ❤️ for Indian Farmers (जय जवान, जय किसान) 🌾🇮🇳**
