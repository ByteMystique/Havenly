import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { dataService } from '../services/dataService';
import StarRating from './StarRating';

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="rating-distrib-row">
      <span className="rating-distrib-label">{label}★</span>
      <div className="rating-distrib-bar">
        <div className="rating-distrib-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rating-distrib-count">{count}</span>
    </div>
  );
}

function ReviewCard({ review, currentUserId, onEdit, onDelete }) {
  const initials = review.userName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const isOwn = review.userId === currentUserId;

  return (
    <div className={`review-card ${isOwn ? 'review-card--own' : ''}`}>
      <div className="review-card__header">
        <div className="review-avatar">{initials}</div>
        <div className="review-meta">
          <strong>{review.userName}</strong>
          <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {review.updatedAt && <span className="review-edited">(edited)</span>}
        </div>
        <div className="review-stars">
          <StarRating value={review.rating} readOnly size="sm" />
        </div>
      </div>
      <p className="review-text">{review.text}</p>
      {review.categoryRatings && (
        <div className="review-categories">
          {Object.entries(review.categoryRatings).map(([cat, val]) => (
            <span key={cat} className="review-cat-badge">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}: {val}/5
            </span>
          ))}
        </div>
      )}
      {isOwn && (
        <div className="review-actions">
          <button className="review-edit-btn" onClick={() => onEdit(review)}>✏️ Edit</button>
          <button className="review-delete-btn" onClick={() => onDelete(review.id)}>🗑 Delete</button>
        </div>
      )}
    </div>
  );
}

export default function ReviewSection({ hostelId, hostelName }) {
  const { isLoggedIn, userId, isOwner } = useAuth();
  const toast = useToast();
  const { addNotification } = useNotifications();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(5);

  // Form state
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [catRatings, setCatRatings] = useState({ cleanliness: 0, safety: 0, value: 0, food: 0 });

  const loadReviews = useCallback(async () => {
    const list = await dataService.getHostelReviews(hostelId);
    setReviews(list);
    const own = list.find(r => r.userId === userId);
    setUserReview(own || null);
  }, [hostelId, userId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : 0;
  const dist = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }));

  const sorted = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  const resetForm = () => {
    setRating(0); setText(''); setCatRatings({ cleanliness: 0, safety: 0, value: 0, food: 0 });
    setShowForm(false); setEditingId(null);
  };

  const startEdit = (review) => {
    setRating(review.rating);
    setText(review.text);
    setCatRatings(review.categoryRatings || { cleanliness: 0, safety: 0, value: 0, food: 0 });
    setEditingId(review.id);
    setShowForm(true);
    window.scrollTo({ top: document.querySelector('.review-form-wrap')?.offsetTop - 80, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Rating required', 'Please select a star rating', 2000); return; }
    if (text.trim().length < 10) { toast.error('Too short', 'Review must be at least 10 characters', 2000); return; }
    try {
      if (editingId) {
        await dataService.updateReview(editingId, { rating, text: text.trim(), categoryRatings: catRatings });
        toast.success('Review updated!', '', 2000);
      } else {
        await dataService.createReview(hostelId, { rating, text: text.trim(), categoryRatings: catRatings });
        toast.success('Review posted!', 'Thanks for your feedback', 2000);
        addNotification({ type: 'new_review', title: 'Review Posted', message: `Your review of ${hostelName} was posted.`, link: `/hostel/${hostelId}` });
      }
      resetForm();
      loadReviews();
    } catch (err) {
      toast.error('Error', err.message, 3000);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    await dataService.deleteReview(reviewId);
    toast.info('Deleted', 'Your review has been removed', 2000);
    loadReviews();
  };

  return (
    <div className="review-section">
      <h2 className="review-section__title">Reviews & Ratings</h2>

      {/* Summary */}
      {totalReviews > 0 && (
        <div className="review-summary">
          <div className="review-summary__score">
            <div className="review-big-score">{avgRating}</div>
            <StarRating value={parseFloat(avgRating)} readOnly />
            <div className="review-total">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
          </div>
          <div className="review-distribution">
            {dist.map(d => (
              <RatingBar key={d.star} label={d.star} count={d.count} total={totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {isLoggedIn && !isOwner && (
        <div className="review-form-wrap">
          {!showForm && !userReview && (
            <button className="btn-write-review" onClick={() => setShowForm(true)}>
              ✍️ Write a Review
            </button>
          )}
          {!showForm && userReview && (
            <div className="review-already">
              <span>✅ You have already reviewed this hostel</span>
              <button className="review-edit-btn" onClick={() => startEdit(userReview)}>Edit your review</button>
            </div>
          )}
          {showForm && (
            <form className="review-form" onSubmit={handleSubmit}>
              <h3>{editingId ? 'Edit Your Review' : 'Write a Review'}</h3>
              <div className="review-form-group">
                <label>Overall Rating *</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <div className="review-form-group">
                <label>Your Review *</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Share your experience (min 10 characters)..."
                  rows={4}
                  minLength={10}
                />
                <span className="review-char-count">{text.length}/500</span>
              </div>
              <div className="review-categories-form">
                <label>Category Ratings (optional)</label>
                <div className="review-cat-grid">
                  {['cleanliness', 'safety', 'value', 'food'].map(cat => (
                    <div key={cat} className="review-cat-item">
                      <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      <StarRating value={catRatings[cat]} onChange={v => setCatRatings(prev => ({ ...prev, [cat]: v }))} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="review-form-actions">
                <button type="submit" className="btn-submit-review">
                  {editingId ? 'Update Review' : 'Post Review'}
                </button>
                <button type="button" className="btn-cancel-review" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Review list */}
      {totalReviews > 0 ? (
        <>
          <div className="review-list-header">
            <span>{totalReviews} Review{totalReviews !== 1 ? 's' : ''}</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="review-sort">
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
          <div className="review-list">
            {sorted.slice(0, visibleCount).map(r => (
              <ReviewCard
                key={r.id}
                review={r}
                currentUserId={userId}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {visibleCount < sorted.length && (
            <button className="btn-more-reviews" onClick={() => setVisibleCount(c => c + 5)}>
              Show More Reviews ({sorted.length - visibleCount} remaining)
            </button>
          )}
        </>
      ) : (
        <div className="review-empty">
          <span>💬</span>
          <p>No reviews yet. {isLoggedIn && !isOwner ? 'Be the first to review this hostel!' : ''}</p>
        </div>
      )}
    </div>
  );
}
