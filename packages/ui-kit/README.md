# @vnkr/ui

> **VNKR Organisation — Exclusive Design System Library**
> Thư viện component React/TypeScript độc quyền, trích xuất từ VNKR Design System.

---

## Cài đặt

```bash
# Trong monorepo axvietnam
pnpm add @vnkr/ui
```

---

## Cấu trúc thư viện

```
@vnkr/ui
├── tokens/
│   ├── colors.ts          ← Brand + Semantic + Shade scales
│   ├── typography.ts      ← Work Sans — sizes, weights, line-heights
│   ├── spacing.ts         ← 4px grid — spacing, radius, shadow, z-index
│   └── cssVariables.ts    ← CSS Custom Properties (--vnkr-*)
└── components/
    ├── Typography/
    │   ├── Text.tsx           ← <Text variant="h1" weight="semibold">
    │   └── TypographyScale.tsx ← Reference / docs component
    ├── ColorPalette/
    │   └── ColorPalette.tsx    ← Reference / docs component
    └── Icon/
        ├── icons.tsx          ← 100+ SVG icon components
        ├── IconGallery.tsx    ← Searchable icon reference
        └── index.ts
```

---

## 1 — Tokens

### Colors

```tsx
import { colorBrand, colorShades, colors } from "@vnkr/ui";

// Brand palette
colorBrand.dark     // #000000
colorBrand.magenta  // #FD9FDD
colorBrand.orange   // #FC7339
colorBrand.greeny   // #BEFF6C
colorBrand.violet   // #AF96FB

// Semantic
colors.info         // #0095FF
colors.success      // #00D68F
colors.warning      // #FFAA00
colors.error        // #FF3D71

// Shade scales (index 0 = darkest, 7 = lightest)
colorShades.info[3]       // #0095FF  (base)
colorShades.greyscale[2]  // #2E3A59
```

### Typography

```tsx
import { fontSize, fontWeight, fontFamily } from "@vnkr/ui";

fontSize.h1        // "6rem"    (96px)
fontSize.body2     // "0.875rem"(14px)
fontWeight.semibold // 600
fontFamily.base    // "'Work Sans', ..."
```

### CSS Variables

```tsx
import { injectVnkrTokens } from "@vnkr/ui";

// Gọi một lần ở App root — inject tất cả --vnkr-* variables vào <head>
injectVnkrTokens();
```

```css
/* Sử dụng trong CSS */
.my-element {
  background: var(--vnkr-brand-violet);
  font-size:  var(--vnkr-fs-h5);
  color:      var(--vnkr-grey-700);
  padding:    var(--vnkr-space-4);
  border-radius: var(--vnkr-radius-lg);
}
```

---

## 2 — Typography Component

```tsx
import { Text } from "@vnkr/ui";

// Headings
<Text variant="h1">VNKR</Text>
<Text variant="h3" weight="medium" color="#2E3A59">Dashboard</Text>

// Body
<Text variant="body1">Đây là nội dung chính.</Text>
<Text variant="caption" color="#8F9BB3">Ghi chú nhỏ</Text>

// Overline (tự động uppercase)
<Text variant="overline">Section label</Text>

// Button label
<Text variant="btnLarge">Tiếp tục</Text>

// Truncate overflow
<Text variant="subtitle1" truncate>Nội dung rất dài sẽ bị cắt ngắn...</Text>

// Custom tag
<Text variant="h2" as="span">Inline heading</Text>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `h1…h6 \| subtitle1/2 \| body1/2 \| caption \| overline \| btnGiant/Large/Medium/Small` | `body1` |
| `weight` | `regular \| medium \| semibold` | variant default |
| `color` | `string` | `#2E3A59` |
| `align` | `left \| center \| right \| justify` | `left` |
| `truncate` | `boolean` | `false` |
| `as` | `ElementType` | variant default tag |

### TypographyScale — Reference

```tsx
import { TypographyScale } from "@vnkr/ui";

// Dùng trong Storybook hoặc docs page
<TypographyScale />
```

---

## 3 — Color Palette Component

```tsx
import { ColorPalette } from "@vnkr/ui";

// Reference component hiển thị toàn bộ bảng màu VNKR
<ColorPalette />
```

---

## 4 — Icon Set

Tất cả icon là SVG inline, **zero external dependency**, linear stroke style.

```tsx
import {
  ArrowRight, Wallet, Shield, Bell, User,
  Search, Home, Settings2, CreditCard, Send,
} from "@vnkr/ui";

// Basic usage
<ArrowRight />
<Wallet size={32} color="#0095FF" />
<Shield size={20} strokeWidth={2} />

// Dynamic icon by name
import { VnkrIcon } from "@vnkr/ui";
<VnkrIcon name="Wallet" size={24} color="#00D68F" />
```

### Props

| Prop | Type | Default |
|------|------|---------|
| `size` | `number` | `24` |
| `color` | `string` | `currentColor` |
| `strokeWidth` | `number` | `1.5` |
| + tất cả `SVGAttributes` | | |

### IconGallery — Reference

```tsx
import { IconGallery } from "@vnkr/ui";

// Searchable gallery — dùng trong Storybook
<IconGallery />
```

### Danh sách categories

| Category | Số icon |
|----------|---------|
| Arrow | 12 |
| Archive | 5 |
| Business | 7 |
| Call | 5 |
| Files | 6 |
| Money | 10 |
| Users | 8 |
| Security | 8 |
| Settings | 6 |
| Notifications | 3 |
| Location | 4 |
| Search | 3 |
| Shop | 4 |
| Time | 3 |
| Grid / Layout | 7 |
| Content | 6 |
| Delivery | 2 |
| Building | 2 |
| Essential | 19 |
| **Total** | **~120** |

---

## License

`UNLICENSED` — © VNKR Organisation. All rights reserved.
