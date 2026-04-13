import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hostels from '../data/hostels';

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ── Client-side fallback (mirrors the Python NLP module) ─────────────────────
function extractPreferences(text) {
  const t = text.toLowerCase();
  const prefs = {};

  const distMatch = t.match(/(?:within|under|less than|max|near)\s*(\d+(?:\.\d+)?)\s*km/);
  if (distMatch) prefs.maxDistance = parseFloat(distMatch[1]);
  else if (/very near|walking distance|very close/.test(t)) prefs.maxDistance = 1;
  else if (/near|close|nearby/.test(t)) prefs.maxDistance = 2;

  const budgetMatch = t.match(/(?:under|below|budget|max|around|less than)\s*(\d{3,6})/);
  if (budgetMatch) prefs.maxPrice = parseFloat(budgetMatch[1]);
  else if (/cheap|affordable|low budget/.test(t)) prefs.maxPrice = 3000;
  else if (/premium|expensive/.test(t)) prefs.maxPrice = 8000;

  if (/\b(gents?|boys?|men|male)\b/.test(t)) prefs.hostelType = 'Gents';
  else if (/\b(ladies|girls?|women|female)\b/.test(t)) prefs.hostelType = 'Ladies';
  else if (/\bmixed|co-?ed\b/.test(t)) prefs.hostelType = 'Mixed';

  const safetyMatch = t.match(/safety\s*(?:above|over|at least|min|score)?\s*(\d+)/);
  if (safetyMatch) prefs.minSafety = parseInt(safetyMatch[1]);
  else if (/very safe|high safety|extremely safe/.test(t)) prefs.minSafety = 8;
  else if (/safe|secure|security/.test(t)) prefs.minSafety = 5;

  const amenityMap = {
    wifi: 'wifi', 'wi-fi': 'wifi', internet: 'wifi',
    food: 'food', mess: 'food', meal: 'food', dining: 'food',
    ac: 'ac', 'air condition': 'ac',
    parking: 'parking', laundry: 'laundry',
    cctv: 'cctv', camera: 'cctv',
    '24/7': 'open24x7', '24x7': 'open24x7',
  };
  prefs.amenities = [];
  for (const [keyword, flag] of Object.entries(amenityMap)) {
    if (t.includes(keyword) && !prefs.amenities.includes(flag)) prefs.amenities.push(flag);
  }
  return prefs;
}

function scoreHostel(hostel, prefs) {
  let score = 0, maxScore = 0;
  if (prefs.maxDistance) {
    maxScore += 25;
    if (hostel.distance && hostel.distance <= prefs.maxDistance) score += 25;
    else if (hostel.distance && hostel.distance <= prefs.maxDistance * 1.5) score += 10;
  }
  if (prefs.maxPrice) {
    maxScore += 20;
    if (hostel.price && hostel.price <= prefs.maxPrice) score += 20;
    else if (hostel.price && hostel.price <= prefs.maxPrice * 1.3) score += 8;
  }
  if (prefs.hostelType) {
    maxScore += 15;
    if (hostel.hostelType === prefs.hostelType || hostel.hostelType === 'Mixed') score += 15;
  }
  if (prefs.minSafety) {
    maxScore += 15;
    if (hostel.safetyScore !== null && hostel.safetyScore >= prefs.minSafety) score += 15;
    else if (hostel.safetyScore !== null && hostel.safetyScore >= prefs.minSafety - 2) score += 7;
  }
  if (prefs.amenities && prefs.amenities.length > 0) {
    const perAmenity = 15 / prefs.amenities.length;
    maxScore += 15;
    for (const flag of prefs.amenities) if (hostel[flag]) score += perAmenity;
  }
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}

