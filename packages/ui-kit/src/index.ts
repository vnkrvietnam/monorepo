/**
 * @vnkrvietnam/ui
 * ═══════════════════════════════════════════════════════════════════
 * VNKR Organisation — Exclusive Design System Library v1.1.0
 * Author: Nhâm Quốc Huân (IP axvn-network) | © UNLICENSED
 * ═══════════════════════════════════════════════════════════════════
 *
 * Atomic Design Architecture:
 *  Phase 1 — Foundation  : Logo · Color Tokens · Typography · Shadow · Grid
 *  Phase 2 — Atoms       : Icons · Buttons · Inputs
 *  Phase 3 — Molecules   : WalletCard · Toggle · Badge · ListItem · BottomNavbar · Modal
 *  Phase 4 — Organisms   : TopNavbar · Sidebar · DataTable · Chart · Toast · FormWizard · QRCodeModal
 *  Phase 5 — Assets      : Thumbnail
 */

// ── Phase 1: Foundation Tokens ────────────────────────────────────────────────
export * from "./tokens";

// ── Phase 1: Logo ─────────────────────────────────────────────────────────────
export { VnkrLogo, LogoGuide }                              from "./components/Logo";
export type { LogoProps, LogoVariant, LogoSize }             from "./components/Logo";

// ── Phase 1: Typography ───────────────────────────────────────────────────────
export { Text, TypographyScale }                             from "./components/Typography";
export type { TextProps, TextVariant, TextWeight, TextAlign } from "./components/Typography";

// ── Phase 1: Color Palette ────────────────────────────────────────────────────
export { ColorPalette }                                      from "./components/ColorPalette";

// ── Phase 2: Icons ────────────────────────────────────────────────────────────
export {
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ArrowSwap, ArrowRefresh, ArrowExport, ArrowImport,
  Bookmark, BookmarkCheck, BookmarkPlus, BookmarkMinus, BookOpen,
  BarChartIcon, LineChartIcon, PieChartIcon,
  TrendUp, TrendDown, Activity, Monitor,
  Phone, PhoneCall, PhonePlus, PhoneMissed, PhoneOff,
  Folder, FolderPlus, FolderMinus, FolderHeart, FolderCloud, FileText,
  Wallet, CreditCard, DollarSign, Receipt, Percent, Tag, Ticket, Safe, Bitcoin, Cashback,
  User, Users, UserPlus, UserMinus, UserCheck, UserX, UserCircle, UserShield,
  Shield, ShieldCheck, Lock, Unlock, Eye, EyeOff, Key, Fingerprint,
  Settings2, Sliders, ToggleLeft, ToggleRight, MoreHorizontal, MoreVertical, Filter, Gift,
  Bell, BellOff, BellPlus,
  MapPin, Navigation, Compass, Globe,
  Search, SearchPlus, SearchMinus,
  ShoppingBag, ShoppingCart, Package, Store,
  Clock, Calendar, Timer,
  Grid, LayoutGrid, List, Menu, X, Check, Home,
  Image, Camera, Video, Mic, Play, Pause,
  Truck, Car,
  Building, Bank,
  Info, AlertCircle, AlertTriangle, CheckCircle, XCircle,
  Plus, Minus, Edit, Trash, Copy, Share, Heart, Star,
  QrCode, Send, Download, Upload,
  VnkrIcon, IconMap, IconGallery,
}                                                            from "./components/Icon";
export type { IconProps, IconName, DynamicIconProps }         from "./components/Icon";

// ── Phase 2: Button ───────────────────────────────────────────────────────────
export { Button, ButtonShowcase }                            from "./components/Button";
export type { ButtonProps, ButtonVariant, ButtonColor, ButtonSize, ButtonState } from "./components/Button";

// ── Phase 2: Input ────────────────────────────────────────────────────────────
export { Input }                                             from "./components/Input";
export type { InputProps, InputState }                       from "./components/Input";

// ── Phase 2: PinPad ───────────────────────────────────────────────────────────
export { PinPad }                                            from "./components/PinPad";
export type { PinPadProps }                                  from "./components/PinPad";

