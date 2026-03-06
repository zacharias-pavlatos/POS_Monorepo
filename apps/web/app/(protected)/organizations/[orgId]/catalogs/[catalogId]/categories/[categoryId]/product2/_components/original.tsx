import { useState, useMemo, useRef, useEffect } from 'react';

/* ── Data ── */
const PRODUCTS = [
  {
    id: '1',
    name: 'Classic Margherita',
    categories: ['Pizza', 'Vegetarian'],
    price: 1290,
    image: '🍕',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 3,
    tags: ['popular'],
  },
  {
    id: '2',
    name: 'Chicken Souvlaki',
    categories: ['Grill', 'Mains'],
    price: 1150,
    image: '🍗',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 2,
    tags: ['popular', 'gluten-free'],
  },
  {
    id: '3',
    name: 'Greek Salad',
    categories: ['Salads', 'Vegetarian', 'Starters'],
    price: 890,
    image: '🥗',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 1,
    tags: ['vegan', 'gluten-free'],
  },
  {
    id: '4',
    name: 'Lamb Gyro Wrap',
    categories: ['Wraps', 'Mains'],
    price: 980,
    image: '🌯',
    stock: 'low_stock',
    workstation: 'Grill',
    modifiers: 4,
    tags: [],
  },
  {
    id: '5',
    name: 'Feta Bruschetta',
    categories: ['Starters', 'Vegetarian'],
    price: 750,
    image: '🧀',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 0,
    tags: ['popular'],
  },
  {
    id: '6',
    name: 'Grilled Sea Bass',
    categories: ['Seafood', 'Mains'],
    price: 2450,
    image: '🐟',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 2,
    tags: ['gluten-free'],
  },
  {
    id: '7',
    name: 'Moussaka',
    categories: ['Mains'],
    price: 1380,
    image: '🍲',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 1,
    tags: ['popular'],
  },
  {
    id: '8',
    name: 'Pita Bread Basket',
    categories: ['Sides', 'Vegetarian'],
    price: 350,
    image: '🫓',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 0,
    tags: ['vegan'],
  },
  {
    id: '9',
    name: 'Tzatziki Dip',
    categories: ['Starters', 'Vegetarian'],
    price: 490,
    image: '🥣',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 0,
    tags: ['gluten-free'],
  },
  {
    id: '10',
    name: 'Baklava',
    categories: ['Desserts'],
    price: 650,
    image: '🍯',
    stock: 'low_stock',
    workstation: 'Prep',
    modifiers: 0,
    tags: ['popular'],
  },
  {
    id: '11',
    name: 'Espresso Freddo',
    categories: ['Drinks', 'Cold Drinks'],
    price: 420,
    image: '☕',
    stock: 'in_stock',
    workstation: 'Bar',
    modifiers: 2,
    tags: [],
  },
  {
    id: '12',
    name: 'Lemonade',
    categories: ['Drinks', 'Cold Drinks'],
    price: 380,
    image: '🍋',
    stock: 'out_of_stock',
    workstation: 'Bar',
    modifiers: 1,
    tags: ['vegan'],
  },
  {
    id: '13',
    name: 'Pastitsio',
    categories: ['Mains', 'Oven Baked'],
    price: 1280,
    image: '🍝',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 1,
    tags: [],
  },
  {
    id: '14',
    name: 'Halloumi Fries',
    categories: ['Starters', 'Vegetarian'],
    price: 690,
    image: '🧈',
    stock: 'in_stock',
    workstation: 'Fryer',
    modifiers: 0,
    tags: ['popular', 'vegetarian'],
  },
  {
    id: '15',
    name: 'Spanakopita',
    categories: ['Starters', 'Vegetarian', 'Oven Baked'],
    price: 580,
    image: '🥧',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 0,
    tags: ['vegetarian'],
  },
  {
    id: '16',
    name: 'Octopus Carpaccio',
    categories: ['Seafood', 'Starters'],
    price: 1890,
    image: '🐙',
    stock: 'out_of_stock',
    workstation: 'Cold',
    modifiers: 1,
    tags: ['gluten-free'],
  },
  {
    id: '17',
    name: 'BBQ Ribs',
    categories: ['Grill', 'Mains'],
    price: 1990,
    image: '🍖',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 3,
    tags: ['popular', 'gluten-free'],
  },
  {
    id: '18',
    name: 'Veggie Burger',
    categories: ['Mains', 'Vegetarian'],
    price: 1090,
    image: '🍔',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 2,
    tags: ['vegetarian'],
  },
  {
    id: '19',
    name: 'Tiramisu',
    categories: ['Desserts'],
    price: 790,
    image: '🍰',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 0,
    tags: [],
  },
  {
    id: '20',
    name: 'Frappe',
    categories: ['Drinks', 'Cold Drinks'],
    price: 450,
    image: '🧋',
    stock: 'in_stock',
    workstation: 'Bar',
    modifiers: 2,
    tags: ['popular'],
  },
];

