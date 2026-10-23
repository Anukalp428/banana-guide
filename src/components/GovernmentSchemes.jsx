import { useState, useMemo } from 'react';
import './GovernmentSchemes.css';

const SCHEMES = [
  {
    id: 'pmkisan',
    name: 'PM-KISAN',
    hindiName: 'प्रधानमंत्री किसान सम्मान निधि',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    emoji: '💰',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Financial Support',
    categoryLabel: 'Financial Support / वित्तीय सहायता',
    benefit: '₹6,000 / year',
    benefitNote: 'Direct Benefit Transfer (DBT) of ₹6,000 per year transferred in 3 equal four-monthly instalments of ₹2,000 directly into Aadhaar-seeded bank accounts.',
    eligibility: [
      'All landholder farmer families with cultivable land in their names.',
      'Must have valid Aadhaar card linked with bank account & e-KYC completed.',
      'Small and marginal farmers are prioritized across all states & UTs.',
      'Exclusions: Institutional landholders, government employees, income tax payees, and constitutional post holders.',
    ],
    documents: [
      'Aadhaar Card (e-KYC mandatory)',
      'Land Ownership Record (Khatauni / Khasra / Jamabandi)',
      'Bank Account Passbook / Cancelled Cheque (Aadhaar-seeded)',
      'Active Mobile Number linked to Aadhaar for OTP verification',
    ],
    howToApply: 'Register online via the "Farmers Corner" on pmkisan.gov.in, use the PM-KISAN Mobile App, or visit your nearest Village Common Service Centre (CSC) / Panchayat Office.',
    deadline: 'Open year-round (Rolling registrations)',
    officialUrl: 'https://pmkisan.gov.in/',
    helpline: '155261 / 011-24300606 (Toll-Free)',
    color: '#2D6A4F',
    tags: ['DBT', 'Income Support', 'Central Sector Scheme'],
  },
  {
    id: 'pmfby',
    name: 'PM Fasal Bima Yojana (PMFBY)',
    hindiName: 'प्रधानमंत्री फसल बीमा योजना',
    fullName: 'Pradhan Mantri Fasal Bima Yojana',
    emoji: '🛡️',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Crop Insurance',
    categoryLabel: 'Crop Insurance / फसल बीमा',
    benefit: 'Comprehensive Crop Risk Cover',
    benefitNote: 'Provides complete financial coverage against crop losses from natural calamities (flood, drought, cyclone, pest attack). Farmers pay an ultra-low premium: max 2% for Kharif, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops. Balance premium is 100% subsidized by Central and State Governments.',
    eligibility: [
      'All farmers growing notified crops in notified areas (both loanee and non-loanee).',
      'Sharecroppers, tenant farmers, and oral lessees are also eligible.',
      'Coverage spans pre-sowing to post-harvest losses (up to 14 days after harvest for localized perils).',
    ],
    documents: [
      'Aadhaar Card & Identity Proof',
      'Land Possession Certificate / Land Revenue Slip (ROR / 7-12 / Khasra)',
      'Sowing Certificate / Patwari declaration proving crop cultivation',
      'Active Bank Account details (IFSC & Account number)',
      'Tenancy agreement / declaration (for sharecroppers/tenant farmers)',
    ],
    howToApply: 'Apply through banks, local CSC centers, Primary Agricultural Credit Societies (PACS), or directly online at pmfby.gov.in before the seasonal cut-off date.',
    deadline: 'Season-wise Cut-off (Kharif: usually 31st July | Rabi: usually 31st December)',
    officialUrl: 'https://pmfby.gov.in/',
    helpline: '14447 (National Crop Insurance Portal Helpline)',
    color: '#1565C0',
    tags: ['Insurance', 'Drought & Flood Protection', 'Subsidized Premium'],
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    hindiName: 'किसान क्रेडिट कार्ड योजना',
    fullName: 'Kisan Credit Card Scheme',
    emoji: '💳',
    ministry: 'Ministry of Finance / NABARD / MoA&FW',
    category: 'Credit & Loans',
    categoryLabel: 'Credit & Loans / ऋण सुविधा',
    benefit: 'Crop Loans up to ₹3 Lakh @ 4% Interest',
    benefitNote: 'Subsidized short-term agricultural credit up to ₹3,00,000 at a base rate of 7%, further reduced to an effective 4% per annum upon prompt repayment (2% Interest Subvention + 3% Prompt Repayment Incentive). Collateral-free limit available up to ₹1.60 Lakh.',
    eligibility: [
      'All farmers — individual/joint borrowers, owner-cultivators.',
      'Tenant farmers, oral lessees, and sharecroppers with valid crop agreements.',
      'Self Help Groups (SHGs) or Joint Liability Groups (JLGs) of farmers.',
      'Also extended to Animal Husbandry, Dairy, and Fisheries farmers (up to ₹2 Lakh limit).',
      'Age between 18 and 75 years (co-borrower required if age > 60).',
    ],
    documents: [
      'Completed KCC Application Form',
      'Identity Proof (Aadhaar Card, Voter ID, PAN Card)',
      'Address Proof (Aadhaar Card / Electricity Bill)',
      'Land Holding Documents (Khatauni, Khasra, 7/12 extract) certified by Revenue authority',
      'Cropping pattern details for the upcoming agricultural year',
    ],
    howToApply: 'Submit application at any Public Sector Bank, Regional Rural Bank (RRB), Cooperative Bank, or via the PM-KISAN portal (under KCC simplified 1-page form).',
    deadline: 'Open year-round (5-year revolving credit validity with annual review)',
    officialUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    helpline: '1800-180-1551 (Kisan Call Centre)',
    color: '#6A1B9A',
    tags: ['Low Interest', 'Collateral-Free', 'Working Capital'],
  },
  {
    id: 'pmksy',
    name: 'PM Krishi Sinchayee Yojana (PMKSY)',
    hindiName: 'प्रधानमंत्री कृषि सिंचाई योजना',
    fullName: 'Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop)',
    emoji: '💧',
    ministry: 'Ministry of Jal Shakti & MoA&FW',
    category: 'Irrigation',
    categoryLabel: 'Irrigation & Water / सिंचाई सुविधा',
    benefit: 'Up to 55% Subsidy on Drip & Sprinkler Systems',
    benefitNote: 'Provides up to 55% subsidy for small and marginal farmers (and 45% for other farmers) for installing Micro-Irrigation (Drip & Sprinkler) systems under "Per Drop More Crop". Increases water-use efficiency by up to 40% and crop yield by 20–30%.',
    eligibility: [
      'All categories of farmers possessing cultivable land with an assured water source.',
      'Members of cooperative societies, water user associations, and FPOs.',
      'Farmers in water-scarce, drought-prone, and over-exploited groundwater blocks are given top priority.',
    ],
    documents: [
      'Aadhaar Card of the applicant',
      'Land Records (7/12, Jamabandi, Khasra) proving ownership or long-term lease',
      'Electricity Bill / Tubewell connection details (or water source proof)',
      'Bank Account Passbook (IFSC & Account number)',
      'Quotation / Estimate from an empanelled micro-irrigation equipment manufacturer',
    ],
    howToApply: 'Apply through the State Agriculture / Horticulture Department portal, district horticulture office, or via the central PMKSY portal.',
    deadline: 'State-wise rolling application window (Annual financial targets)',
    officialUrl: 'https://pmksy.gov.in/',
    helpline: '011-23382012 (MoA&FW PMKSY Division)',
    color: '#00695C',
    tags: ['Micro-Irrigation', 'Drip & Sprinkler', 'Water Conservation'],
  },
  {
    id: 'pmkusum',
    name: 'PM-KUSUM Solar Scheme',
    hindiName: 'पीएम-कुसुम सौर ऊर्जा योजना',
    fullName: 'Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan',
    emoji: '☀️',
    ministry: 'Ministry of New & Renewable Energy (MNRE)',
    category: 'Solar & Energy',
    categoryLabel: 'Solar & Energy / सौर ऊर्जा',
    benefit: 'Up to 60% Subsidy on Solar Irrigation Pumps',
    benefitNote: 'Under Component-B and Component-C, farmers receive 30% Central Financial Assistance (CFA) + 30% State Government subsidy for installing standalone solar agriculture pumps (up to 7.5 HP) or solarizing existing electric/diesel pumps. Farmer contributes only 10-40% (remaining can be bank-financed). Farmers can also earn money by selling surplus solar energy back to the grid.',
    eligibility: [
      'Individual farmers, groups of farmers, Water User Associations, and FPOs.',
      'Farmers dependent on diesel pumps or located in off-grid rural regions.',
      'Must have farm land requiring irrigation and access to groundwater/surface water.',
    ],
    documents: [
      'Aadhaar Card and Mobile Number',
      'Land Ownership papers (Khasra/Khatauni/ROR)',
      'Bank Account Passbook',
      'Electricity connection consumer number (if solarizing an existing grid pump)',
      'Declaration of water source availability',
    ],
    howToApply: 'Register on your respective State Renewable Energy Development Agency portal (e.g. UPNEDA in UP, HAREDA in Haryana, RREC in Rajasthan) or check the national MNRE portal.',
    deadline: 'State-wise allocation rounds (First-come, first-served basis)',
    officialUrl: 'https://pmkusum.mnre.gov.in/',
    helpline: '1800-180-3333 (National MNRE Toll-Free)',
    color: '#D4AC0D',
    tags: ['Solar Pumps', 'Green Energy', 'Grid Power Sale'],
  },
  {
    id: 'shcs',
    name: 'Soil Health Card Scheme',
    hindiName: 'मृदा स्वास्थ्य कार्ड योजना',
    fullName: 'Soil Health Card (SHC) Scheme',
    emoji: '🧪',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Organic & Soil',
    categoryLabel: 'Soil & Organic / मृदा व उर्वरक',
    benefit: '100% Free Soil Nutrient Testing & Advisory',
    benefitNote: 'Farmers receive a free customized Soil Health Card issued every 2 years. Reports test results across 12 crucial soil parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, Organic Carbon) and recommends exact balanced fertilizer dosages to prevent overuse and reduce cultivation costs by 15-20%.',
    eligibility: [
      'All farmers holding agricultural land anywhere in India.',
      'No application fee or testing fee — 100% funded by Central Government.',
      'Covers all soil types and crop rotations.',
    ],
    documents: [
      'Soil Sample (collected by Village Agriculture Assistant or submitted directly by farmer)',
      'Aadhaar Number & Mobile Number',
      'Basic land survey number / Khasra number',
    ],
    howToApply: 'Soil samples are collected cyclically by state agriculture department teams. Farmers can also submit soil samples directly to the nearest Krishi Vigyan Kendra (KVK) or District Soil Testing Laboratory, or check their card online at soilhealth.dac.gov.in.',
    deadline: 'Open year-round (Cycle-wise card renewals)',
    officialUrl: 'https://soilhealth.dac.gov.in/',
    helpline: '011-23381012 (Soil Health Division)',
    color: '#E65100',
    tags: ['Soil Testing', 'Balanced Fertilizer', 'Free Advisory'],
  },
  {
    id: 'enam',
    name: 'e-NAM (National Agriculture Market)',
    hindiName: 'राष्ट्रीय कृषि बाजार (ई-नाम)',
    fullName: 'National Agriculture Market (e-NAM)',
    emoji: '🏪',
    ministry: 'Ministry of Agriculture & Farmers Welfare (SFAC)',
    category: 'Market & Storage',
    categoryLabel: 'Market & Storage / बाजार व बिक्री',
    benefit: 'Pan-India Online Agricultural Mandi Bidding',
    benefitNote: 'Online trading platform connecting 1,361+ wholesale APMC mandis across 23 States and 4 UTs. Farmers get transparent competitive price discovery through online auctions, quality assaying certification, and direct DBT payments into their bank accounts — removing middlemen commissions.',
    eligibility: [
      'Any farmer possessing agricultural commodities seeking to sell in regulated APMC markets.',
      'FPOs (Farmer Producer Organizations) eligible for bulk trading and institutional sales.',
    ],
    documents: [
      'Aadhaar Card or Government Photo ID',
      'Bank Account Passbook / Cancelled Cheque (for direct online payment transfer)',
      'Mandi Gate Pass / APMC trader registration (issued at mandi entry gate)',
      'Mobile number for real-time SMS bid notifications',
    ],
    howToApply: 'Register free on the e-NAM mobile app, on the official portal enam.gov.in, or at the e-NAM registration desk located at any connected APMC mandi yard.',
    deadline: 'Open year-round (Daily mandi trading hours)',
    officialUrl: 'https://enam.gov.in/',
    helpline: '1800-270-0224 (e-NAM Toll-Free Support)',
    color: '#AD1457',
    tags: ['Online Mandi', 'Direct Buyer Sale', 'Middlemen-Free'],
  },
  {
    id: 'smam',
    name: 'SMAM (Farm Machinery Subsidy)',
    hindiName: 'कृषि यंत्रीकरण उप-मिशन (मशीनरी सब्सिडी)',
    fullName: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    emoji: '🚜',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Machinery & Equipment',
    categoryLabel: 'Machinery & Equipment / कृषि उपकरण',
    benefit: '40% to 50% Subsidy on Farm Machinery & Tractors',
    benefitNote: 'Offers 40% to 50% financial subsidy on the purchase of modern agricultural machinery (Tractors, Power Tillers, Rotavators, Combine Harvesters, Laser Land Levelers, Drone sprayers). Up to 80% subsidy provided for establishing Custom Hiring Centers (CHCs) to make machines available to small farmers on rent.',
    eligibility: [
      'All farmers having registered cultivable land in India.',
      'Special preference & higher subsidy given to Women, SC, ST, Small, and Marginal farmers.',
      'Applicant must not have availed a machinery subsidy for the same equipment type in the preceding 3-5 years.',
    ],
    documents: [
      'Aadhaar Card and Mobile Number',
      'Land Ownership Record (Khatauni / Jamabandi / 7-12)',
      'Bank Account Passbook (Aadhaar linked)',
      'Caste Certificate (for SC/ST categories seeking enhanced subsidy)',
      'Dealer Quotation for the authorized equipment model',
    ],
    howToApply: 'Apply online on the official Direct Benefit Transfer in Agricultural Mechanization portal (agrimachinery.nic.in) or through your district Agriculture Engineering department.',
    deadline: 'State-wise seasonal application windows (Budget allocation rounds)',
    officialUrl: 'https://agrimachinery.nic.in/',
    helpline: '011-23382922 (Mechanization & Technology Division)',
    color: '#C2185B',
    tags: ['Tractor Subsidy', 'Drone Farming', 'Custom Hiring Centers'],
  },
  {
    id: 'pkvy',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    hindiName: 'परंपरागत कृषि विकास योजना (जैविक खेती)',
    fullName: 'Paramparagat Krishi Vikas Yojana (Organic Farming Support)',
    emoji: '🌱',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Organic & Soil',
    categoryLabel: 'Soil & Organic / मृदा व उर्वरक',
    benefit: '₹50,000 / Hectare for Organic Cultivation',
    benefitNote: 'Provides financial assistance of ₹50,000 per hectare over 3 years. Out of this, ₹31,000/ha is directly transferred via DBT to the farmer for purchasing organic inputs (bio-fertilizers, vermicompost, indigenous seeds, bio-pesticides), and the remaining covers cluster formation, PGS-India certification, packaging, and branding.',
    eligibility: [
      'Farmers willing to adopt organic farming in clusters of 20 hectares or 50 farmers.',
      'Individual farmers joining existing Participatory Guarantee System (PGS-India) groups.',
      'Land must be free from prohibited chemical inputs during the 3-year transition.',
    ],
    documents: [
      'Aadhaar Card and Bank Account Passbook',
      'Land revenue document (Khatauni/Khasra/Jamabandi)',
      'Cluster Membership declaration form for PGS-India Organic Certification',
    ],
    howToApply: 'Contact your District Agriculture Officer (DAO) or Krishi Vigyan Kendra (KVK) to enroll in a local PKVY organic farming cluster, or register through the Jaivik Kheti portal (jaivikkheti.in).',
    deadline: 'Annual cluster sanction rounds by state agriculture departments',
    officialUrl: 'https://pgsindia-ncof.gov.in/',
    helpline: '1800-180-1551 (Kisan Call Centre)',
    color: '#2E7D32',
    tags: ['Organic Farming', 'Chemical-Free', 'PGS Certification'],
  },
  {
    id: 'aif',
    name: 'Agriculture Infrastructure Fund (AIF)',
    hindiName: 'कृषि अवसंरचना कोष (गोदाम व कोल्ड स्टोरेज)',
    fullName: 'Agriculture Infrastructure Fund (Post-Harvest Infrastructure)',
    emoji: '🏭',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Market & Storage',
    categoryLabel: 'Market & Storage / बाजार व बिक्री',
    benefit: '3% Interest Subvention on Loans up to ₹2 Crore',
    benefitNote: 'Financing facility for building post-harvest management infrastructure and community farming assets (Cold storage, Warehouses, Silos, Sorting & Grading units, Primary Processing units, Packhouses). Loans up to ₹2 Crore receive a 3% per annum interest subvention for up to 7 years, along with credit guarantee coverage under CGTMSE.',
    eligibility: [
      'Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, and Farmer Producer Organizations (FPOs).',
      'Self Help Groups (SHGs), Joint Liability Groups (JLGs), Multipurpose Cooperative Societies.',
      'Individual farmers and Agri-entrepreneurs setting up post-harvest facilities.',
    ],
    documents: [
      'Detailed Project Report (DPR) of the proposed storage / processing facility',
      'Land Ownership proof or Long-term registered Lease Agreement for project site',
      'Identity & Address Proof (Aadhaar / PAN Card / Registration Certificate)',
      'Bank Account Statements for the last 6 months',
      'Statutory NOCs / local permissions (as applicable)',
    ],
    howToApply: 'Register and submit your online loan application along with the DPR directly on the national AIF portal (agriinfra.dac.gov.in). Participating commercial banks review and sanction the loan.',
    deadline: 'Scheme operational until 2032-33 (Active rolling applications)',
    officialUrl: 'https://agriinfra.dac.gov.in/',
    helpline: '011-23381775 (AIF Project Management Unit)',
    color: '#4E342E',
    tags: ['Cold Storage', 'Warehousing', 'Interest Subvention'],
  },
];

