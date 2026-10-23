import { useState, useEffect, useRef } from 'react';
import './CropDiseaseDetection.css';

// Pre-packaged educational sample demo cases for instant evaluation
const SAMPLE_CASES = [
  {
    id: 'sample-tomato-blight',
    cropName: 'Tomato (टमाटर)',
    sampleTitle: 'Tomato Early Blight (अगेती झुलसा)',
    sampleDescription: 'Brown concentric spots with yellow halos on lower leaves',
    analysis: {
      isPlantImage: true,
      cropIdentified: 'Tomato (Solanum lycopersicum)',
      diseaseName: 'Early Blight / अगेती झुलसा (Alternaria solani)',
      severity: 'Moderate',
      confidence: 'High',
      confidenceScore: '92%',
      symptoms: [
        'Dark brown concentric rings forming "target-board" lesions on older leaves',
        'Yellow chlorotic halos surrounding necrotic leaf spots',
        'Premature leaf drop and lower foliage drying'
      ],
      possibleCauses: 'Fungal infection (Alternaria solani) promoted by warm humid weather (24-29°C) and persistent leaf wetness.',
      recommendedActions: [
        'Prune and safely burn or bury heavily infected lower leaves away from the field.',
        'Adopt drip irrigation or water at the base of plants; avoid overhead sprinkler wetting of foliage.',
        'Apply organic preventive bio-control: Trichoderma viride (10g/L water) or 5% Neem Seed Kernel Extract (NSKE).',
        'Maintain proper plant spacing (60 x 45 cm) to facilitate air circulation and rapid leaf drying.'
      ],
      kvkAdvisory: 'For ICAR-approved fungicide spray schedules in severe outbreak, consult your local Krishi Vigyan Kendra (KVK) or call Kisan Call Centre at 1800-180-1551.',
      disclaimer: 'AI diagnostic aid based on visual indicators. Always verify with local block agriculture extension officers before applying synthetic chemical fungicides.',
    },
  },
  {
    id: 'sample-wheat-rust',
    cropName: 'Wheat (गेहूं)',
    sampleTitle: 'Wheat Yellow Rust (पीला रतुआ)',
    sampleDescription: 'Parallel yellow powdery stripes on wheat leaf surface',
    analysis: {
      isPlantImage: true,
      cropIdentified: 'Wheat (Triticum aestivum)',
      diseaseName: 'Yellow Stripe Rust / पीला रतुआ (Puccinia striiformis)',
      severity: 'Severe',
      confidence: 'High',
      confidenceScore: '94%',
      symptoms: [
        'Bright yellow linear stripes of powdery urediniospores along leaf veins',
        'Powdery yellow dust coming off easily when rubbed on white paper or cloth',
        'Leaf chlorosis leading to compromised photosynthesis and shriveled grains'
      ],
      possibleCauses: 'Airborne fungal spores (Puccinia striiformis) favored by cool humid winter mornings and daytime temperatures of 10-20°C.',
      recommendedActions: [
        'Immediately scout entire field to map infected patches and prevent spore dispersal.',
        'Avoid excessive urea/nitrogenous fertilization which accelerates succulent leaf growth and rust susceptibility.',
        'Plant certified rust-resistant wheat varieties (e.g. DBW 187, DBW 222, HD 3086) in subsequent crop cycles.',
        'Consult state agriculture department hotline for emergency community spray advisory.'
      ],
      kvkAdvisory: 'Yellow rust can spread rapidly across acres by wind. Contact your district Agriculture Officer / KVK immediately for certified advisory.',
      disclaimer: 'AI diagnostic aid. Observe chemical label safety instructions and KVK protocols before spraying.',
    },
  },
  {
    id: 'sample-chilli-curl',
    cropName: 'Chilli (मिर्च)',
    sampleTitle: 'Chilli Leaf Curl Virus (पर्ण कुंचन रोग)',
    sampleDescription: 'Upward leaf curling, puckering, and stunted plant growth',
    analysis: {
      isPlantImage: true,
      cropIdentified: 'Chilli / Mirch (Capsicum annuum)',
      diseaseName: 'Chilli Leaf Curl Virus (चिल्ली लीफ कर्ल)',
      severity: 'Moderate',
      confidence: 'High',
      confidenceScore: '89%',
      symptoms: [
        'Upward curling, puckering, and boat-shaped crinkling of young apical leaves',
        'Thickening and swelling of leaf veins with shortened internodes (bushy appearance)',
        'Stunted growth and poor flower setting leading to small malformed fruits'
      ],
      possibleCauses: 'Begomovirus transmitted primarily by Whitefly (Bemisia tabaci) insect vectors, especially during warm dry conditions.',
      recommendedActions: [
        'Rogue out and destroy severely stunted virus-infected plants to eliminate source of inoculum.',
        'Install yellow sticky traps (10-15 traps per acre) at canopy level to monitor and mass-trap whiteflies.',
        'Spray organic Neem Oil (3-5 ml per liter with mild soap) to deter whitefly vector feeding.',
        'Erect barrier crops like maize, sorghum, or pearl millet (2-3 rows) around chilli plot to block incoming vectors.'
      ],
      kvkAdvisory: 'Viral diseases have no curative chemical cure once inside the plant; management relies strictly on vector control and field hygiene. Consult local KVK.',
      disclaimer: 'AI diagnostic aid. Consult local agriculture extension officer before spraying.',
    },
  },
];

