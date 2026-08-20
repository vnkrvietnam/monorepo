/**
 * @vnkrvietnam/ui — DataTable
 * Full-featured sortable, filterable, paginated table
 * Used by: merchant portal, admin panel, sandbox dashboard
 *
 * Features:
 *   - Column sort (asc/desc/none)
 *   - Global search filter
 *   - Row selection (checkbox, single/multi)
 *   - Pagination (page size options)
 *   - Loading skeleton state
 *   - Empty state slot
 *   - Row click handler
 *   - Custom cell renderers via column.render()
 *   - Sticky header
 */
import React, { useState, useMemo, useEffect } from "react";
import type { CSSProperties, ReactNode, ChangeEvent } from "react";
import { shadows } from "../../tokens/shadows";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | "none";

export interface DataTableColumn<T = Record<string, unknown>> {
  /** Unique column key */
  key:           string;
  /** Header label */
  label:         string;
  /** Width (px or %) */
  width?:        string | number;
  /** Text alignment */
  align?:        "left" | "center" | "right";
  /** Enable sort on this column */
  sortable?:     boolean;
  /** Custom cell renderer */
  render?:       (value: unknown, row: T, rowIndex: number) => ReactNode;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns:          DataTableColumn<T>[];
  data:             T[];
  /** Row unique key field */
  rowKey?:          string;
  /** Show global search input */
  searchable?:      boolean;
  searchPlaceholder?: string;
  /** Enable row selection */
  selectable?:      boolean;
  selectedKeys?:    string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Row click */
  onRowClick?:      (row: T, index: number) => void;
  /** Pagination */
  pageSize?:        number;
  pageSizeOptions?: number[];
  /** Loading state — shows skeleton rows */
  loading?:         boolean;
  /** Slot shown when data is empty */
  emptySlot?:       ReactNode;
  /** Table caption / title */
  caption?:         string;
  /** Right-side toolbar slot */
  toolbarSlot?:     ReactNode;
  style?:           CSSProperties;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey          = "id",
  searchable      = true,
  searchPlaceholder = "Search…",
  selectable      = false,
  selectedKeys    = [],
  onSelectionChange,
  onRowClick,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  loading         = false,
  emptySlot,
  caption,
  toolbarSlot,
  style,
}: DataTableProps<T>) {

  const [query,     setQuery]     = useState("");
  const [sortKey,   setSortKey]   = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<SortDirection>("none");
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(defaultPageSize);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, columns, query]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey || sortDir === "none") return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); setPage(1); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir("none"); }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const rowIds = paginated.map(r => String(r[rowKey] ?? ""));
  const allSelected = rowIds.length > 0 && rowIds.every(id => selectedKeys.includes(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange(selectedKeys.filter(k => !rowIds.includes(k)));
    else onSelectionChange([...new Set([...selectedKeys, ...rowIds])]);
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedKeys.includes(id)
        ? selectedKeys.filter(k => k !== id)
        : [...selectedKeys, id]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const wrapStyle: CSSProperties = {
    fontFamily: "'Work Sans', sans-serif",
    background: "#FFFFFF",
    borderRadius: 12,
    border:     "1px solid #E5E7EB",
    boxShadow:  shadows.sm,
    overflow:   "hidden",
    ...style,
  };

  return (
    <div style={wrapStyle}>
      {/* Toolbar */}
      {(caption || searchable || toolbarSlot) && (
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "12px 16px",
          borderBottom:   "1px solid #F3F4F6",
          gap:            12,
          flexWrap:       "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            {caption && (
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1F36", whiteSpace: "nowrap" }}>
                {caption}
              </span>
            )}
            {searchable && (
              <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A0AEC0" }}>
                  <SearchIcon />
                </span>
                <input
                  value={query}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  style={{
                    width:        "100%",
                    height:       36,
                    padding:      "0 12px 0 34px",
                    fontSize:     13,
                    fontFamily:   "'Work Sans', sans-serif",
                    background:   "#F5F6FA",
                    border:       "1.5px solid transparent",
                    borderRadius: 8,
                    outline:      "none",
                    color:        "#1A1F36",
                    boxSizing:    "border-box",
                  }}
                  aria-label="Search table"
                />
              </div>
            )}
          </div>
          {toolbarSlot && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {toolbarSlot}
            </div>
          )}
        </div>
      )}

      {/* Table scroll wrapper */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width:          "100%",
          borderCollapse: "collapse",
          fontSize:        13,
          minWidth:        400,
        }}>
          {/* Head */}
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #E5E7EB" }}>
              {selectable && (
                <th style={{ width: 40, padding: "10px 12px", textAlign: "center" }}>
                  <CheckboxInput
                    checked={allSelected}
                    indeterminate={!allSelected && rowIds.some(id => selectedKeys.includes(id))}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding:    "10px 16px",
                    textAlign:  col.align ?? "left",
                    fontWeight: 700,
                    color:      "#57606A",
                    fontSize:   11,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    width:      col.width,
                    cursor:     col.sortable ? "pointer" : "default",
                    userSelect: "none",
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {col.sortable && (
                      <SortIcon dir={sortKey === col.key ? sortDir : "none"} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {selectable && <td style={{ padding: "12px 12px" }}><SkeletonCell width={16} /></td>}
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "12px 16px" }}>
                      <SkeletonCell width={col.width ? undefined : 120} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div style={{
                    padding:        "40px 0",
                    textAlign:      "center",
                    color:          "#A0AEC0",
                    fontSize:       14,
                    fontFamily:     "'Work Sans', sans-serif",
                  }}>
                    {emptySlot ?? "No data found"}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, ri) => {
                const id = String(row[rowKey] ?? ri);
                const isSelected = selectedKeys.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row, ri)}
                    style={{
                      borderBottom: "1px solid #F3F4F6",
                      background:   isSelected ? "#F0F4FF" : "transparent",
                      cursor:       onRowClick ? "pointer" : "default",
                      transition:   "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? "#F0F4FF" : "transparent"; }}
                  >
                    {selectable && (
                      <td style={{ padding: "12px 12px", textAlign: "center" }}
                        onClick={e => { e.stopPropagation(); toggleRow(id); }}>
                        <CheckboxInput checked={isSelected} onChange={() => toggleRow(id)} />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{
                        padding:   "12px 16px",
                        textAlign: col.align ?? "left",
                        color:     "#1A1F36",
                        fontWeight: 400,
                        maxWidth:  200,
                        overflow:  "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {col.render
                          ? col.render(row[col.key], row, ri)
                          : (row[col.key] != null ? String(row[col.key]) : "—")
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "10px 16px",
        borderTop:      "1px solid #F3F4F6",
        flexWrap:       "wrap",
        gap:            8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#718096" }}>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              height:       28,
              fontSize:     12,
              fontFamily:   "'Work Sans', sans-serif",
              border:       "1px solid #E5E7EB",
              borderRadius: 6,
              padding:      "0 6px",
              background:   "#F7F8FA",
              cursor:       "pointer",
              outline:      "none",
            }}
          >
            {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>
            {sorted.length === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)}`}
            {" "}of {sorted.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <PaginationButton
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="First page"
          >«</PaginationButton>
          <PaginationButton
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >‹</PaginationButton>

          {/* Page number pills */}
          {getPageNumbers(page, totalPages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} style={{ padding: "0 4px", color: "#A0AEC0", fontSize: 12 }}>…</span>
            ) : (
              <PaginationButton
                key={n}
                onClick={() => setPage(n as number)}
                active={page === n}
                aria-label={`Page ${n}`}
              >{n}</PaginationButton>
            )
          )}

          <PaginationButton
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >›</PaginationButton>
          <PaginationButton
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
          >»</PaginationButton>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ─── Micro components ─────────────────────────────────────────────────────────

function PaginationButton({ onClick, disabled, active, children, "aria-label": label }: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        minWidth:     28,
        height:       28,
        borderRadius: 6,
        border:       active ? "none" : "1px solid #E5E7EB",
        background:   active ? "#000000" : "transparent",
        color:        active ? "#FFFFFF" : (disabled ? "#CBD5E0" : "#4A5568"),
        fontSize:     12,
        fontFamily:   "'Work Sans', sans-serif",
        fontWeight:   active ? 700 : 400,
        cursor:       disabled ? "not-allowed" : "pointer",
        padding:      "0 6px",
      }}
    >
      {children}
    </button>
  );
}

function SortIcon({ dir }: { dir: SortDirection }) {
  return (
    <svg width="10" height="12" viewBox="0 0 10 14" fill="none">
      <path d="M5 1v12M2 4l3-3 3 3" stroke={dir === "asc" ? "#000" : "#CBD5E0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 10l3 3 3-3" stroke={dir === "desc" ? "#000" : "#CBD5E0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  );
}

function CheckboxInput({
  checked, indeterminate = false, onChange,
}: { checked: boolean; indeterminate?: boolean; onChange: () => void; }) {
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#000" }}
    />
  );
}

function SkeletonCell({ width = 100 }: { width?: number }) {
  return (
    <div style={{
      height:       14,
      width,
      borderRadius: 4,
      background:   "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
      backgroundSize: "200% 100%",
      animation:    "vnkr-skeleton 1.4s ease infinite",
    }} />
  );
}
