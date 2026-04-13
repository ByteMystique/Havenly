import { useState } from 'react';

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
}) {
  const [hovered, setHovered] = useState(0);

  const display = readOnly ? value : (hovered || value);

  const sizeMap = { sm: 16, md: 24, lg: 32 };
  const px = sizeMap[size] || 24;

  return (
    <div className={`star-rating star-rating--${size}`} style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.floor(display);
        const half = !filled && star - 0.5 <= display;
        return (
          <span
            key={star}
            style={{
              fontSize: px,
              cursor: readOnly ? 'default' : 'pointer',
              color: filled || half ? '#febb02' : '#d1d5db',
              transition: 'color 0.1s, transform 0.1s',
              transform: !readOnly && hovered >= star ? 'scale(1.15)' : 'scale(1)',
              display: 'inline-block',
            }}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            role={readOnly ? undefined : 'button'}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            {half ? '½' : '★'}
          </span>
        );
      })}
      {showValue && <span style={{ fontSize: px * 0.6, color: '#6b7280', marginLeft: 4, alignSelf: 'center' }}>{value.toFixed(1)}</span>}
    </div>
  );
}
