import { useState } from 'react';
import './App.css';
import Navbar              from './components/Navbar';
import Hero                from './components/Hero';
import CropRecommendation  from './components/CropRecommendation';
import CropCards           from './components/CropCards';
import CropDiseaseDetection from './components/CropDiseaseDetection';
import WeatherSection      from './components/WeatherSection';
import MandiPriceTracker   from './components/MandiPriceTracker';
import Marketplace         from './components/Marketplace';
import CropHistory         from './components/CropHistory';
import AiFarmingAssistant  from './components/AiFarmingAssistant';
import GovernmentSchemes   from './components/GovernmentSchemes';
import Contact             from './components/Contact';
import Footer              from './components/Footer';
import VoiceAssistant      from './components/VoiceAssistant';

export default function App() {
  const [cropContext, setCropContext] = useState(null);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CropRecommendation />
        <CropCards />
        <CropDiseaseDetection />
        <WeatherSection />
        <MandiPriceTracker />
        <Marketplace />
        <CropHistory onContextUpdate={setCropContext} />
        <AiFarmingAssistant cropContext={cropContext} />
        <GovernmentSchemes />
        <Contact />
      </main>

      <Footer />
      <VoiceAssistant />
    </>
  );
}
