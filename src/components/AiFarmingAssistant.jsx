import { useState, useEffect, useRef, useCallback } from 'react';
import './AiFarmingAssistant.css';

const SUGGESTED_CHIPS = [
  {
    en: '🌾 What should be my next activity based on my crop history?',
    hi: '🌾 मेरी फसल के इतिहास के अनुसार अगला काम क्या करें?',
  },
  {
    en: '💧 Should I irrigate my fields today based on current weather?',
    hi: '💧 क्या आज के मौसम के अनुसार खेत में सिंचाई करनी चाहिए?',
  },
  {
    en: '🧪 What is the balanced NPK ratio for wheat and mustard?',
    hi: '🧪 गेहूं और सरसों के लिए संतुलित NPK खाद का अनुपात क्या है?',
  },
  {
    en: '🐛 Yellow spots on crop leaves, what bio-control should I use?',
    hi: '🐛 पत्तियों पर पीले धब्बे दिख रहे हैं, कौन सा जैविक उपचार करें?',
  },
  {
    en: '📜 How do I apply for PM-KISAN or PM Fasal Bima Yojana?',
    hi: '📜 पीएम-किसान या फसल बीमा योजना का लाभ कैसे लें?',
  },
];

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export default function AiFarmingAssistant({ cropContext, weatherContext }) {
  const [hi, setHi] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste Kisan Bhai! Main hoon aapka "AI Krishi Mitra" (कृषि मित्र) 🌾. Mujhse fasal salah, beej chunav, sinchai, khad ya sarkari yojanaon ke baare mein Hindi ya English mein poochein.',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusInfo, setStatusInfo] = useState({ hasGeminiKey: false, model: 'stateful-agronomy-engine' });
  const [isRecording, setIsRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check backend AI status on mount
  useEffect(() => {
    fetch('/api/krishi-mitra/status')
      .then(res => res.json())
      .then(data => setStatusInfo(data))
      .catch(err => console.warn('AI status check warning:', err));
  }, []);

  // Text to speech playback
  const speakText = (text, msgId) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Will read Hindi/Hinglish/English
      utterance.rate = 0.95;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingId(null);
    }
  };

  // Voice speech-to-text input handler
  const toggleSpeechRecognition = () => {
    if (!SpeechRecognition) {
      alert(hi ? 'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है। कृपया Chrome या Edge का उपयोग करें।' : 'Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = hi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          setInput(prev => (prev ? `${prev} ${spoken}` : spoken));
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  // Send Chat Message
  const handleSend = async (messageText = null) => {
    const textToSend = typeof messageText === 'string' ? messageText : input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setErrorMsg('');

    // Prepare history payload (last 6 messages)
    const historyPayload = messages
      .filter(m => m.id !== 'welcome')
      .slice(-6)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('/api/krishi-mitra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyPayload,
          weatherContext: weatherContext || { city: 'Roorkee', temp: 27, condition: 'Clear Sky', humidity: 62 },
          cropContext: cropContext || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI service returned HTTP ${res.status}. Please check your connection.`);
      }

      const data = await res.json();
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Kisan bhai, main aapke sawal ka uttar nahi de paya. Kripya punah koshish karein.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isGeminiActive: data.isGeminiActive,
        note: data.note || null,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI chat error:', err);
      setErrorMsg(
        hi
          ? '⚠️ AI सेवा से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।'
          : `⚠️ Could not reach AI service: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-assistant-section" id="ai-assistant">
      <div className="container">

        {/* Section Header */}
        <div className="ai-header">
          <div className="ai-header__left">
            <span className="section-label">🤖 {hi ? 'एआई कृषि मित्र' : 'AI Krishi Mitra'}</span>
            <h2 className="section-title">
              {hi ? 'स्मार्ट एआई कृषि सलाहकार' : 'AI Farming Assistant'}
            </h2>
            <p className="section-subtitle">
              {hi
                ? 'अपनी फसल, मौसम, सिंचाई और खाद से जुड़े सवाल अपनी भाषा में पूछें। आपके खेत इतिहास और मौसम के अनुसार सटीक सलाह।'
                : 'Ask farming questions in Hindi, Hinglish, or English. Tailored answers aware of your crop history & weather.'}
            </p>
          </div>
          <div className="ai-header__right">
            <button type="button" className="ai-btn ai-btn--lang" onClick={() => setHi(v => !v)}>
              {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
            </button>
            <span className={`ai-engine-pill ai-engine-pill--${statusInfo.hasGeminiKey ? 'gemini' : 'expert'}`}>
              {statusInfo.hasGeminiKey
                ? '🟢 Gemini 1.5 Flash Active'
                : '🟡 Agricultural Expert Engine (Offline/Local)'}
            </span>
          </div>
        </div>

        {/* Informative Notice when Gemini key is not configured */}
        {!statusInfo.hasGeminiKey && (
          <div className="ai-key-notice">
            <span>ℹ️</span>
            <div>
              <strong>{hi ? 'कृषि विशेषज्ञ इंजन सक्रिय' : 'Expert Agronomy Engine Active'}</strong>
              <p>
                {hi
                  ? 'GEMINI_API_KEY .env में कॉन्फ़िगर नहीं है। कृषि मित्र अंतर्निहित प्रमाणित ICAR/KVK कृषि ज्ञान इंजन का उपयोग कर रहा है। फुल जेमिनी एआई सक्रिय करने के लिए .env में GEMINI_API_KEY जोड़ें।'
                  : 'GEMINI_API_KEY is not configured in .env. Krishi Mitra is running on the built-in ICAR/KVK verified agronomy engine. Add GEMINI_API_KEY to .env for full Gemini 1.5 Flash.'}
              </p>
            </div>
          </div>
        )}

        {/* Chat Window Container */}
        <div className="ai-chat-window">

          {/* Chat Window Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header__bot">
              <span className="ai-bot-avatar">👨‍🌾</span>
              <div>
                <div className="ai-bot-name">AI Krishi Mitra (कृषि मित्र)</div>
                <div className="ai-bot-status">
                  <span className="ai-status-dot"></span>
                  {cropContext?.fields?.length > 0
                    ? `${cropContext.fields.length} ${hi ? 'खेत जुड़े हैं' : 'Field(s) Connected'}`
                    : (hi ? 'ऑनलाइन • 24/7 सहायता' : 'Online • 24/7 Agronomy Support')}
                </div>
              </div>
            </div>

            <div className="ai-chat-header__actions">
              <button
                type="button"
                className="ai-chat-header__btn"
                onClick={() => setMessages(messages.slice(0, 1))}
                title={hi ? 'चैट इतिहास साफ करें' : 'Clear Chat Session'}
              >
                🗑️ {hi ? 'साफ करें' : 'Clear'}
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="ai-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-bubble-row ai-bubble-row--${msg.role}`}>
                {msg.role === 'assistant' && <span className="ai-avatar-small">🌾</span>}
                <div className={`ai-bubble ai-bubble--${msg.role}`}>
                  <p className="ai-bubble__text">{msg.text}</p>
                  <div className="ai-bubble__footer">
                    <span className="ai-bubble__time">{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        className={`ai-speak-btn ${speakingId === msg.id ? 'ai-speak-btn--active' : ''}`}
                        onClick={() => speakText(msg.text, msg.id)}
                        title={hi ? 'उत्तर सुनें' : 'Listen aloud'}
                      >
                        {speakingId === msg.id ? '🔊 Speaking...' : '🔈 Listen'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-bubble-row ai-bubble-row--assistant">
                <span className="ai-avatar-small">🌾</span>
                <div className="ai-bubble ai-bubble--assistant ai-bubble--loading">
                  <div className="ai-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <small>{hi ? 'कृषि मित्र विचार कर रहा है...' : 'Krishi Mitra is analyzing...'}</small>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="ai-error-banner" role="alert">
                <p>{errorMsg}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Question Chips */}
          <div className="ai-chips-container">
            <span className="ai-chips-label">{hi ? 'सुझाए गए प्रश्न:' : 'Suggested Questions:'}</span>
            <div className="ai-chips-scroll">
              {SUGGESTED_CHIPS.map((chip, idx) => {
                const text = hi ? chip.hi : chip.en;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="ai-chip"
                    onClick={() => handleSend(text)}
                    disabled={loading}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form
            className="ai-chat-input-bar"
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <button
              type="button"
              className={`ai-mic-btn ${isRecording ? 'ai-mic-btn--active' : ''}`}
              onClick={toggleSpeechRecognition}
              title={isRecording ? 'Stop recording voice' : 'Speak your question (Voice Input)'}
              aria-label="Voice input"
            >
              {isRecording ? '🛑' : '🎙️'}
            </button>

            <input
              type="text"
              className="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={hi ? 'फसल, खाद या मौसम संबंधी सवाल लिखें या बोलें...' : 'Ask your farming question (Hindi / English / Hinglish)...'}
              disabled={loading}
            />

            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>

          {/* Safety Disclaimer Footer */}
          <div className="ai-chat-disclaimer">
            <small>
              ⚠️ <strong>{hi ? 'कृषि सुरक्षा नोट:' : 'Agronomic Safety:'}</strong>{' '}
              {hi
                ? 'कीटनाशक व रसायनों का प्रयोग हमेशा उत्पाद के पैकेट लेबल और कृषि विज्ञान केंद्र (KVK) के परामर्श अनुसार ही करें।'
                : 'Chemical dosages must strictly follow approved product label instructions and local Krishi Vigyan Kendra (KVK) guidance.'}
            </small>
          </div>

        </div>

      </div>
    </section>
  );
}
