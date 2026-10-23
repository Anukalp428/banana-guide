import { useState, useEffect, useMemo, useCallback } from 'react';
import './CropHistory.css';

const ACTIVITY_TYPES = [
  { id: 'Irrigation',      label: 'Irrigation',       labelHi: 'सिंचाई',          icon: '💧', color: '#0284C7' },
  { id: 'Fertilizer',      label: 'Fertilizer',       labelHi: 'खाद / पोषण',       icon: '🧪', color: '#16A34A' },
  { id: 'Pesticide/Spray', label: 'Pesticide/Spray',  labelHi: 'कीटनाशक / स्प्रे', icon: '🛡️', color: '#EA580C' },
  { id: 'Sowing',          label: 'Sowing',           labelHi: 'बुवाई',           icon: '🌱', color: '#84CC16' },
  { id: 'Weeding',         label: 'Weeding',          labelHi: 'निराई-गुड़ाई',    icon: '🌿', color: '#14B8A6' },
  { id: 'Harvesting',      label: 'Harvesting',       labelHi: 'कटाई',            icon: '🌾', color: '#CA8A04' },
  { id: 'Other',           label: 'Other',            labelHi: 'अन्य कार्य',       icon: '📝', color: '#64748B' },
];

function getNowDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNowTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CropHistory({ onContextUpdate }) {
  const [hi, setHi] = useState(false);
  const [dbStatus, setDbStatus] = useState({ isDbConnected: false, hasMongoUri: false, error: null });
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [activities, setActivities] = useState([]);

  // Filter & Search states
  const [filterField, setFilterField] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // UI modals / drawer states
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Field Form State
  const [fieldName, setFieldName] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');
  const [fieldCropName, setFieldCropName] = useState('');
  const [fieldSowingDate, setFieldSowingDate] = useState('');
  const [fieldArea, setFieldArea] = useState('');

  // Activity Form State
  const [actFieldId, setActFieldId] = useState('');
  const [actCropName, setActCropName] = useState('');
  const [actType, setActType] = useState('Irrigation');
  const [actDate, setActDate] = useState(getNowDate());
  const [actTime, setActTime] = useState(getNowTime());
  const [actProduct, setActProduct] = useState('');
  const [actQuantity, setActQuantity] = useState('');
  const [actUnit, setActUnit] = useState('Kg');
  const [actDuration, setActDuration] = useState('');
  const [actNotes, setActNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync to parent/AI Assistant context whenever fields or activities change
  useEffect(() => {
    if (typeof onContextUpdate === 'function') {
      onContextUpdate({
        fields: fields.map(f => ({ name: f.name, cropName: f.cropName, sowingDate: f.sowingDate })),
        recentActivities: activities.slice(0, 5).map(a => ({
          fieldName: a.fieldName,
          cropName: a.cropName,
          activityType: a.activityType,
          activityDate: a.activityDate,
          productName: a.productName,
          wateringDuration: a.wateringDuration,
        })),
      });
    }
  }, [fields, activities, onContextUpdate]);

  // Load Initial Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch DB status
      let isConnected = false;
      try {
        const sRes = await fetch('/api/crop-history/status');
        if (sRes.ok) {
          const sData = await sRes.json();
          setDbStatus(sData);
          isConnected = sData.isDbConnected;
        }
      } catch (e) {
        console.warn('Status check warning:', e);
      }

      // 2. Fetch Fields
      const fRes = await fetch('/api/crop-history/fields');
      let loadedFields = [];
      if (fRes.ok) {
        const fData = await fRes.json();
        loadedFields = fData.fields || [];
      }

      // 3. Fetch Activities
      const aRes = await fetch('/api/crop-history/activities');
      let loadedActivities = [];
      if (aRes.ok) {
        const aData = await aRes.json();
        loadedActivities = aData.activities || [];
      }

      // If DB is offline, read from localStorage fallback
      if (!isConnected) {
        try {
          const localFields = JSON.parse(localStorage.getItem('farmer_crop_fields') || '[]');
          const localActs = JSON.parse(localStorage.getItem('farmer_crop_activities') || '[]');
          if (localFields.length > 0) {
            loadedFields = [...localFields, ...loadedFields.filter(df => !localFields.some(lf => lf.id === df.id))];
          }
          if (localActs.length > 0) {
            loadedActivities = [...localActs, ...loadedActivities.filter(da => !localActs.some(la => la.id === da.id))];
          }
        } catch (e) {
          console.warn('Local storage parse warning:', e);
        }
      }

      setFields(loadedFields);
      setActivities(loadedActivities);
      if (loadedFields.length > 0 && !actFieldId) {
        setActFieldId(loadedFields[0].id);
        setActCropName(loadedFields[0].cropName);
      }
    } catch (err) {
      console.error('Failed to load crop history data:', err);
    } finally {
      setLoading(false);
    }
  }, [actFieldId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected field changes in activity form, auto-fill cropName
  const handleFieldSelect = (fId) => {
    setActFieldId(fId);
    const selected = fields.find(f => f.id === fId);
    if (selected && selected.cropName) {
      setActCropName(selected.cropName);
    }
  };

  // Create Field Handler
  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!fieldName.trim() || !fieldCropName.trim()) {
      setFeedback({ type: 'error', message: hi ? 'कृपया खेत का नाम और फसल का नाम भरें।' : 'Field Name and Crop Name are required.' });
      return;
    }

    const newFieldObj = {
      id: `local-f-${Date.now()}`,
      name: fieldName.trim(),
      location: fieldLocation.trim(),
      cropName: fieldCropName.trim(),
      sowingDate: fieldSowingDate,
      area: fieldArea.trim(),
      isDemo: !dbStatus.isDbConnected,
    };

    if (dbStatus.isDbConnected) {
      try {
        const res = await fetch('/api/crop-history/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFieldObj),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save field in database');
        setFields(prev => [data.field, ...prev]);
        setFeedback({ type: 'success', message: hi ? 'खेत सफलतापूर्वक सुरक्षित किया गया!' : 'Field added to database successfully!' });
      } catch (err) {
        setFeedback({ type: 'error', message: err.message });
        return;
      }
    } else {
      // Local fallback
      const updated = [newFieldObj, ...fields];
      setFields(updated);
      try {
        const userSaved = updated.filter(f => !f.id.startsWith('demo-'));
        localStorage.setItem('farmer_crop_fields', JSON.stringify(userSaved));
      } catch { /* ignore */ }
      setFeedback({
        type: 'success',
        message: hi
          ? 'खेत लोकल डेमो मोड में सहेजा गया (MongoDB कनेक्ट नहीं है)।'
          : 'Field saved in Local Demo Mode (MongoDB is not configured).',
      });
    }

    // Reset Form
    setFieldName('');
    setFieldLocation('');
    setFieldCropName('');
    setFieldSowingDate('');
    setFieldArea('');
    setShowFieldModal(false);
    setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
  };

  // Delete Field Handler
  const handleDeleteField = async (fId, name) => {
    if (fId.startsWith('demo-')) {
      alert(hi ? 'डेमो खेत मिटाया नहीं जा सकता।' : 'Sample demonstration field cannot be deleted.');
      return;
    }
    const confirm = window.confirm(hi ? `क्या आप "${name}" और इसकी सभी गतिविधियों को मिटाना चाहते हैं?` : `Delete field "${name}" and all its activities?`);
    if (!confirm) return;

    if (dbStatus.isDbConnected) {
      try {
        const res = await fetch(`/api/crop-history/fields/${fId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete field from database');
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    setFields(prev => prev.filter(f => f.id !== fId));
    setActivities(prev => prev.filter(a => a.fieldId !== fId));
    try {
      const userSavedF = fields.filter(f => f.id !== fId && !f.id.startsWith('demo-'));
      const userSavedA = activities.filter(a => a.fieldId !== fId && !a.id.startsWith('demo-'));
      localStorage.setItem('farmer_crop_fields', JSON.stringify(userSavedF));
      localStorage.setItem('farmer_crop_activities', JSON.stringify(userSavedA));
    } catch { /* ignore */ }
  };

  // Reset Activity Form
  const resetActivityForm = () => {
    setEditingActivityId(null);
    setActType('Irrigation');
    setActDate(getNowDate());
    setActTime(getNowTime());
    setActProduct('');
    setActQuantity('');
    setActUnit('Kg');
    setActDuration('');
    setActNotes('');
    setShowActivityForm(false);
  };

  // Edit Activity prefill
  const startEditActivity = (act) => {
    setEditingActivityId(act.id);
    setActFieldId(act.fieldId);
    setActCropName(act.cropName);
    setActType(act.activityType);
    setActDate(act.activityDate);
    setActTime(act.activityTime || '');
    setActProduct(act.productName || '');
    setActQuantity(act.quantity !== null && act.quantity !== undefined ? String(act.quantity) : '');
    setActUnit(act.unit || 'Kg');
    setActDuration(act.wateringDuration || '');
    setActNotes(act.notes || '');
    setShowActivityForm(true);
    window.scrollTo({ top: document.getElementById('crop-history-form')?.offsetTop - 80 || 0, behavior: 'smooth' });
  };

  // Submit Activity (Add / Update)
  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    if (!actFieldId || !actCropName.trim() || !actDate) {
      setFeedback({ type: 'error', message: hi ? 'कृपया खेत, फसल और दिनांक चुनें।' : 'Field, crop name, and activity date are required.' });
      return;
    }

    setSubmitting(true);
    const selectedField = fields.find(f => f.id === actFieldId);
    const fieldDisplayName = selectedField ? selectedField.name : 'Selected Field';

    const actPayload = {
      fieldId: actFieldId,
      fieldName: fieldDisplayName,
      cropName: actCropName.trim(),
      activityType: actType,
      activityDate: actDate,
      activityTime: actTime,
      productName: actProduct.trim(),
      quantity: actQuantity ? Number(actQuantity) : null,
      unit: actUnit,
      wateringDuration: actDuration.trim(),
      notes: actNotes.trim(),
      isDemo: !dbStatus.isDbConnected,
    };

    if (editingActivityId) {
      // UPDATE existing
      if (editingActivityId.startsWith('demo-')) {
        alert(hi ? 'डेमो गतिविधियों को संपादित नहीं किया जा सकता।' : 'Sample demonstration activities cannot be edited.');
        setSubmitting(false);
        return;
      }

      if (dbStatus.isDbConnected) {
        try {
          const res = await fetch(`/api/crop-history/activities/${editingActivityId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actPayload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to update activity');
          setActivities(prev => prev.map(a => a.id === editingActivityId ? data.activity : a));
          setFeedback({ type: 'success', message: hi ? 'गतिविधि सफलतापूर्वक अपडेट की गई!' : 'Activity updated in MongoDB successfully!' });
        } catch (err) {
          setFeedback({ type: 'error', message: err.message });
          setSubmitting(false);
          return;
        }
      } else {
        // Local fallback update
        const updated = activities.map(a => a.id === editingActivityId ? { ...a, ...actPayload } : a);
        setActivities(updated);
        try {
          const userSaved = updated.filter(a => !a.id.startsWith('demo-'));
          localStorage.setItem('farmer_crop_activities', JSON.stringify(userSaved));
        } catch { /* ignore */ }
        setFeedback({ type: 'success', message: hi ? 'गतिविधि लोकल मोड में अपडेट की गई।' : 'Activity updated in Local Demo Mode.' });
      }
    } else {
      // CREATE new
      const newActId = `local-act-${Date.now()}`;
      const newActObj = { id: newActId, ...actPayload };

      if (dbStatus.isDbConnected) {
        try {
          const res = await fetch('/api/crop-history/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActObj),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to save activity to MongoDB');
          setActivities(prev => [data.activity, ...prev]);
          setFeedback({ type: 'success', message: hi ? 'नई गतिविधि डेटाबेस में सुरक्षित हो गई!' : 'New activity saved to MongoDB successfully!' });
        } catch (err) {
          setFeedback({ type: 'error', message: err.message });
          setSubmitting(false);
          return;
        }
      } else {
        // Local fallback create
        const updated = [newActObj, ...activities];
        setActivities(updated);
        try {
          const userSaved = updated.filter(a => !a.id.startsWith('demo-'));
          localStorage.setItem('farmer_crop_activities', JSON.stringify(userSaved));
        } catch { /* ignore */ }
        setFeedback({
          type: 'success',
          message: hi
            ? 'गतिविधि लोकल डेमो मोड में सहेजी गई (MongoDB कनेक्ट नहीं है)।'
            : 'Activity recorded in Local Demo Mode (MongoDB not configured).',
        });
      }
    }

    setSubmitting(false);
    resetActivityForm();
    setTimeout(() => setFeedback({ type: '', message: '' }), 6000);
  };

  // Delete Activity Handler
  const handleDeleteActivity = async (id) => {
    if (id.startsWith('demo-')) {
      alert(hi ? 'डेमो गतिविधि को मिटाया नहीं जा सकता।' : 'Sample demonstration activities cannot be deleted.');
      return;
    }

    const confirm = window.confirm(hi ? 'क्या आप इस गतिविधि को मिटाना चाहते हैं?' : 'Are you sure you want to delete this activity record?');
    if (!confirm) return;

    if (dbStatus.isDbConnected) {
      try {
        const res = await fetch(`/api/crop-history/activities/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete activity from database');
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    try {
      const userSaved = updated.filter(a => !a.id.startsWith('demo-'));
      localStorage.setItem('farmer_crop_activities', JSON.stringify(userSaved));
    } catch { /* ignore */ }
    setFeedback({ type: 'success', message: hi ? 'गतिविधि मिटा दी गई।' : 'Activity deleted successfully.' });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchesField = filterField === 'ALL' || item.fieldId === filterField;
      const matchesType = filterType === 'ALL' || item.activityType === filterType;
      const matchesDate = !dateFilter || item.activityDate === dateFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.cropName?.toLowerCase().includes(q) ||
        item.fieldName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.activityType?.toLowerCase().includes(q);

      return matchesField && matchesType && matchesDate && matchesSearch;
    });
  }, [activities, filterField, filterType, dateFilter, searchQuery]);

  // Group filtered activities by Date for the timeline view
  const groupedTimeline = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(act => {
      const dateKey = act.activityDate || 'Other';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(act);
    });
    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => (a < b ? 1 : -1))
      .map(dateKey => ({
        dateKey,
        items: groups[dateKey],
      }));
  }, [filteredActivities]);

  return (
    <section className="crop-history-section" id="crop-history">
      <div className="container">

        {/* Section Header */}
        <div className="ch-header">
          <div className="ch-header__left">
            <span className="section-label">🌾 {hi ? 'खेत डायरी एवं इतिहास' : 'Farm Activity Journal'}</span>
            <h2 className="section-title">
              {hi ? 'फसल इतिहास एवं कृषि गतिविधियां' : 'Crop History & Activity Timeline'}
            </h2>
            <p className="section-subtitle">
              {hi
                ? 'अपने खेतों का रिकॉर्ड रखें। बुवाई, सिंचाई, खाद, और कटाई की हर गतिविधि दर्ज करें।'
                : 'Track fields, irrigation, fertilizer, spraying, and harvests in an organized farm timeline.'}
            </p>
          </div>
          <div className="ch-header__right">
            <button type="button" className="ch-btn ch-btn--lang" onClick={() => setHi(v => !v)}>
              {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
            </button>
            <button
              type="button"
              className="ch-btn ch-btn--primary"
              onClick={() => { setShowActivityForm(v => !v); setEditingActivityId(null); }}
            >
              {showActivityForm ? (hi ? '✕ फॉर्म बंद करें' : '✕ Close Form') : (hi ? '➕ नई गतिविधि दर्ज करें' : '➕ Log Activity')}
            </button>
            <button
              type="button"
              className="ch-btn ch-btn--outline"
              onClick={() => setShowFieldModal(true)}
            >
              🏡 {hi ? `खेत प्रबंध (${fields.length})` : `Manage Fields (${fields.length})`}
            </button>
          </div>
        </div>

        {/* Database Status Alert Banner */}
        <div className={`ch-status-banner ch-status-banner--${dbStatus.isDbConnected ? 'connected' : 'disconnected'}`}>
          <div className="ch-status-banner__icon">{dbStatus.isDbConnected ? '🟢' : '⚠️'}</div>
          <div className="ch-status-banner__text">
            <strong>
              {dbStatus.isDbConnected
                ? (hi ? 'लाइव डेटाबेस कनेक्टेड (MongoDB)' : 'Live Database Connected (MongoDB Atlas)')
                : (hi ? 'लोकल डेमो मोड सक्रिय (MongoDB कनेक्ट नहीं है)' : 'Local Demo Mode Active (MongoDB Disconnected)')}
            </strong>
            <p>
              {dbStatus.isDbConnected
                ? (hi ? 'आपकी सभी प्रविष्टियां सीधे क्लाउड मोंगोडीबी डेटाबेस में सुरक्षित हो रही हैं।' : 'All farm activities and fields are synced to your persistent MongoDB collection.')
                : (hi
                  ? 'चेतावनी: .env फ़ाइल में MONGODB_URI कॉन्फ़िगर नहीं है। आपकी गतिविधियां इस ब्राउज़र में लोकल रूप से सुरक्षित रहेंगी। मोंगोडीबी में परमानेंट सेव करने के लिए .env में MONGODB_URI जोड़ें।'
                  : 'Notice: MONGODB_URI is not configured in .env. Data is securely saved to your local browser storage. Add MONGODB_URI=mongodb+srv://... to .env for persistent database storage.')}
            </p>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback.message && (
          <div className={`ch-alert ch-alert--${feedback.type}`} role="status">
            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
            <p>{feedback.message}</p>
          </div>
        )}

        {/* ── Add / Edit Activity Form Drawer ── */}
        {showActivityForm && (
          <div className="ch-form-card" id="crop-history-form">
            <div className="ch-form-card__hdr">
              <h3>
                {editingActivityId
                  ? (hi ? '✏️ गतिविधि संपादित करें' : '✏️ Edit Farm Activity')
                  : (hi ? '📝 नई कृषि गतिविधि दर्ज करें' : '📝 Log New Farm Activity')}
              </h3>
              <button type="button" className="ch-btn ch-btn--sm" onClick={resetActivityForm}>
                ✕ {hi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>

            <form onSubmit={handleSubmitActivity} className="ch-form">
              <div className="ch-form-grid">

                {/* Field Selection */}
                <div className="ch-form-group">
                  <label htmlFor="ch-field-select">{hi ? 'खेत चुनें *' : 'Select Field *'}</label>
                  {fields.length === 0 ? (
                    <p className="ch-form-hint">
                      {hi ? 'पहले "खेत प्रबंध" से खेत बनाएं।' : 'Please create a field first using Manage Fields.'}
                    </p>
                  ) : (
                    <select
                      id="ch-field-select"
                      className="ch-input"
                      value={actFieldId}
                      onChange={e => handleFieldSelect(e.target.value)}
                      required
                    >
                      {fields.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.cropName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Crop Name */}
                <div className="ch-form-group">
                  <label htmlFor="ch-crop-input">{hi ? 'फसल का नाम *' : 'Crop Name *'}</label>
                  <input
                    id="ch-crop-input"
                    className="ch-input"
                    value={actCropName}
                    onChange={e => setActCropName(e.target.value)}
                    placeholder="e.g. Wheat, Mustard, Paddy"
                    required
                  />
                </div>

                {/* Activity Type */}
                <div className="ch-form-group">
                  <label htmlFor="ch-type-select">{hi ? 'गतिविधि का प्रकार *' : 'Activity Type *'}</label>
                  <select
                    id="ch-type-select"
                    className="ch-input"
                    value={actType}
                    onChange={e => setActType(e.target.value)}
                    required
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {hi ? t.labelHi : t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="ch-form-group ch-form-group--split">
                  <div>
                    <label htmlFor="ch-date-input">{hi ? 'दिनांक *' : 'Date *'}</label>
                    <input
                      id="ch-date-input"
                      type="date"
                      className="ch-input"
                      value={actDate}
                      onChange={e => setActDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ch-time-input">{hi ? 'समय' : 'Time'}</label>
                    <input
                      id="ch-time-input"
                      type="time"
                      className="ch-input"
                      value={actTime}
                      onChange={e => setActTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Product / Material Name (Optional) */}
                <div className="ch-form-group">
                  <label htmlFor="ch-product-input">
                    {hi ? 'उत्पाद / बीज / दवा का नाम (वैकल्पिक)' : 'Product / Material Name (Optional)'}
                  </label>
                  <input
                    id="ch-product-input"
                    className="ch-input"
                    value={actProduct}
                    onChange={e => setActProduct(e.target.value)}
                    placeholder="e.g. Urea, NPK 19:19:19, Neem Oil, Certified Seed"
                  />
                </div>

                {/* Quantity & Unit (Optional) */}
                <div className="ch-form-group ch-form-group--split">
                  <div>
                    <label htmlFor="ch-qty-input">{hi ? 'मात्रा' : 'Quantity'}</label>
                    <input
                      id="ch-qty-input"
                      type="number"
                      step="any"
                      min="0"
                      className="ch-input"
                      value={actQuantity}
                      onChange={e => setActQuantity(e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label htmlFor="ch-unit-select">{hi ? 'इकाई' : 'Unit'}</label>
                    <select
                      id="ch-unit-select"
                      className="ch-input"
                      value={actUnit}
                      onChange={e => setActUnit(e.target.value)}
                    >
                      <option value="Kg">Kg</option>
                      <option value="Litre">Litre (लीटर)</option>
                      <option value="Bags">Bags (बोरी)</option>
                      <option value="Grams">Grams (ग्राम)</option>
                      <option value="Quintal">Quintal (क्विंटल)</option>
                    </select>
                  </div>
                </div>

                {/* Watering Duration (Conditional emphasis on Irrigation) */}
                <div className="ch-form-group">
                  <label htmlFor="ch-duration-input">
                    💧 {hi ? 'पानी देने की अवधि / समय (सिंचाई हेतु)' : 'Watering Duration (Irrigation)'}
                  </label>
                  <input
                    id="ch-duration-input"
                    className="ch-input"
                    value={actDuration}
                    onChange={e => setActDuration(e.target.value)}
                    placeholder={hi ? 'जैसे: 2.5 घंटे, 45 मिनट' : 'e.g. 2.5 Hours, Tubewell 3 hrs'}
                  />
                </div>

                {/* Notes and Purpose */}
                <div className="ch-form-group ch-form-group--full">
                  <label htmlFor="ch-notes-input">
                    {hi ? 'टिप्पणी एवं उद्देश्य (वैकल्पिक)' : 'Notes & Observations (Optional)'}
                  </label>
                  <textarea
                    id="ch-notes-input"
                    className="ch-input ch-textarea"
                    rows={2}
                    value={actNotes}
                    onChange={e => setActNotes(e.target.value)}
                    placeholder={hi ? 'जैसे: पहले पानी के बाद हल्की खरपतवार दिखी, मौसम साफ था।' : 'e.g. CRI stage watering, applied with light canal flow, clear sunny morning.'}
                  />
                </div>

              </div>

              <div className="ch-form-actions">
                <button type="submit" className="ch-btn ch-btn--primary" disabled={submitting}>
                  {submitting
                    ? (hi ? '⏳ सहेजा जा रहा है...' : '⏳ Saving...')
                    : editingActivityId
                      ? (hi ? '💾 अपडेट करें' : '💾 Update Activity')
                      : (hi ? '✓ गतिविधि सुरक्षित करें' : '✓ Save Activity')}
                </button>
                <button type="button" className="ch-btn ch-btn--outline" onClick={resetActivityForm}>
                  {hi ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filters & Search Control Bar ── */}
        <div className="ch-controls">
          <div className="ch-controls__left">
            {/* Search */}
            <div className="ch-search-box">
              <span className="ch-search-icon">🔍</span>
              <input
                type="text"
                className="ch-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={hi ? 'फसल, उत्पाद या टिप्पणी खोजें...' : 'Search crop, product, notes...'}
              />
              {searchQuery && (
                <button type="button" className="ch-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Field Filter */}
            <select
              className="ch-filter-select"
              value={filterField}
              onChange={e => setFilterField(e.target.value)}
              aria-label="Filter by Field"
            >
              <option value="ALL">🏡 {hi ? 'सभी खेत' : 'All Fields'}</option>
              {fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {/* Activity Type Filter */}
            <select
              className="ch-filter-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              aria-label="Filter by Activity Type"
            >
              <option value="ALL">🏷️ {hi ? 'सभी प्रकार' : 'All Activities'}</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.icon} {hi ? t.labelHi : t.label}</option>
              ))}
            </select>

            {/* Date filter */}
            <input
              type="date"
              className="ch-filter-date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title={hi ? 'दिनांक अनुसार फ़िल्टर' : 'Filter by specific date'}
            />
            {dateFilter && (
              <button type="button" className="ch-clear-btn" onClick={() => setDateFilter('')} title="Clear date">✕</button>
            )}
          </div>

          <div className="ch-controls__right">
            <span className="ch-counter-badge">
              📋 {hi ? 'दर्ज गतिविधियां:' : 'Total:'} <strong>{filteredActivities.length}</strong> / {activities.length}
            </span>
          </div>
        </div>

        {/* ── Timeline Section ── */}
        {loading ? (
          <div className="ch-loading">
            <div className="ch-spinner"></div>
            <p>{hi ? 'गतिविधियां लोड हो रही हैं...' : 'Loading farm activity journal...'}</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="ch-empty">
            <span className="ch-empty__icon">🌾</span>
            <h3>{hi ? 'कोई गतिविधि नहीं मिली' : 'No Activities Found'}</h3>
            <p>
              {hi
                ? 'चुने गए फ़िल्टर के साथ कोई रिकॉर्ड नहीं है। "नई गतिविधि दर्ज करें" बटन से शुरुआत करें।'
                : 'No farm activities match your active filters. Log your first activity above.'}
            </p>
            <button
              type="button"
              className="ch-btn ch-btn--primary"
              onClick={() => { setShowActivityForm(true); setEditingActivityId(null); }}
            >
              ➕ {hi ? 'पहली गतिविधि दर्ज करें' : 'Log First Activity'}
            </button>
          </div>
        ) : (
          <div className="ch-timeline">
            {groupedTimeline.map(group => (
              <div key={group.dateKey} className="ch-date-group">
                <div className="ch-date-header">
                  <span className="ch-date-header__badge">📅 {formatDateDisplay(group.dateKey)}</span>
                  <span className="ch-date-header__count">
                    {group.items.length} {hi ? 'कार्य' : 'actions'}
                  </span>
                </div>

                <div className="ch-activity-list">
                  {group.items.map(act => {
                    const actTypeObj = ACTIVITY_TYPES.find(t => t.id === act.activityType) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
                    return (
                      <div key={act.id} className="ch-act-card" style={{ borderLeftColor: actTypeObj.color }}>
                        <div className="ch-act-card__left">
                          <span className="ch-act-card__icon" style={{ backgroundColor: `${actTypeObj.color}15` }}>
                            {actTypeObj.icon}
                          </span>
                          <div className="ch-act-card__meta">
                            <div className="ch-act-card__title-row">
                              <span className="ch-act-card__type" style={{ color: actTypeObj.color }}>
                                {hi ? actTypeObj.labelHi : actTypeObj.label}
                              </span>
                              <span className="ch-act-card__field">🏡 {act.fieldName}</span>
                              <span className="ch-act-card__crop">🌾 {act.cropName}</span>
                              {act.isDemo && <span className="ch-demo-badge">DEMO / LOCAL</span>}
                            </div>

                            <div className="ch-act-card__details">
                              {act.productName && (
                                <span className="ch-detail-chip">
                                  🏷️ {act.productName}
                                </span>
                              )}
                              {act.quantity !== null && act.quantity !== undefined && (
                                <span className="ch-detail-chip">
                                  ⚖️ {act.quantity} {act.unit || 'Kg'}
                                </span>
                              )}
                              {act.wateringDuration && (
                                <span className="ch-detail-chip ch-detail-chip--water">
                                  ⏱️ {act.wateringDuration}
                                </span>
                              )}
                              {act.activityTime && (
                                <span className="ch-detail-chip ch-detail-chip--time">
                                  🕒 {act.activityTime}
                                </span>
                              )}
                            </div>

                            {act.notes && (
                              <p className="ch-act-card__notes">&ldquo;{act.notes}&rdquo;</p>
                            )}
                          </div>
                        </div>

                        <div className="ch-act-card__actions">
                          <button
                            type="button"
                            className="ch-btn-icon"
                            onClick={() => startEditActivity(act)}
                            title={hi ? 'संपादित करें' : 'Edit activity'}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="ch-btn-icon ch-btn-icon--danger"
                            onClick={() => handleDeleteActivity(act.id)}
                            title={hi ? 'मिटाएं' : 'Delete activity'}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Manage Fields Modal ── */}
        {showFieldModal && (
          <div className="ch-modal-overlay" role="dialog" aria-modal="true">
            <div className="ch-modal">
              <div className="ch-modal__hdr">
                <h3>🏡 {hi ? 'खेत प्रबंधन (Manage Fields)' : 'Manage Farm Fields'}</h3>
                <button type="button" className="ch-modal__close" onClick={() => setShowFieldModal(false)}>✕</button>
              </div>

              <div className="ch-modal__body">
                {/* Existing Fields List */}
                <div className="ch-fields-list">
                  <h4>{hi ? 'पंजीकृत खेत:' : 'Registered Fields:'} ({fields.length})</h4>
                  {fields.length === 0 ? (
                    <p className="ch-empty-hint">{hi ? 'कोई खेत नहीं जोड़ा गया।' : 'No fields added yet.'}</p>
                  ) : (
                    <div className="ch-fields-grid">
                      {fields.map(f => (
                        <div key={f.id} className="ch-field-item">
                          <div>
                            <div className="ch-field-item__name">
                              🏡 {f.name} {f.isDemo && <span className="ch-demo-badge">DEMO</span>}
                            </div>
                            <div className="ch-field-item__crop">🌾 {f.cropName}</div>
                            {f.location && <div className="ch-field-item__loc">📍 {f.location}</div>}
                            {f.sowingDate && <div className="ch-field-item__date">🌱 {hi ? 'बुवाई:' : 'Sown:'} {formatDateDisplay(f.sowingDate)}</div>}
                            {f.area && <div className="ch-field-item__area">📐 {f.area}</div>}
                          </div>
                          {!f.id.startsWith('demo-') && (
                            <button
                              type="button"
                              className="ch-btn-icon ch-btn-icon--danger"
                              onClick={() => handleDeleteField(f.id, f.name)}
                              title="Delete Field"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="ch-divider" />

                {/* Add New Field Form */}
                <form onSubmit={handleCreateField} className="ch-new-field-form">
                  <h4>➕ {hi ? 'नया खेत जोड़ें' : 'Add New Field'}</h4>
                  <div className="ch-form-grid">
                    <div className="ch-form-group">
                      <label>{hi ? 'खेत का नाम *' : 'Field Name *'}</label>
                      <input
                        className="ch-input"
                        value={fieldName}
                        onChange={e => setFieldName(e.target.value)}
                        placeholder="e.g. North Field, Bagicha, Plot 3"
                        required
                      />
                    </div>
                    <div className="ch-form-group">
                      <label>{hi ? 'मुख्य फसल *' : 'Main Crop Name *'}</label>
                      <input
                        className="ch-input"
                        value={fieldCropName}
                        onChange={e => setFieldCropName(e.target.value)}
                        placeholder="e.g. Wheat, Mustard, Paddy"
                        required
                      />
                    </div>
                    <div className="ch-form-group">
                      <label>{hi ? 'स्थान / पता (वैकल्पिक)' : 'Location / Plot (Optional)'}</label>
                      <input
                        className="ch-input"
                        value={fieldLocation}
                        onChange={e => setFieldLocation(e.target.value)}
                        placeholder="e.g. Roorkee Canal Road"
                      />
                    </div>
                    <div className="ch-form-group ch-form-group--split">
                      <div>
                        <label>{hi ? 'बुवाई दिनांक' : 'Sowing Date'}</label>
                        <input
                          type="date"
                          className="ch-input"
                          value={fieldSowingDate}
                          onChange={e => setFieldSowingDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>{hi ? 'रकबा / क्षेत्रफल' : 'Field Area'}</label>
                        <input
                          className="ch-input"
                          value={fieldArea}
                          onChange={e => setFieldArea(e.target.value)}
                          placeholder="e.g. 2.5 Acres"
                        />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="ch-btn ch-btn--primary">
                    {hi ? '✓ खेत जोड़ें' : '✓ Add Field'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