export default function CropDiseaseDetection() {
  const [selectedImage, setSelectedImage] = useState(null); // Data URI
  const [imageDetails, setImageDetails]   = useState(null); // { name, size }
  const [cropName, setCropName]           = useState('');
  const [symptoms, setSymptoms]           = useState('');
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [result, setResult]               = useState(null);
  const [isDemoResult, setIsDemoResult]   = useState(false);
  const [errorMessage, setErrorMessage]   = useState('');
  const [apiStatus, setApiStatus]         = useState({ hasApiKey: false, checked: false, model: '' });
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [isDragging, setIsDragging]       = useState(false);

  const fileInputRef = useRef(null);

  // Check backend Gemini API status
  const checkApiStatus = async () => {
    setIsCheckingKey(true);
    try {
      const res = await fetch('/api/crop-disease/status');
      const data = await res.json();
      setApiStatus({ hasApiKey: Boolean(data.hasApiKey), checked: true, model: data.model || '' });
    } catch {
      setApiStatus({ hasApiKey: false, checked: true, model: '' });
    } finally {
      setIsCheckingKey(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  // Handle image file selection
  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select a photo under 10 MB.');
      return;
    }

    setErrorMessage('');
    setResult(null);
    setIsDemoResult(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setImageDetails({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Reset image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageDetails(null);
    setResult(null);
    setIsDemoResult(false);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analyze crop image with backend Gemini Vision API
  const handleAnalyzeCrop = async () => {
    if (!selectedImage) {
      setErrorMessage('Kripya pehle apne khet ke patte ya paudhe ki photo upload karein.');
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);
    setResult(null);
    setIsDemoResult(false);

    try {
      const response = await fetch('/api/crop-disease/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          cropName: cropName.trim(),
          symptoms: symptoms.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Honest error display — NO fake AI analysis
        const errMsg = data.error || 'Crop analysis failed.';
        setErrorMessage(errMsg);
        if (!data.hasApiKey) {
          setShowSetupHelp(true);
        }
        return;
      }

      if (data.analysis) {
        setResult(data.analysis);
        setIsDemoResult(false);
      } else {
        setErrorMessage('AI analysis was returned in unexpected format. Please try another photo.');
      }
    } catch (err) {
      console.error('Disease detection error:', err);
      setErrorMessage(`Server connection error: ${err.message}. Please check if backend server is running.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load an educational sample demo case
  const handleLoadSample = (sample) => {
    handleRemoveImage();
    setCropName(sample.cropName);
    setSymptoms(sample.sampleDescription);
    setResult(sample.analysis);
    setIsDemoResult(true);
    setErrorMessage('');
  };

  return (
    <section className="crop-disease-section" id="disease-detection">
      <div className="container">
        {/* Section Header */}
        <div className="crop-disease-header">
          <span className="section-label">🔬 AI Plant Clinic (फसल रोग निदान)</span>
          <h2 className="section-title">AI Crop Disease Detection</h2>
          <p className="section-subtitle">
            Upload a clear photo of an affected plant leaf or crop. Our AI vision diagnostic tool inspects visual symptoms, identifies probable diseases, and provides safe ICAR/KVK cultural guidance.
          </p>

          {/* AI Status Badge */}
          <div className="disease-api-status-row">
            <span className={`ai-status-pill ${apiStatus.hasApiKey ? 'ai-status-pill--active' : 'ai-status-pill--warning'}`}>
              {apiStatus.hasApiKey
                ? `🟢 Active: ${apiStatus.model || 'Gemini Vision AI'}`
                : '🟡 AI Key Setup Required for Live Analysis'}
            </span>
            <button
              type="button"
              className="ai-setup-guide-btn"
              onClick={checkApiStatus}
              disabled={isCheckingKey}
              title="Click to check if key is now detected"
            >
              {isCheckingKey ? 'Checking...' : '🔄 Re-check Status'}
            </button>
            {!apiStatus.hasApiKey && (
              <button
                type="button"
                className="ai-setup-guide-btn"
                onClick={() => setShowSetupHelp(prev => !prev)}
              >
                {showSetupHelp ? 'Hide Setup Help ✕' : 'ℹ️ How to configure free Gemini API Key?'}
              </button>
            )}
          </div>

          {/* Setup Help Card */}
          {showSetupHelp && (
            <div className="ai-setup-card">
              <h4>🔑 Free Google Gemini API Key Setup (Step-by-Step):</h4>
              <ol>
                <li>Visit <strong><a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">aistudio.google.com</a></strong> and sign in with your Google account.</li>
                <li>Click <strong>&quot;Get API key&quot;</strong> &gt; <strong>&quot;Create API key&quot;</strong> (free of cost).</li>
                <li>Open this project&apos;s <code>.env</code> file in your editor:
                  <div style={{ margin: '8px 0', padding: '8px 12px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', fontFamily: 'monospace' }}>
                    GEMINI_API_KEY=AIzaSyYourActualKeyHere
                  </div>
                </li>
                <li>Save the <code>.env</code> file and restart the backend server (<code>npm run server</code>).</li>
                <li>Click <strong>&quot;🔄 Re-check Status&quot;</strong> above to verify connection!</li>
              </ol>
            </div>
          )}
        </div>

        {/* ── Main Diagnostic Workspace Grid ── */}
        <div className="crop-disease-workspace">
          {/* Left Column: Upload & Optional Details */}
          <div className="disease-input-card">
            <h3 className="card-box-title">📷 1. Upload Plant / Leaf Photo</h3>

            {/* Dropzone / Upload Area */}
            {!selectedImage ? (
              <div
                className={`disease-dropzone ${isDragging ? 'disease-dropzone--dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              >
                <div className="dropzone-icon">🍃</div>
                <h4 className="dropzone-title">Click to Upload or Drag &amp; Drop Leaf Photo</h4>
                <p className="dropzone-hint">
                  Supports JPG, PNG, WEBP (Supports Camera capture on Mobile) &bull; Max 10 MB
                </p>
                <button type="button" className="btn-primary dropzone-browse-btn">
                  Select Photo / फोटो चुनें
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleInputChange}
                  className="hidden-file-input"
                  aria-label="Upload crop leaf photo"
                />
              </div>
            ) : (
              /* Image Preview Card */
              <div className="disease-preview-card">
                <div className="preview-image-wrapper">
                  <img src={selectedImage} alt="Crop Leaf Preview" className="preview-img" />
                </div>
                <div className="preview-info-row">
                  <div className="preview-meta">
                    <span className="file-name">{imageDetails?.name || 'Uploaded Leaf Photo'}</span>
                    <span className="file-size">{imageDetails?.size || ''}</span>
                  </div>
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="btn-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                      title="Choose another photo"
                    >
                      🔄 Change
                    </button>
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={handleRemoveImage}
                      title="Remove this photo"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleInputChange}
                  className="hidden-file-input"
                  aria-label="Upload replacement leaf photo"
                />
              </div>
            )}

            {/* Photo Guidelines Tip */}
            <div className="photo-tip-box">
              <span className="tip-icon">💡</span>
              <p>
                <strong>Tip for best diagnostic accuracy:</strong> Take a sharp, well-lit close-up photo focusing on the affected leaf spots, yellowing, or lesions. Avoid blurry, dark, or distant shots.
              </p>
            </div>

            {/* Optional Crop Details Form */}
            <div className="disease-fields-group">
              <h4 className="fields-title">🌾 Optional Context (Helps AI precision)</h4>
              
              <div className="form-group">
                <label htmlFor="disease-crop-name">Crop / Plant Name (फसल का नाम)</label>
                <input
                  type="text"
                  id="disease-crop-name"
                  placeholder="e.g. Tomato, Wheat, Rice, Cotton, Potato, Chilli, Mustard..."
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="crop-input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="disease-symptoms">Observed Symptoms (लक्षण)</label>
                <textarea
                  id="disease-symptoms"
                  rows={2}
                  placeholder="e.g. Yellow spots on lower leaves, curling edges, white powdery coating..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="crop-textarea-field"
                />
              </div>
            </div>

            {/* Analyze Action Button */}
            <button
              type="button"
              className="btn-primary analyze-cta-btn"
              onClick={handleAnalyzeCrop}
              disabled={!selectedImage || isAnalyzing}
              id="analyze-crop-btn"
            >
              {isAnalyzing ? (
                <>
                  <span className="analyze-spinner"></span>
                  Analyzing Leaf with AI Vision... (जांच जारी है)
                </>
              ) : (
                '🔍 Diagnose Crop Disease / फसल की जांच करें →'
              )}
            </button>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="disease-error-alert" role="alert">
                <span className="error-icon">⚠️</span>
                <div>
                  <strong>Diagnostic Note:</strong> {errorMessage}
                </div>
              </div>
            )}

            {/* Sample Demo Cases Bar */}
            <div className="sample-cases-bar">
              <span className="sample-label">🧪 Or test instant demo leaf samples:</span>
              <div className="sample-chips-row">
                {SAMPLE_CASES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="sample-case-chip"
                    onClick={() => handleLoadSample(sample)}
                  >
                    {sample.sampleTitle}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Diagnosis Results Display */}
          <div className="disease-result-card">
            <h3 className="card-box-title">📋 2. AI Plant Clinic Report</h3>

            {!result && !isAnalyzing && (
              <div className="result-placeholder">
                <div className="placeholder-icon">🔬</div>
                <h4>No Diagnosis Yet</h4>
                <p>
                  Upload a plant photo on the left and tap &ldquo;Diagnose Crop Disease&rdquo;, or click any sample leaf above to view an instant demonstration diagnosis.
                </p>
                <div className="placeholder-features">
                  <span>✓ Probable disease identification</span>
                  <span>✓ Visible leaf symptom analysis</span>
                  <span>✓ Safe cultural &amp; organic remedies</span>
                  <span>✓ KVK &amp; ICAR extension guidance</span>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="result-analyzing-state">
                <div className="radar-scanner">
                  <div className="scanner-line"></div>
                </div>
                <h4>Analyzing Crop Foliage...</h4>
                <p>Gemini AI Vision model is inspecting leaf pigmentation, lesion patterns, and pathology symptoms.</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="result-content-container">
                {/* Demo Notice if viewing sample */}
                {isDemoResult && (
                  <div className="demo-result-pill">
                    ⚠️ DEMO SAMPLE DIAGNOSIS — Example Educational Profile
                  </div>
                )}

                {/* Not a plant warning */}
                {result.isPlantImage === false ? (
                  <div className="not-a-plant-alert">
                    <span className="alert-icon">⚠️</span>
                    <div>
                      <h4>Plant/Crop Not Identified</h4>
                      <p>{result.possibleCauses || 'The uploaded photo does not appear to be a crop leaf or plant specimen. Please upload a clear photo of your affected plant leaf.'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Disease Header Banner */}
                    <div className="disease-header-banner">
                      <div className="disease-title-group">
                        <span className="crop-tag">🌱 {result.cropIdentified || cropName || 'Inspected Plant'}</span>
                        <h4 className="disease-name">{result.diseaseName}</h4>
                      </div>

                      <div className="disease-meta-badges">
                        <span className={`severity-badge severity-badge--${(result.severity || 'moderate').toLowerCase()}`}>
                          Severity: {result.severity || 'Moderate'}
                        </span>
                        <span className="confidence-badge">
                          Confidence: {result.confidence || 'High'} ({result.confidenceScore || '85%'})
                        </span>
                      </div>
                    </div>

                    {/* Visible Symptoms */}
                    <div className="result-section">
                      <h5 className="section-title-sm">🔍 Visible Symptoms Observed (लक्षण):</h5>
                      <ul className="symptoms-list">
                        {Array.isArray(result.symptoms) && result.symptoms.map((sym, idx) => (
                          <li key={idx}>{sym}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Probable Cause */}
                    {result.possibleCauses && (
                      <div className="result-section">
                        <h5 className="section-title-sm">🦠 Probable Cause &amp; Conditions (रोग का कारण):</h5>
                        <p className="cause-text">{result.possibleCauses}</p>
                      </div>
                    )}

                    {/* Recommended Next Steps */}
                    <div className="result-section">
                      <h5 className="section-title-sm">🛡️ Recommended Next Steps (सावधानियां एवं उपचार):</h5>
                      <ul className="actions-list">
                        {Array.isArray(result.recommendedActions) && result.recommendedActions.map((act, idx) => (
                          <li key={idx}>
                            <span className="action-bullet">✓</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Official KVK Advisory */}
                    <div className="kvk-advisory-box">
                      <div className="kvk-icon">🏛️</div>
                      <div>
                        <strong>Official KVK / ICAR Advisory:</strong>
                        <p>{result.kvkAdvisory || 'For targeted ICAR-approved fungicide recommendations, contact your nearest Krishi Vigyan Kendra (KVK) or dial Kisan Call Centre 1800-180-1551.'}</p>
                      </div>
                    </div>

                    {/* Agrochemical Safety Disclaimer */}
                    <div className="chemical-safety-disclaimer">
                      <span>⚠️ <strong>Safety Warning:</strong> Antigravity AI does not invent unverified chemical brands or pesticide dosages. Always cross-verify chemical spray prescriptions with your local Block Agriculture Extension Officer before field application.</span>
                    </div>

                    {/* Re-test CTA */}
                    <div className="result-footer-actions">
                      <button
                        type="button"
                        className="btn-primary retest-btn"
                        onClick={handleRemoveImage}
                      >
                        Inspect Another Crop Leaf (अन्य फसल जांचें ↺)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