const CATEGORIES = [
  'All',
  'Financial Support',
  'Crop Insurance',
  'Credit & Loans',
  'Irrigation',
  'Solar & Energy',
  'Machinery & Equipment',
  'Organic & Soil',
  'Market & Storage',
];

export default function GovernmentSchemes() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery]           = useState('');
  const [expandedId, setExpandedId]             = useState(null);

  // Filter schemes based on Category and Search Query
  const filteredSchemes = useMemo(() => {
    return SCHEMES.filter(scheme => {
      // Category match
      const matchesCategory = selectedCategory === 'All' || scheme.category === selectedCategory;

      // Search match across English name, Hindi name, full name, ministry, benefits, tags
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesSearch =
        scheme.name.toLowerCase().includes(query) ||
        scheme.hindiName.toLowerCase().includes(query) ||
        scheme.fullName.toLowerCase().includes(query) ||
        scheme.ministry.toLowerCase().includes(query) ||
        scheme.benefit.toLowerCase().includes(query) ||
        scheme.benefitNote.toLowerCase().includes(query) ||
        scheme.tags.some(tag => tag.toLowerCase().includes(query)) ||
        scheme.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setExpandedId(null);
  };

  return (
    <section className="schemes-section" id="schemes">
      <div className="container">
        {/* Header */}
        <div className="schemes-section__header">
          <span className="section-label">🏛️ Government of India</span>
          <h2 className="section-title">Government Schemes for Farmers</h2>
          <p className="section-subtitle">
            Verified agricultural welfare schemes, financial grants, subsidies, and crop insurance
            offered by Central and State Governments to support Indian farmers.
          </p>

          {/* Official Verification Notice Banner */}
          <div className="schemes-trust-banner">
            <span className="schemes-trust-icon">🛡️</span>
            <div>
              <strong>100% Verified Government Schemes:</strong> Data is compiled directly from
              official government portals (Ministry of Agriculture, MNRE, Jal Shakti). Every scheme
              includes verified eligibility criteria and direct links to official{' '}
              <code>.gov.in</code> &amp; <code>.nic.in</code> portals.
            </div>
          </div>
        </div>

        {/* Toolbar: Search Bar + Category Filters */}
        <div className="schemes-toolbar">
          {/* Search Bar */}
          <div className="schemes-search-box">
            <span className="schemes-search-icon">🔍</span>
            <input
              type="text"
              id="schemes-search-input"
              className="schemes-search-input"
              placeholder="Search scheme by name, keyword (e.g. Kisan, Bima, Solar, Tractor, Loan, जैविक)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search government schemes"
            />
            {searchQuery && (
              <button
                type="button"
                className="schemes-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="schemes-categories" role="tablist" aria-label="Filter by category">
            {CATEGORIES.map((cat) => {
              const count = cat === 'All'
                ? SCHEMES.length
                : SCHEMES.filter(s => s.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`category-chip ${selectedCategory === cat ? 'category-chip--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  id={`cat-chip-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <span className="category-chip__label">{cat}</span>
                  <span className="category-chip__count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Results Summary Count */}
          <div className="schemes-count-bar">
            <span>
              Showing <strong>{filteredSchemes.length}</strong> of {SCHEMES.length} verified schemes
              {selectedCategory !== 'All' && <span> in <em>{selectedCategory}</em></span>}
              {searchQuery && <span> matching "<em>{searchQuery}</em>"</span>}
            </span>
            {(selectedCategory !== 'All' || searchQuery) && (
              <button
                type="button"
                className="schemes-reset-btn"
                onClick={handleResetFilters}
              >
                Reset Filters ↺
              </button>
            )}
          </div>
        </div>

        {/* Schemes Cards Grid */}
        {filteredSchemes.length > 0 ? (
          <div className="schemes-grid">
            {filteredSchemes.map((scheme) => {
              const isExpanded = expandedId === scheme.id;

              return (
                <div
                  className={`scheme-card ${isExpanded ? 'scheme-card--expanded' : ''}`}
                  key={scheme.id}
                  id={`scheme-${scheme.id}`}
                >
                  {/* Card Header (Click to expand/collapse) */}
                  <div
                    className="scheme-card__header"
                    onClick={() => toggleExpand(scheme.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(scheme.id);
                      }
                    }}
                  >
                    {/* Emoji Icon */}
                    <div className="scheme-card__icon" style={{ background: scheme.color }}>
                      {scheme.emoji}
                    </div>

                    {/* Title & Ministry */}
                    <div className="scheme-card__header-text">
                      <div className="scheme-card__tags-row">
                        <span className="scheme-card__tag">{scheme.category}</span>
                        <span className="scheme-card__gov-badge">🏛️ Central Scheme</span>
                      </div>
                      <h3 className="scheme-card__name">{scheme.name}</h3>
                      <p className="scheme-card__hindi-name">{scheme.hindiName}</p>
                      <p className="scheme-card__fullname">{scheme.fullName}</p>
                    </div>

                    {/* Benefit Highlight Badge */}
                    <div className="scheme-card__benefit-badge">
                      <span className="benefit-label">Key Benefit</span>
                      <strong className="benefit-value">{scheme.benefit}</strong>
                    </div>

                    {/* Accordion Toggle Icon */}
                    <button
                      type="button"
                      className="scheme-card__toggle"
                      aria-label={isExpanded ? 'Collapse scheme details' : 'Expand scheme details'}
                      id={`scheme-toggle-${scheme.id}`}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="scheme-card__details" id={`scheme-details-${scheme.id}`}>
                      {/* Benefit Description Callout */}
                      <div className="scheme-card__benefit-note">
                        <span className="benefit-note-icon">💡</span>
                        <div>
                          <strong>Verified Benefit Overview:</strong>
                          <p>{scheme.benefitNote}</p>
                        </div>
                      </div>

                      {/* 2-Column Info: Eligibility & How to Apply */}
                      <div className="scheme-card__grid">
                        {/* Eligibility Criteria */}
                        <div className="scheme-card__col">
                          <h4>✅ Eligibility Criteria / पात्रता</h4>
                          <ul>
                            {scheme.eligibility.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Documents Required */}
                        <div className="scheme-card__col">
                          <h4>📄 Required Documents / जरूरी दस्तावेज</h4>
                          <ul className="docs-list">
                            {scheme.documents.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Application Process Box */}
                      <div className="scheme-card__apply-guide">
                        <h4>📋 How to Apply / आवेदन कैसे करें</h4>
                        <p>{scheme.howToApply}</p>
                      </div>

                      {/* Card Footer: Metadata + Official Portal CTA */}
                      <div className="scheme-card__footer">
                        <div className="scheme-card__meta-tags">
                          <span>🏛️ <strong>Ministry:</strong> {scheme.ministry}</span>
                          <span>📅 <strong>Deadline:</strong> {scheme.deadline}</span>
                          <span>📞 <strong>Helpline:</strong> {scheme.helpline}</span>
                        </div>

                        <div className="scheme-card__cta-group">
                          <a
                            href={scheme.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary scheme-card__apply-btn"
                            id={`scheme-portal-${scheme.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>Official Portal</span>
                            <span className="btn-external-icon">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="schemes-empty">
            <div className="schemes-empty__icon">🔍</div>
            <h3 className="schemes-empty__title">No Government Schemes Found</h3>
            <p className="schemes-empty__text">
              We couldn't find any schemes matching "<strong>{searchQuery}</strong>"
              {selectedCategory !== 'All' && <span> in category <strong>{selectedCategory}</strong></span>}.
            </p>
            <button
              type="button"
              className="btn-primary schemes-empty__btn"
              onClick={handleResetFilters}
            >
              Clear Search &amp; Show All Schemes
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