const STOCK_MAP = {
  in_stock: { label: 'In Stock', dot: '#34d399' },
  low_stock: { label: 'Low Stock', dot: '#fbbf24' },
  out_of_stock: { label: 'Out of Stock', dot: '#f87171' },
};

/* ── Filter field definitions ── */
const FILTER_FIELDS = [
  {
    key: 'categories',
    label: 'Category',
    type: 'multi_array',
    options: () => [...new Set(PRODUCTS.flatMap(p => p.categories))].sort(),
  },
  {
    key: 'workstation',
    label: 'Workstation',
    type: 'multi_value',
    options: () => [...new Set(PRODUCTS.map(p => p.workstation))].sort(),
  },
  {
    key: 'stock',
    label: 'Stock Status',
    type: 'multi_value',
    options: () => Object.keys(STOCK_MAP),
    formatOption: v => STOCK_MAP[v]?.label || v,
  },
  {
    key: 'tags',
    label: 'Tag',
    type: 'multi_array',
    options: () => [...new Set(PRODUCTS.flatMap(p => p.tags).filter(Boolean))].sort(),
  },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    min: 0,
    max: 30,
    step: 0.5,
  },
];

function formatPrice(cents) {
  return `€${(cents / 100).toFixed(2)}`;
}

/* ── Icons ── */
const Icon = ({ d, size = 16, sw = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const GridIcon = () => (
  <Icon
    d={
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    }
    size={17}
  />
);
const ListIcon = () => (
  <Icon
    d={
      <>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="0.5" fill="currentColor" />
        <circle cx="3" cy="12" r="0.5" fill="currentColor" />
        <circle cx="3" cy="18" r="0.5" fill="currentColor" />
      </>
    }
    size={17}
  />
);
const SearchIcon = () => (
  <Icon
    d={
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    }
    size={15}
  />
);
const PlusIcon = () => <Icon d="M12 5v14M5 12h14" size={13} sw={2.5} />;
const XIcon = ({ size = 12 }) => <Icon d="M18 6L6 18M6 6l12 12" size={size} sw={2.5} />;
const ChevronDown = () => <Icon d="M6 9l6 6 6-6" size={13} />;
const ChevronUp = () => <Icon d="M6 15l6-6 6 6" size={13} />;
const SortIcon = ({ active, desc }) =>
  active ? (
    desc ? (
      <ChevronDown />
    ) : (
      <ChevronUp />
    )
  ) : (
    <span style={{ opacity: 0.3 }}>
      <ChevronDown />
    </span>
  );
const EyeIcon = () => (
  <Icon
    d={
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    }
    size={15}
  />
);
const SlidersIcon = () => (
  <Icon
    d={
      <>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    }
    size={15}
  />
);

/* ── Column definitions for list view ── */
const INITIAL_COLUMN_CONFIG = [
  { key: 'image', label: 'Image', visible: true },
  { key: 'categories', label: 'Categories', visible: true },
  { key: 'workstation', label: 'Workstation', visible: true },
  { key: 'price', label: 'Price', visible: true },
  { key: 'tags', label: 'Tags', visible: false },
  { key: 'stock', label: 'Status', visible: true },
];

const GripIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <circle cx="9" cy="5" r="1.5" />
    <circle cx="15" cy="5" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="15" cy="19" r="1.5" />
  </svg>
);

/* ── Column Visibility + Reorder Dropdown ── */
function ColumnVisibility({ columnConfig, onChange }) {
  const [open, setOpen] = useState(false);
  const [dragState, setDragState] = useState(null); // { idx, startY, currentY, itemHeight }
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  const toggle = key => {
    onChange(columnConfig.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };

  // Compute which index the dragged item should land at
  const getTargetIdx = () => {
    if (!dragState) return null;
    const { idx, startY, currentY, itemHeight } = dragState;
    const delta = currentY - startY;
    const shift = Math.round(delta / itemHeight);
    const target = Math.max(0, Math.min(columnConfig.length - 1, idx + shift));
    return target;
  };

  const handlePointerDown = idx => e => {
    // Only drag from the handle area
    e.preventDefault();
    const el = itemRefs.current[idx];
    if (!el) return;
    const itemHeight = el.getBoundingClientRect().height;
    const startY = e.clientY;

    const state = { idx, startY, currentY: startY, itemHeight };
    setDragState(state);

    const onMove = ev => {
      setDragState(prev => (prev ? { ...prev, currentY: ev.clientY } : null));
    };

    const onUp = () => {
      setDragState(prev => {
        if (!prev) return null;
        const delta = prev.currentY - prev.startY;
        const shift = Math.round(delta / prev.itemHeight);
        const target = Math.max(0, Math.min(columnConfig.length - 1, prev.idx + shift));
        if (target !== prev.idx) {
          const next = [...columnConfig];
          const [moved] = next.splice(prev.idx, 1);
          next.splice(target, 0, moved);
          // Use setTimeout to avoid state conflict
          setTimeout(() => onChange(next), 0);
        }
        return null;
      });
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const targetIdx = getTargetIdx();
  const ITEM_H = 36;

  // For each item, compute its visual Y offset during drag
  const getItemTransform = i => {
    if (!dragState) return 'none';
    const { idx } = dragState;
    if (i === idx) {
      // Dragged item follows pointer
      return `translateY(${dragState.currentY - dragState.startY}px)`;
    }
    // Other items shift to make room
    if (targetIdx === null) return 'none';
    if (idx < targetIdx) {
      // Dragging down: items between idx+1..targetIdx shift up
      if (i > idx && i <= targetIdx) return `translateY(${-ITEM_H}px)`;
    } else if (idx > targetIdx) {
      // Dragging up: items between targetIdx..idx-1 shift down
      if (i >= targetIdx && i < idx) return `translateY(${ITEM_H}px)`;
    }
    return 'none';
  };

  return (
    <Dropdown
      open={open}
      onClose={() => {
        if (!dragState) setOpen(false);
      }}
      align="right"
      trigger={
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 11px',
            background: 'transparent',
            border: '1px solid #222226',
            borderRadius: 8,
            color: '#71717a',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 120ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3f3f46';
            e.currentTarget.style.color = '#a1a1aa';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#222226';
            e.currentTarget.style.color = '#71717a';
          }}
        >
          <SlidersIcon /> View
        </button>
      }
    >
      <div ref={listRef} style={{ padding: '4px 0', minWidth: 200 }}>
        <div
          style={{
            padding: '4px 12px 8px',
            fontSize: 10,
            color: '#52525b',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Toggle & reorder columns
        </div>
        {columnConfig.map((col, idx) => {
          const isDragging = dragState?.idx === idx;
          return (
            <div
              key={col.key}
              ref={el => (itemRefs.current[idx] = el)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px 6px 6px',
                height: ITEM_H,
                borderRadius: 6,
                fontSize: 13,
                color: col.visible ? '#f4f4f5' : '#52525b',
                background: isDragging ? '#1e1e22' : 'transparent',
                transform: getItemTransform(idx),
                transition: isDragging
                  ? 'none'
                  : 'transform 200ms cubic-bezier(0.2, 0, 0, 1), background 100ms',
                userSelect: 'none',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative',
                zIndex: isDragging ? 10 : 1,
                boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                borderRadius: isDragging ? 8 : 6,
              }}
            >
              {/* Drag handle */}
              <div
                onPointerDown={handlePointerDown(idx)}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  color: isDragging ? '#6366f1' : '#3f3f46',
                  padding: '4px 3px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 3,
                  transition: 'color 100ms',
                  touchAction: 'none',
                }}
                onMouseEnter={e => {
                  if (!dragState) e.currentTarget.style.color = '#71717a';
                }}
                onMouseLeave={e => {
                  if (!dragState) e.currentTarget.style.color = '#3f3f46';
                }}
              >
                <GripIcon />
              </div>
              {/* Checkbox */}
              <div
                role="button"
                onClick={e => {
                  if (!dragState) {
                    e.stopPropagation();
                    toggle(col.key);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: dragState ? 'default' : 'pointer',
                  flex: 1,
                  padding: '2px 4px',
                  borderRadius: 4,
                }}
                onMouseEnter={e => {
                  if (!dragState)
                    e.currentTarget.parentElement.style.background = '#1f1f23';
                }}
                onMouseLeave={e => {
                  if (!dragState && !isDragging)
                    e.currentTarget.parentElement.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: col.visible ? 'none' : '1.5px solid #3f3f46',
                    background: col.visible ? '#6366f1' : 'transparent',
                    transition: 'all 100ms',
                  }}
                >
                  {col.visible && <Icon d="M5 12l5 5L20 7" size={11} sw={2.5} />}
                </span>
                {col.label}
              </div>
            </div>
          );
        })}
      </div>
    </Dropdown>
  );
}

/* ── useClickOutside ── */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = e => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

/* ── Dropdown (reusable) ── */
function Dropdown({ trigger, children, open, onClose, align = 'left' }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            zIndex: 50,
            background: '#1a1a1e',
            border: '1px solid #2a2a2e',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            minWidth: 220,
            padding: '6px',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Multi-select dropdown for filter values ── */
function FilterValuePicker({ field, initialSelected, onApply }) {
  const [selected, setSelected] = useState(initialSelected || []);
  const options = field.options();
  const fmt = field.formatOption || (v => v);
  const toggle = opt => {
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]
    );
  };
  return (
    <div style={{ maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <div
              key={opt}
              role="button"
              onClick={e => {
                e.stopPropagation();
                toggle(opt);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                cursor: 'pointer',
                borderRadius: 6,
                fontSize: 13,
                color: active ? '#f4f4f5' : '#a1a1aa',
                background: active ? '#27272a' : 'transparent',
                transition: 'all 100ms',
                userSelect: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.background = active ? '#27272a' : '#1f1f23')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.background = active ? '#27272a' : 'transparent')
              }
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: active ? 'none' : '1.5px solid #3f3f46',
                  background: active ? '#6366f1' : 'transparent',
                  transition: 'all 100ms',
                }}
              >
                {active && <Icon d="M5 12l5 5L20 7" size={11} sw={2.5} />}
              </span>
              {fmt(opt)}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #27272a', marginTop: 4, padding: '4px 0 0' }}>
        <button
          onClick={e => {
            e.stopPropagation();
            onApply(selected);
          }}
          style={{
            width: '100%',
            padding: '7px',
            background: '#6366f1',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Apply{selected.length > 0 ? ` (${selected.length})` : ''}
        </button>
      </div>
    </div>
  );
}

/* ── Build histogram buckets from product prices ── */
function buildPriceHistogram(products, rangeMin, rangeMax, bucketCount = 20) {
  const bucketSize = (rangeMax - rangeMin) / bucketCount;
  const buckets = Array(bucketCount).fill(0);
  products.forEach(p => {
    const priceEuros = p.price / 100;
    const idx = Math.min(
      Math.floor((priceEuros - rangeMin) / bucketSize),
      bucketCount - 1
    );
    if (idx >= 0) buckets[idx]++;
  });
  const maxCount = Math.max(...buckets, 1);
  return buckets.map(count => ({ count, height: count / maxCount }));
}

/* ── Dual-thumb range slider with histogram ── */
function DualRangeSlider({
  min: rangeMin,
  max: rangeMax,
  value,
  onChange,
  step = 0.5,
  histogram,
}) {
  const [lo, hi] = value;
  const trackRef = useRef(null);

  const pct = v => ((v - rangeMin) / (rangeMax - rangeMin)) * 100;
  const loP = pct(lo);
  const hiP = pct(hi);

  const clamp = v => Math.round(Math.min(rangeMax, Math.max(rangeMin, v)) / step) * step;

  const handlePointer = thumb => e => {
    e.preventDefault();
    const track = trackRef.current;
    const rect = track.getBoundingClientRect();

    const move = ev => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const ratio = (clientX - rect.left) / rect.width;
      const raw = rangeMin + ratio * (rangeMax - rangeMin);
      const clamped = clamp(raw);
      if (thumb === 'lo') onChange([Math.min(clamped, hi - step), hi]);
      else onChange([lo, Math.max(clamped, lo + step)]);
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move);
    document.addEventListener('touchend', up);
  };

  const thumbStyle = {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#f4f4f5',
    border: '2px solid #6366f1',
    transform: 'translate(-50%, 50%)',
    cursor: 'grab',
    zIndex: 3,
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    touchAction: 'none',
  };

  const HIST_HEIGHT = 56;
  const bucketCount = histogram ? histogram.length : 0;
  const bucketWidth = bucketCount > 0 ? 100 / bucketCount : 0;

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        touchAction: 'none',
        cursor: 'pointer',
        paddingBottom: 10,
      }}
    >
      {/* Histogram bars */}
      {histogram && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            height: HIST_HEIGHT,
            gap: 1,
            padding: '0 0 0 0',
            marginBottom: 0,
          }}
        >
          {histogram.map((bucket, i) => {
            const barLeft = i * bucketWidth;
            const barRight = (i + 1) * bucketWidth;
            const inRange = barRight > loP && barLeft < hiP;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(bucket.height * 100, bucket.count > 0 ? 8 : 0)}%`,
                  minHeight: bucket.count > 0 ? 3 : 0,
                  background: inRange ? '#6366f1' : '#27272a',
                  borderRadius: '2px 2px 0 0',
                  transition: 'background 120ms, height 200ms',
                  opacity: inRange ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Track area */}
      <div style={{ position: 'relative', height: 4 }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 4,
            background: '#27272a',
            borderRadius: 2,
          }}
        />
        {/* Active range */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: 4,
            borderRadius: 2,
            background: '#6366f1',
            left: `${loP}%`,
            width: `${hiP - loP}%`,
          }}
        />
        {/* Low thumb */}
        <div
          onMouseDown={handlePointer('lo')}
          onTouchStart={handlePointer('lo')}
          style={{ ...thumbStyle, left: `${loP}%` }}
        />
        {/* High thumb */}
        <div
          onMouseDown={handlePointer('hi')}
          onTouchStart={handlePointer('hi')}
          style={{ ...thumbStyle, left: `${hiP}%` }}
        />
      </div>
    </div>
  );
}

/* ── Range picker for price ── */
function FilterRangePicker({ field, value, onChange, onDone }) {
  const [min, max] = value || [field.min, field.max];
  const histogram = useMemo(
    () => buildPriceHistogram(PRODUCTS, field.min, field.max, 20),
    []
  );
  // Count products in current selection
  const selectedCount = useMemo(() => {
    return PRODUCTS.filter(p => {
      const e = p.price / 100;
      return e >= min && e <= max;
    }).length;
  }, [min, max]);

  return (
    <div
      style={{
        padding: '10px 8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 260,
      }}
    >
      {/* Slider with histogram */}
      <div style={{ padding: '0 2px' }}>
        <DualRangeSlider
          min={field.min}
          max={field.max}
          step={field.step}
          value={[min, max]}
          onChange={onChange}
          histogram={histogram}
        />
      </div>
      {/* Number inputs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: '#52525b',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
            }}
          >
            MIN
          </span>
          <input
            type="number"
            value={min}
            step={field.step}
            onChange={e => {
              const v = Math.min(+e.target.value, max - field.step);
              onChange([Math.max(field.min, v), max]);
            }}
            style={rangeInputStyle}
          />
        </div>
        <span style={{ color: '#3f3f46', fontSize: 14, marginTop: 14 }}>–</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              color: '#52525b',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
            }}
          >
            MAX
          </span>
          <input
            type="number"
            value={max}
            step={field.step}
            onChange={e => {
              const v = Math.max(+e.target.value, min + field.step);
              onChange([min, Math.min(field.max, v)]);
            }}
            style={rangeInputStyle}
          />
        </div>
      </div>
      {/* Count + range label */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span
          style={{
            fontSize: 11,
            color: '#6366f1',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}
        >
          {selectedCount} product{selectedCount !== 1 ? 's' : ''}
        </span>
        <span
          style={{
            fontSize: 11,
            color: '#52525b',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          €{min.toFixed(2)} — €{max.toFixed(2)}
        </span>
      </div>
      <button
        onClick={onDone}
        style={{
          padding: '8px',
          background: '#6366f1',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Apply
      </button>
    </div>
  );
}
const rangeInputStyle = {
  padding: '6px 8px',
  background: '#0f0f11',
  border: '1px solid #27272a',
  borderRadius: 6,
  color: '#f4f4f5',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  width: '100%',
};

/* ── Filter Builder ── */
function FilterBuilder({ filters, onFiltersChange }) {
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null); // { key, tempValue }

  const addFilter = fieldKey => {
    const field = FILTER_FIELDS.find(f => f.key === fieldKey);
    const initial = field.type === 'range' ? [field.min, field.max] : [];
    setFieldPickerOpen(false);
    setEditingFilter({ key: fieldKey, tempValue: initial });
  };

  const commitFilter = () => {
    if (!editingFilter) return;
    const { key, tempValue } = editingFilter;
    const field = FILTER_FIELDS.find(f => f.key === key);
    const isEmpty =
      field.type === 'range'
        ? tempValue[0] === field.min && tempValue[1] === field.max
        : tempValue.length === 0;
    if (isEmpty) {
      setEditingFilter(null);
      return;
    }
    onFiltersChange({ ...filters, [key]: tempValue });
    setEditingFilter(null);
  };

  const removeFilter = key => {
    const next = { ...filters };
    delete next[key];
    onFiltersChange(next);
  };

  const activeKeys = Object.keys(filters);
  const availableFields = FILTER_FIELDS.filter(
    f => !activeKeys.includes(f.key) && editingFilter?.key !== f.key
  );

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {/* Active filter chips */}
      {activeKeys.map(key => {
        const field = FILTER_FIELDS.find(f => f.key === key);
        const val = filters[key];
        const fmt = field.formatOption || (v => v);
        const label =
          field.type === 'range'
            ? `€${val[0].toFixed(2)} – €${val[1].toFixed(2)}`
            : val.map(fmt).join(', ');
        return (
          <span
            key={key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 8px 5px 10px',
              background: '#1e1e22',
              border: '1px solid #2a2a2e',
              borderRadius: 7,
              fontSize: 12,
              color: '#d4d4d8',
              fontFamily: "'DM Sans', sans-serif",
              maxWidth: 260,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                color: '#6366f1',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                flexShrink: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {field.label}
            </span>
            <span style={{ color: '#52525b', flexShrink: 0 }}>is</span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
            <button
              onClick={() => removeFilter(key)}
              style={{
                background: 'none',
                border: 'none',
                color: '#52525b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                flexShrink: 0,
                borderRadius: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
            >
              <XIcon size={11} />
            </button>
          </span>
        );
      })}

      {/* Editing filter (in-progress) */}
      {editingFilter &&
        (() => {
          const field = FILTER_FIELDS.find(f => f.key === editingFilter.key);
          return (
            <Dropdown
              open={true}
              onClose={() => setEditingFilter(null)}
              trigger={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    background: '#6366f1',
                    borderRadius: 7,
                    fontSize: 12,
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {field.label}
                </span>
              }
            >
              {field.type === 'range' ? (
                <FilterRangePicker
                  field={field}
                  value={editingFilter.tempValue}
                  onChange={v => setEditingFilter({ ...editingFilter, tempValue: v })}
                  onDone={commitFilter}
                />
              ) : (
                <FilterValuePicker
                  key={editingFilter.key}
                  field={field}
                  initialSelected={editingFilter.tempValue}
                  onApply={selected => {
                    if (selected.length === 0) {
                      setEditingFilter(null);
                      return;
                    }
                    onFiltersChange({ ...filters, [editingFilter.key]: selected });
                    setEditingFilter(null);
                  }}
                />
              )}
            </Dropdown>
          );
        })()}

      {/* + Filter button */}
      {availableFields.length > 0 && !editingFilter && (
        <Dropdown
          open={fieldPickerOpen}
          onClose={() => setFieldPickerOpen(false)}
          trigger={
            <button
              onClick={() => setFieldPickerOpen(!fieldPickerOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                background: 'transparent',
                border: '1px dashed #3f3f46',
                borderRadius: 7,
                color: '#71717a',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 120ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.color = '#a1a1aa';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#3f3f46';
                e.currentTarget.style.color = '#71717a';
              }}
            >
              <PlusIcon /> Filter
            </button>
          }
        >
          {availableFields.map(f => (
            <button
              key={f.key}
              onClick={() => addFilter(f.key)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                color: '#d4d4d8',
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 100ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {f.label}
            </button>
          ))}
        </Dropdown>
      )}

      {/* Clear all */}
      {activeKeys.length > 0 && (
        <button
          onClick={() => onFiltersChange({})}
          style={{
            background: 'none',
            border: 'none',
            color: '#52525b',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '4px 6px',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/* ── Stock Badge ── */
function StockBadge({ stock }) {
  const s = STOCK_MAP[stock];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        color: s.dot,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

/* ── Category Pills ── */
function CategoryPills({ categories }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {categories.map(c => (
        <span
          key={c}
          style={{
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 5,
            background: '#1c1c1f',
            color: '#71717a',
            fontWeight: 500,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

/* ── Card View ── */
function CardGrid({ rows }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 10,
      }}
    >
      {rows.map(p => (
        <div
          key={p.id}
          style={{
            background: '#141416',
            border: '1px solid #222226',
            borderRadius: 10,
            padding: 14,
            cursor: 'pointer',
            transition: 'all 180ms',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3f3f46';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#222226';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div
            style={{
              background: '#0c0c0e',
              borderRadius: 8,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            {p.image}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#f4f4f5',
                fontFamily: "'DM Sans', sans-serif",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </span>
            <CategoryPills categories={p.categories} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#e4e4e7',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {formatPrice(p.price)}
            </span>
            <StockBadge stock={p.stock} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sortable Header ── */
function SortableHeader({ label, field, sortField, sortDesc, onSort, width }) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '9px 12px',
        textAlign: 'left',
        fontSize: 10,
        fontWeight: 600,
        color: active ? '#a1a1aa' : '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        fontFamily: "'JetBrains Mono', monospace",
        borderBottom: '1px solid #222226',
        background: 'transparent',
        width,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        <SortIcon active={active} desc={sortDesc} />
      </span>
    </th>
  );
}

/* ── List / Table View ── */
const HEADER_STYLE = {
  padding: '9px 12px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  color: '#52525b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: "'JetBrains Mono', monospace",
  borderBottom: '1px solid #222226',
};

const COLUMN_RENDERERS = {
  image: {
    header: props => <th key="image" style={{ ...HEADER_STYLE, width: 40 }} />,
    cell: p => (
      <td key="image" style={{ padding: '8px 12px', fontSize: 20, textAlign: 'center' }}>
        {p.image}
      </td>
    ),
  },
  categories: {
    header: props => (
      <th key="categories" style={HEADER_STYLE}>
        Categories
      </th>
    ),
    cell: p => (
      <td key="categories" style={{ padding: '8px 12px' }}>
        <CategoryPills categories={p.categories} />
      </td>
    ),
  },
  workstation: {
    header: ({ sortField, sortDesc, onSort }) => (
      <SortableHeader
        key="workstation"
        label="Workstation"
        field="workstation"
        sortField={sortField}
        sortDesc={sortDesc}
        onSort={onSort}
      />
    ),
    cell: p => (
      <td
        key="workstation"
        style={{
          padding: '8px 12px',
          fontSize: 12,
          color: '#a1a1aa',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {p.workstation}
      </td>
    ),
  },
  price: {
    header: ({ sortField, sortDesc, onSort }) => (
      <SortableHeader
        key="price"
        label="Price"
        field="price"
        sortField={sortField}
        sortDesc={sortDesc}
        onSort={onSort}
        width={100}
      />
    ),
    cell: p => (
      <td
        key="price"
        style={{
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: '#e4e4e7',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {formatPrice(p.price)}
      </td>
    ),
  },
  tags: {
    header: props => (
      <th key="tags" style={HEADER_STYLE}>
        Tags
      </th>
    ),
    cell: p => (
      <td key="tags" style={{ padding: '8px 12px' }}>
        {p.tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.tags.map(t => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: '#1c1c1f',
                  color: '#71717a',
                  fontWeight: 500,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#27272a', fontSize: 12 }}>—</span>
        )}
      </td>
    ),
  },
  stock: {
    header: props => (
      <th key="stock" style={HEADER_STYLE}>
        Status
      </th>
    ),
    cell: p => (
      <td key="stock" style={{ padding: '8px 12px' }}>
        <StockBadge stock={p.stock} />
      </td>
    ),
  },
};

function ListView({ rows, sortField, sortDesc, onSort, columnConfig }) {
  const visibleCols = columnConfig.filter(c => c.visible);
  const showTags = visibleCols.some(c => c.key === 'tags');

  return (
    <div style={{ border: '1px solid #222226', borderRadius: 10, overflow: 'hidden' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <thead>
          <tr style={{ background: '#141416' }}>
            {/* Product name is always first */}
            <SortableHeader
              label="Product"
              field="name"
              sortField={sortField}
              sortDesc={sortDesc}
              onSort={onSort}
            />
            {visibleCols.map(col =>
              COLUMN_RENDERERS[col.key]?.header({ sortField, sortDesc, onSort })
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr
              key={p.id}
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid #1a1a1e' : 'none',
                cursor: 'pointer',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#141416')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Product name is always first */}
              <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>
                    {p.name}
                  </span>
                  {!showTags && p.tags.length > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: '#52525b',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {p.tags.join(' · ')}
                    </span>
                  )}
                </div>
              </td>
              {visibleCols.map(col => COLUMN_RENDERERS[col.key]?.cell(p))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pagination ── */
function Pagination({ page, pageCount, onPage, totalFiltered }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        padding: '0 2px',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: '#3f3f46',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {totalFiltered} results · page {page + 1}/{pageCount}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { label: '‹', go: page - 1, disabled: page === 0 },
          { label: '›', go: page + 1, disabled: page >= pageCount - 1 },
        ].map(({ label, go, disabled }) => (
          <button
            key={label}
            disabled={disabled}
            onClick={() => onPage(go)}
            style={{
              padding: '5px 12px',
              fontSize: 13,
              fontWeight: 600,
              background: disabled ? 'transparent' : '#1e1e22',
              border: '1px solid #222226',
              borderRadius: 6,
              color: disabled ? '#27272a' : '#a1a1aa',
              cursor: disabled ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Filtering engine ── */
function applyFilters(products, filters) {
  return products.filter(p => {
    for (const [key, value] of Object.entries(filters)) {
      const field = FILTER_FIELDS.find(f => f.key === key);
      if (!field) continue;

      if (field.type === 'multi_array') {
        // product has an array field → check intersection
        if (!value.some(v => p[key].includes(v))) return false;
      } else if (field.type === 'multi_value') {
        // product has a single value → check inclusion
        if (!value.includes(p[key])) return false;
      } else if (field.type === 'range') {
        const priceEuros = p.price / 100;
        if (priceEuros < value[0] || priceEuros > value[1]) return false;
      }
    }
    return true;
  });
}

/* ── Main ── */
const PAGE_SIZE = 10;

export default function ProductGrid() {
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_COLUMN_CONFIG);

  const handleSort = field => {
    if (sortField === field) setSortDesc(!sortDesc);
    else {
      setSortField(field);
      setSortDesc(false);
    }
    setPage(0);
  };

  const processed = useMemo(() => {
    let result = PRODUCTS;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.categories.some(c => c.toLowerCase().includes(q)) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Faceted filters
    result = applyFilters(result, filters);

    // Sort
    result = [...result].sort((a, b) => {
      const va = a[sortField],
        vb = b[sortField];
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDesc ? -cmp : cmp;
    });

    return result;
  }, [search, filters, sortField, sortDesc]);

  const pageCount = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = processed.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0b0d',
        color: '#f4f4f5',
        padding: '24px 22px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1
            style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}
          >
            Products
          </h1>
          <span
            style={{
              fontSize: 10,
              color: '#3f3f46',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
            }}
          >
            CATALOG
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Column visibility — list view only */}
          {view === 'list' && (
            <ColumnVisibility
              columnConfig={visibleColumns}
              onChange={setVisibleColumns}
            />
          )}
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid #222226',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {[
              { key: 'card', I: GridIcon },
              { key: 'list', I: ListIcon },
            ].map(({ key, I }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  padding: '7px 12px',
                  background: view === key ? '#222226' : 'transparent',
                  border: 'none',
                  color: view === key ? '#f4f4f5' : '#52525b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 120ms',
                }}
              >
                <I />
              </button>
            ))}
          </div>
          {/* Add button */}
          <button
            onClick={() => alert('Open create product form')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 14px',
              background: '#6366f1',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5558e6')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
          >
            <PlusIcon /> Add
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12, maxWidth: 360 }}>
        <div
          style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#52525b',
            pointerEvents: 'none',
          }}
        >
          <SearchIcon />
        </div>
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search products, categories, tags..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            background: '#141416',
            border: '1px solid #222226',
            borderRadius: 8,
            color: '#f4f4f5',
            fontSize: 13,
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* Filter builder */}
      <div style={{ marginBottom: 14 }}>
        <FilterBuilder
          filters={filters}
          onFiltersChange={f => {
            setFilters(f);
            setPage(0);
          }}
        />
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            color: '#27272a',
            fontSize: 13,
          }}
        >
          No products match your filters.
        </div>
      ) : view === 'card' ? (
        <CardGrid rows={rows} />
      ) : (
        <ListView
          rows={rows}
          sortField={sortField}
          sortDesc={sortDesc}
          onSort={handleSort}
          columnConfig={visibleColumns}
        />
      )}

      <Pagination
        page={safePage}
        pageCount={pageCount}
        onPage={setPage}
        totalFiltered={processed.length}
      />
    </div>
  );
}