// ── Phase 2: OtpInput ─────────────────────────────────────────────────────────
export { OtpInput }                                         from "./components/OtpInput";
export type { OtpInputProps }                               from "./components/OtpInput";

// ── Phase 3: WalletCard ───────────────────────────────────────────────────────
export { WalletCard }                                        from "./components/Card";
export type { WalletCardProps, CardBg, CardNetwork }          from "./components/Card";

// ── Phase 3: Toggle ───────────────────────────────────────────────────────────
export { Toggle }                                            from "./components/Toggle";
export type { ToggleProps, ToggleColor, ToggleSize }          from "./components/Toggle";

// ── Phase 3: Badge ────────────────────────────────────────────────────────────
export { Badge, CryptoBadge, CryptoBadgeRow }                from "./components/Badge";
export type {
  BadgeProps, BadgeVariant, BadgeColor,
  CryptoBadgeProps, CryptoBadgeData, CryptoBadgeRowProps, CryptoBadgeTrend,
}                                                            from "./components/Badge";

// ── Phase 3: ListItem ─────────────────────────────────────────────────────────
export { ListItem, TransactionList }                         from "./components/ListItem";
export type {
  ListItemProps, ListItemVariant,
  TransactionGroup, TransactionListProps,
}                                                            from "./components/ListItem";

// ── Phase 3: BottomNavbar ─────────────────────────────────────────────────────
export { BottomNavbar, defaultNavTabs }                      from "./components/BottomNavbar";
export type { BottomNavbarProps, NavTab, NavTabId }           from "./components/BottomNavbar";

// ── Phase 3: Modal / BottomSheet ──────────────────────────────────────────────
export { Modal }                                             from "./components/Modal";
export type { ModalProps, ModalVariant }                     from "./components/Modal";

// ── Phase 5: Thumbnail ────────────────────────────────────────────────────────
export { ThumbnailFrame, ThumbnailGuide }                    from "./components/Thumbnail";
export type { ThumbnailFrameProps, ThumbnailRatio, ThumbnailBg } from "./components/Thumbnail";

// ── Phase 4: TopNavbar ────────────────────────────────────────────────────────
export { TopNavbar }                                         from "./components/TopNavbar";
export type { TopNavbarProps, TopNavbarVariant, NavLink }     from "./components/TopNavbar";

// ── Phase 4: Sidebar ──────────────────────────────────────────────────────────
export { Sidebar }                                           from "./components/Sidebar";
export type { SidebarProps, SidebarMode, SidebarItem, SidebarSection } from "./components/Sidebar";

// ── Phase 4: DataTable ────────────────────────────────────────────────────────
export { DataTable }                                         from "./components/DataTable";
export type { DataTableProps, DataTableColumn, SortDirection } from "./components/DataTable";

// ── Phase 4: Chart ────────────────────────────────────────────────────────────
export { LineChart, BarChart, PieChart }                     from "./components/Chart";
export type {
  LineChartProps, BarChartProps, PieChartProps,
  ChartSeries, ChartLabel, PieChartSegment,
}                                                            from "./components/Chart";

// ── Phase 4: Toast ────────────────────────────────────────────────────────────
export { toast, ToastProvider }                              from "./components/Toast";
export type {
  ToastVariant, ToastPosition, ToastOptions,
  ToastItem, ToastProviderProps,
}                                                            from "./components/Toast";

// ── Phase 4: FormWizard ───────────────────────────────────────────────────────
export { FormWizard }                                        from "./components/FormWizard";
export type { FormWizardProps, WizardStep }                   from "./components/FormWizard";

// ── Phase 4: QRCodeModal ──────────────────────────────────────────────────────
export { QRCodeModal }                                       from "./components/QRCodeModal";
export type { QRCodeModalProps, QRModalTab }                  from "./components/QRCodeModal";

// ── Phase 4: AppShell ─────────────────────────────────────────────────────────
export { AppShell }                                          from "./components/AppShell";
export type { AppShellProps, AppShellLayout, PageHeaderProps } from "./components/AppShell";

// ── Phase 4: SidebarLayout ────────────────────────────────────────────────────
export { SidebarLayout }                                     from "./components/SidebarLayout";
export type { SidebarLayoutProps }                            from "./components/SidebarLayout";
