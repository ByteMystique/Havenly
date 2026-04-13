import { useState, useEffect, useCallback } from 'react';

export default function ImageGallery({ images = [], alt = 'Hostel' }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prev, next]);

  if (!images.length) return null;

  return (
    <div className="image-gallery">
      {/* Main image */}
      <div className="gallery-main" onClick={() => setLightbox(true)}>
        <img src={images[active]} alt={`${alt} ${active + 1}`} className="gallery-main__img" />
        {images.length > 1 && (
          <>
            <button className="gallery-arrow gallery-arrow--left" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
            <button className="gallery-arrow gallery-arrow--right" onClick={e => { e.stopPropagation(); next(); }}>›</button>
          </>
        )}
        <div className="gallery-counter">{active + 1} / {images.length}</div>
        <div className="gallery-expand-hint">🔍 Click to expand</div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <img src={img} alt={`${alt} view ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)}>
          <button className="lightbox-close" onClick={() => setLightbox(false)}>✕</button>
          <button className="lightbox-arrow lightbox-arrow--left" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
          <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
            <img src={images[active]} alt={`${alt} ${active + 1}`} className="lightbox-img" />
          </div>
          <button className="lightbox-arrow lightbox-arrow--right" onClick={e => { e.stopPropagation(); next(); }}>›</button>
          <div className="lightbox-counter">{active + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}
