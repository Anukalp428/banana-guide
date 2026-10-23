import { useState, useEffect, useRef } from 'react';
import './VoiceAssistant.css';

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

// Available voice navigation destinations
const COMMANDS = [
  {
    id: 'weather',
    targetId: 'weather',
    label: 'Weather',
    voiceConfirm: 'Opening Weather section',
    keywords: ['weather', 'mausam', 'mosam', 'temperature', 'taapman', 'rain', 'barsat', 'hawa'],
  },
  {
    id: 'crop-recommendation',
    targetId: 'crop-recommendation',
    label: 'Crop Recommendation',
    voiceConfirm: 'Opening Crop Recommendation',
    keywords: ['crop', 'recommendation', 'fasal', 'suggestion', 'fasal salah', 'kheti', 'seed', 'soil', 'crops'],
  },
  {
    id: 'disease-detection',
    targetId: 'disease-detection',
    label: 'Disease Detection',
    voiceConfirm: 'Opening Crop Disease Detection',
    keywords: ['disease', 'bimari', 'keet', 'rog', 'patte', 'leaf', 'detection', 'clinic', 'kida'],
  },
  {
    id: 'mandi-prices',
    targetId: 'mandi-prices',
    label: 'Mandi Prices',
    voiceConfirm: 'Opening Mandi Price Tracker',
    keywords: ['bhav', 'rate', 'mandi rate', 'mandi price', 'bhav tracker', 'gehu ka bhav', 'dhan ka bhav', 'market price', 'mandi bhav'],
  },
  {
    id: 'marketplace',
    targetId: 'marketplace',
    label: 'Marketplace',
    voiceConfirm: 'Opening Farmer Marketplace',
    keywords: ['market', 'marketplace', 'bazaar', 'buyer', 'listing', 'bechna', 'kharidna'],
  },
  {
    id: 'crop-history',
    targetId: 'crop-history',
    label: 'Crop History',
    voiceConfirm: 'Opening Crop History and Farm Activity Journal',
    keywords: ['crop history', 'history', 'activity journal', 'farm log', 'diary', 'khet diary', 'fasal history'],
  },
  {
    id: 'ai-assistant',
    targetId: 'ai-assistant',
    label: 'AI Assistant',
    voiceConfirm: 'Opening AI Farming Assistant Krishi Mitra',
    keywords: ['ai', 'assistant', 'krishi mitra', 'ai assistant', 'chat', 'salah', 'ask ai', 'companion'],
  },
  {
    id: 'schemes',
    targetId: 'schemes',
    label: 'Government Schemes',
    voiceConfirm: 'Opening Government Schemes',
    keywords: ['scheme', 'schemes', 'yojana', 'sarkari', 'government', 'subsidy', 'pm kisan'],
  },
  {
    id: 'contact',
    targetId: 'contact',
    label: 'Contact',
    voiceConfirm: 'Opening Contact section',
    keywords: ['contact', 'sampark', 'help', 'helpline', 'support', 'call'],
  },
  {
    id: 'home',
    targetId: 'home',
    label: 'Home',
    voiceConfirm: 'Going to Home page',
    keywords: ['home', 'ghar', 'start', 'top', 'main', 'shuruat'],
  },
];

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType]   = useState('idle'); // 'idle' | 'listening' | 'success' | 'error'
  const [showCard, setShowCard]       = useState(false);

  const recognitionRef = useRef(null);
  const dismissTimerRef = useRef(null);

  // Clear automatic dismiss timer
  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  // Speak short voice feedback
  const speakVoice = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  // Stop any active speech
  const stopVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Navigate to target section smoothly
  const navigateToSection = (targetId, confirmText) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${targetId}`);
    } else if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', '#home');
    }

    setStatusType('success');
    setStatusMessage(`✓ ${confirmText}`);
    speakVoice(confirmText);

    clearDismissTimer();
    dismissTimerRef.current = setTimeout(() => {
      setShowCard(false);
      setStatusType('idle');
    }, 4500);
  };

  // Match recognized speech against commands
  const processVoiceCommand = (text) => {
    const cleanText = text.toLowerCase().trim();

    for (const cmd of COMMANDS) {
      const match = cmd.keywords.some((kw) => cleanText.includes(kw));
      if (match) {
        navigateToSection(cmd.targetId, cmd.voiceConfirm);
        return;
      }
    }

    // Unrecognized command error
    setStatusType('error');
    setStatusMessage(`Command not recognized: "${text}". Please say: Weather, Crop Recommendation, Marketplace, Schemes, or Home.`);
    speakVoice("Sorry, I could not recognize that command. Please try saying Weather, Crop Recommendation, Schemes, or Marketplace.");

    clearDismissTimer();
    dismissTimerRef.current = setTimeout(() => {
      setShowCard(false);
      setStatusType('idle');
    }, 6000);
  };

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // 'en-IN' transcribes in English characters so English/Hinglish speech matches keyword strings
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusType('listening');
        setStatusMessage('Listening... Please speak a command.');
        setShowCard(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal && currentTranscript.trim()) {
          setIsListening(false);
          processVoiceCommand(currentTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setStatusType('error');
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access denied. Please click the lock/mic icon in the browser address bar and allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('No voice detected. Please tap the mic button and speak again.');
        } else if (event.error === 'network') {
          setStatusMessage('Network issue with speech recognition service. Please check your internet connection.');
        } else {
          setStatusMessage(`Speech error: ${event.error}. Please try again.`);
        }

        clearDismissTimer();
        dismissTimerRef.current = setTimeout(() => {
          setShowCard(false);
          setStatusType('idle');
        }, 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      // fallback
    }

    return () => {
      clearDismissTimer();
      stopVoice();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  // Handle Mic button toggle
  const handleMicClick = () => {
    stopVoice();
    clearDismissTimer();

    if (!SpeechRecognition) {
      setShowCard(true);
      setStatusType('error');
      setStatusMessage('Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setIsListening(false);
      setStatusType('idle');
      setShowCard(false);
    } else {
      setTranscript('');
      setShowCard(true);
      try {
        recognitionRef.current?.start();
      } catch {
        try {
          recognitionRef.current?.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch {
          setStatusType('error');
          setStatusMessage('Could not activate microphone. Please try again.');
        }
      }
    }
  };

  return (
    <>
      {/* ── Floating Voice Command Card (Active State) ── */}
      {showCard && (
        <div className={`voice-card-popup voice-card--${statusType}`} role="status">
          <div className="voice-card-header">
            <div className="voice-card-title-group">
              <span className="voice-card-icon">
                {statusType === 'listening' ? '🎙️' : statusType === 'success' ? '✅' : '⚠️'}
              </span>
              <span className="voice-card-title">
                {statusType === 'listening' ? 'Listening...' : statusType === 'success' ? 'Navigated' : 'Voice Assistant'}
              </span>
            </div>
            <button
              type="button"
              className="voice-card-close"
              onClick={() => {
                stopVoice();
                if (isListening) {
                  try { recognitionRef.current?.stop(); } catch { /* ignore */ }
                }
                setShowCard(false);
              }}
              title="Close"
              aria-label="Close voice assistant card"
            >
              ✕
            </button>
          </div>

          {/* Live Transcript / Status */}
          <div className="voice-card-body">
            {isListening && (
              <div className="voice-soundwave">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            )}

            {transcript ? (
              <p className="voice-transcript-text">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : null}

            {statusMessage && (
              <p className={`voice-status-text voice-status-text--${statusType}`}>
                {statusMessage}
              </p>
            )}

            {/* Quick Helper Command Chips */}
            <div className="voice-helper-chips">
              <span className="helper-label">Commands:</span>
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  type="button"
                  className="voice-helper-chip"
                  onClick={() => navigateToSection(cmd.targetId, cmd.voiceConfirm)}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button (FAB) ── */}
      <div className="voice-assistant-fab-container">
        <button
          type="button"
          className={`voice-assistant-fab ${isListening ? 'voice-assistant-fab--listening' : ''}`}
          onClick={handleMicClick}
          aria-label={isListening ? 'Stop recording voice' : 'Start voice navigation'}
          title="Click to speak a voice command (e.g. Weather, Crop Recommendation, Marketplace)"
          id="farmer-voice-nav-btn"
        >
          {isListening ? (
            <span className="fab-pulse-wrapper">
              <span className="fab-icon">🛑</span>
              <span className="pulse-ring"></span>
            </span>
          ) : (
            <span className="fab-icon">🎙️</span>
          )}
          <span className="fab-label">
            {isListening ? 'Listening...' : 'Voice Command'}
          </span>
        </button>
      </div>
    </>
  );
}
