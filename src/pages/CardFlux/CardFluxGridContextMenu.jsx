import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const MENU_WIDTH = 220;
const MENU_ITEM_HEIGHT = 44;

const CardFluxGridContextMenu = ({ open, anchorPoint, options, selectedValue, onSelect, onClose }) => {
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const normalizedOptions = useMemo(
    () =>
      Array.isArray(options)
        ? options.map(option => ({
            ...option,
            value: option.value,
            label: option.label,
            iconUrl: option.iconUrl || null,
            icon: option.icon || null,
          }))
        : [],
    [options],
  );

  const initialIndex = useMemo(
    () => {
      if (!normalizedOptions.length) return 0;
      const matchIndex = normalizedOptions.findIndex(option => option.value === selectedValue);
      return matchIndex >= 0 ? matchIndex : 0;
    },
    [normalizedOptions, selectedValue],
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open || !itemRefs.current[activeIndex]) return;
    itemRefs.current[activeIndex].focus();
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = event => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = event => {
      if (!normalizedOptions.length) return;

      const lastIndex = normalizedOptions.length - 1;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = activeIndex >= lastIndex ? 0 : activeIndex + 1;
        setActiveIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const nextIndex = activeIndex <= 0 ? lastIndex : activeIndex - 1;
        setActiveIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
        itemRefs.current[0]?.focus();
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(lastIndex);
        itemRefs.current[lastIndex]?.focus();
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && itemRefs.current[activeIndex]) {
        event.preventDefault();
        itemRefs.current[activeIndex].click();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, normalizedOptions, onClose, open, selectedValue]);

  if (!open) return null;

  const totalHeight = normalizedOptions.length * MENU_ITEM_HEIGHT + 12;
  const viewportWidth = window.innerWidth || 1200;
  const viewportHeight = window.innerHeight || 800;

  const position = {
    left: Math.min(
      Math.max(anchorPoint.x, 12),
      Math.max(12, viewportWidth - MENU_WIDTH - 12),
    ),
    top: Math.min(
      Math.max(anchorPoint.y, 12),
      Math.max(12, viewportHeight - totalHeight - 12),
    ),
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Menu de marcação do quadrante"
      aria-orientation="vertical"
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width: MENU_WIDTH,
        zIndex: 4000,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.22)',
        background: 'rgba(15,23,42,0.96)',
        color: 'var(--text-primary)',
        boxShadow: '0 20px 40px rgba(2,6,23,0.45)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 36,
          padding: '10px 16px',
          borderBottom: '1px solid rgba(148,163,184,0.15)',
          color: 'var(--text-muted)',
          fontSize: '0.67rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        Marcar Quadrante
      </div>

      {normalizedOptions.map((option, index) => {
        const isSelected = option.value === selectedValue;

        return (
          <button
            key={option.label || option.value || `context-option-${index}`}
            ref={element => {
              itemRefs.current[index] = element;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            aria-label={option.label}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              minHeight: 44,
              padding: '10px 16px',
              border: 'none',
              borderBottom: '1px solid rgba(148,163,184,0.04)',
              background: isSelected ? 'rgba(89,171,255,0.12)' : 'transparent',
              color: 'var(--text-primary)',
              textAlign: 'left',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {option.iconUrl ? (
                <img
                  src={option.iconUrl}
                  alt={option.label}
                  style={{
                    width: 20,
                    height: 20,
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : option.icon ? (
                <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{option.icon}</span>
              ) : (
                <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>•</span>
              )}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        role="menuitem"
        tabIndex={activeIndex === normalizedOptions.length ? 0 : -1}
        onClick={() => {
          onSelect(null);
          onClose();
        }}
        ref={element => {
          itemRefs.current[normalizedOptions.length] = element;
        }}
        aria-label="Remover marcador"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          minHeight: 44,
          padding: '10px 16px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          textAlign: 'left',
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(148,163,184,0.12)',
            fontSize: '0.8rem',
            lineHeight: 1,
            color: 'var(--text-secondary)',
          }}
        >
          ×
        </span>
        <span>Remover marcador</span>
      </button>
    </div>,
    document.body,
  );
};

CardFluxGridContextMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorPoint: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string.isRequired,
      iconUrl: PropTypes.string,
      icon: PropTypes.node,
    }),
  ).isRequired,
  selectedValue: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

CardFluxGridContextMenu.defaultProps = {
  anchorPoint: { x: 0, y: 0 },
  selectedValue: null,
};

export default CardFluxGridContextMenu;
