import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hostels from '../data/hostels';

/**
 * Lightweight client-side preference extractor (mirrors the Python NLP module).
 * When the backend /api/recommend endpoint is ready, replace this with an API call.
 */
function extractPreferences(text) {
  const t = text.toLowerCase();
  const prefs = {};

  // Distance
  const distMatch = t.match(/(?:within|under|less than|max|near)\s*(\d+(?:\.\d+)?)\s*km/);
  if (distMatch) prefs.maxDistance = parseFloat(distMatch[1]);
  else if (/very near|walking distance|very close/.test(t)) prefs.maxDistance = 1;
  else if (/near|close|nearby/.test(t)) prefs.maxDistance = 2;

  // Budget
  const budgetMatch = t.match(/(?:under|below|budget|max|around|less than)\s*(\d{3,6})/);
  if (budgetMatch) prefs.maxPrice = parseFloat(budgetMatch[1]);
  else if (/cheap|affordable|low budget/.test(t)) prefs.maxPrice = 3000;
  else if (/premium|expensive/.test(t)) prefs.maxPrice = 8000;

  // Hostel type
  if (/\b(gents?|boys?|men|male)\b/.test(t)) prefs.hostelType = 'Gents';
  else if (/\b(ladies|girls?|women|female)\b/.test(t)) prefs.hostelType = 'Ladies';
  else if (/\bmixed|co-?ed\b/.test(t)) prefs.hostelType = 'Mixed';

  // Safety
  const safetyMatch = t.match(/safety\s*(?:above|over|at least|min|score)?\s*(\d+)/);
  if (safetyMatch) prefs.minSafety = parseInt(safetyMatch[1]);
  else if (/very safe|high safety|extremely safe/.test(t)) prefs.minSafety = 8;
  else if (/safe|secure|security/.test(t)) prefs.minSafety = 5;

  // Rating
  const ratingMatch = t.match(/rating\s*(?:above|over|at least|min)?\s*(\d+(?:\.\d+)?)/);
  if (ratingMatch) prefs.minRating = parseFloat(ratingMatch[1]);
  else if (/well rated|top rated|highly rated/.test(t)) prefs.minRating = 4;

  // Amenities
  const amenityMap = {
    wifi: 'wifi', 'wi-fi': 'wifi', internet: 'wifi',
    food: 'food', mess: 'food', meal: 'food', dining: 'food',
    ac: 'ac', 'air condition': 'ac',
    parking: 'parking',
    laundry: 'laundry',
    cctv: 'cctv', camera: 'cctv', surveillance: 'cctv',
    clean: 'clean',
    '24/7': 'open24x7', '24x7': 'open24x7', 'open 24': 'open24x7',
  };
  prefs.amenities = [];
  for (const [keyword, flag] of Object.entries(amenityMap)) {
    if (t.includes(keyword) && !prefs.amenities.includes(flag)) {
      prefs.amenities.push(flag);
    }
  }

  return prefs;
}

function scoreHostel(hostel, prefs) {
  let score = 0;
  let maxScore = 0;

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

  if (prefs.minRating) {
    maxScore += 10;
    if (hostel.rating && hostel.rating >= prefs.minRating) score += 10;
  }

  if (prefs.amenities && prefs.amenities.length > 0) {
    const perAmenity = 15 / prefs.amenities.length;
    maxScore += 15;
    for (const flag of prefs.amenities) {
      if (hostel[flag]) score += perAmenity;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}

const SUGGESTIONS = [
  "Safe gents hostel near CUSAT with WiFi under 5000",
  "Ladies hostel close to campus with food and laundry",
  "Cheap hostel within 1 km with good rating",
  "Mixed hostel with AC, parking, and CCTV",
];

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    // Simulate slight delay for natural feel
    setTimeout(() => {
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

      const understood = parts.length > 0
        ? `I understood: ${parts.join(', ')}. Here are my top picks:`
        : "Here are some top-rated hostels for you:";

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: understood, results: scored },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            <span className="ai-chat-badge">Beta</span>
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
                  {msg.results && (
                    <div className="ai-results">
                      {msg.results.map((h) => (
                        <div
                          key={h.id}
                          className="ai-result-card"
                          onClick={() => { navigate(`/hostel/${h.id}`); setIsOpen(false); }}
                        >
                          <div className="ai-result-match">{h.matchScore}%</div>
                          <div className="ai-result-info">
                            <strong>{h.name}</strong>
                            <span>
                              {h.hostelType} · {h.distance} km ·{' '}
                              {h.price ? `₹${h.price.toLocaleString()}/mo` : 'Contact'}
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
                <button key={i} className="ai-suggestion" onClick={() => { setInput(s); }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Describe your ideal hostel..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