function clientSideRecommend(text) {
  const prefs = extractPreferences(text);
  const scored = hostels
    .map((h) => ({ ...h, matchScore: scoreHostel(h, prefs) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const parts = [];
  if (prefs.hostelType) parts.push(`type: **${prefs.hostelType}**`);
  if (prefs.maxDistance) parts.push(`within **${prefs.maxDistance} km**`);
  if (prefs.maxPrice) parts.push(`budget **₹${prefs.maxPrice.toLocaleString()}**`);
  if (prefs.minSafety) parts.push(`safety **${prefs.minSafety}+**`);
  if (prefs.amenities?.length) parts.push(`amenities: **${prefs.amenities.join(', ')}**`);

  return {
    understood: parts.length > 0 ? `I understood: ${parts.join(', ')}. Here are my top picks:` : 'Here are some top-rated hostels for you:',
    results: scored,
    mlPowered: false,
  };
}

// ── ML API call ───────────────────────────────────────────────────────────────
async function mlRecommend(text) {
  const res = await fetch(`${ML_API_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, k: 5 }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('ML API error');
  const data = await res.json();

  // Map ML results to the same shape the UI uses (match by name in static data for id/image)
  const results = data.results.map((r) => {
    const staticMatch = hostels.find(
      (h) => h.name.toLowerCase() === r.name.toLowerCase()
    );
    return {
      id: staticMatch?.id ?? null,
      name: r.name,
      hostelType: r.hostelType,
      distance: r.distance,
      price: r.price,
      rating: r.rating,
      safetyScore: r.safetyScore,
      matchScore: r.matchScore,
      image: staticMatch?.image,
    };
  });

  return { understood: data.understood, results, mlPowered: true };
}

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Safe gents hostel near CUSAT with WiFi under 5000',
  'Ladies hostel close to campus with food and laundry',
  'Cheap hostel within 1 km with good rating',
  'Mixed hostel with AC, parking, and CCTV',
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mlAvailable, setMlAvailable] = useState(null); // null = unknown, true/false
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! 👋 I'm Havenly AI. Describe what you're looking for and I'll find the best hostels for you.\n\nTry: *\"Safe gents hostel near CUSAT with WiFi, budget under 5000\"*",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Check ML availability on first open
  useEffect(() => {
    if (!isOpen || mlAvailable !== null) return;
    fetch(`${ML_API_URL}/health`, { signal: AbortSignal.timeout(2000) })
      .then((r) => r.ok)
      .then(() => setMlAvailable(true))
      .catch(() => setMlAvailable(false));
  }, [isOpen, mlAvailable]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    try {
      let result;
      if (mlAvailable) {
        try {
          result = await mlRecommend(text);
        } catch {
          // ML server failed mid-session — fall back silently
          setMlAvailable(false);
          result = clientSideRecommend(text);
        }
      } else {
        // Small delay to feel natural
        await new Promise((r) => setTimeout(r, 600));
        result = clientSideRecommend(text);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: result.understood, results: result.results, mlPowered: result.mlPowered },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="ai-chat-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Toggle AI recommendations"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <span>🤖 Havenly AI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {mlAvailable === true && (
                <span className="ai-chat-badge" style={{ background: '#10b981' }} title="KNN model active">
                  ⚡ ML-powered
                </span>
              )}
              {mlAvailable === false && (
                <span className="ai-chat-badge" title="Using client-side fallback">
                  offline mode
                </span>
              )}
              {mlAvailable === null && (
                <span className="ai-chat-badge">connecting…</span>
              )}
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ai-msg--${msg.role}`}>
                <div className="ai-msg-bubble">
                  <p dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }} />
                  {msg.mlPowered && (
                    <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>
                      ⚡ Results from KNN model
                    </div>
                  )}
                  {msg.results && (
                    <div className="ai-results">
                      {msg.results.map((h, idx) => (
                        <div
                          key={h.id ?? idx}
                          className="ai-result-card"
                          onClick={() => {
                            if (h.id) { navigate(`/hostel/${h.id}`); setIsOpen(false); }
                          }}
                          style={{ cursor: h.id ? 'pointer' : 'default' }}
                        >
                          <div className="ai-result-match">{h.matchScore}%</div>
                          <div className="ai-result-info">
                            <strong>{h.name}</strong>
                            <span>
                              {h.hostelType} · {h.distance != null ? `${h.distance} km` : '—'} ·{' '}
                              {h.price ? `₹${Math.round(h.price).toLocaleString()}/mo` : 'Contact'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg-bubble ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-suggestion" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Describe your ideal hostel…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend} disabled={!input.trim()}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
