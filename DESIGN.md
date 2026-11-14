# BEAM Design System: Developer Context (DESIGN.md)

This document provides the core design tokens and rules for the [BEAM Design System - Styles](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC.aspx). It is optimized for AI code generation and automated UI consistency.

---

## 1. Color Palette & Roles

Derived from the [Color Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC%EF%BC%BF%E9%A1%8F%E8%89%B2.aspx).

The color system is divided into Primary actions, Semantic feedback, Structural neutrals, and Spare (extended) palettes.

### 1.1 Primary Colors
| Role | CSS Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Main** | `--color-primary-main` | `#3260C9` | Primary actions, key buttons, active states. |
| **Primary Hovered** | `--color-primary-hover` | `#437CFF` | Hover state for primary interactive elements. |
| **Primary Clicked** | `--color-primary-click` | `#1842A2` | Active/Pressed state for primary elements. |
| **Primary Disabled** | `--color-primary-disabled` | `#BBD6FB` | Disabled state for primary actions. |
| **Primary Selected BG** | `--color-primary-select-bg` | `#D3E4FF` | Background for selected items (e.g., list items, toggles). |
| **Primary Hovered BG** | `--color-primary-hover-bg` | `#EBF4FF` | Background for primary hover interactions. |

### 1.2 Semantic & Feedback Colors
| Role | CSS Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Success Main** | `--color-success-main` | `#3ABC5D` | Positive actions, success validations. |
| **Success Hovered** | `--color-success-hover` | `#4ECB70` | Hover state for positive actions. |
| **Success Clicked** | `--color-success-click` | `#1DA541` | Active/Pressed state for positive actions. |
| **Success Hovered BG** | `--color-success-hover-bg` | `#EBF8EE` | Background for hovering over success states. |
| **Success Selected BG** | `--color-success-select-bg` | `#D6F4DD` | Background for selected success states. |
| **Warning Main** | `--color-warning-main` | `#FFA110` | Cautions, warnings, alerts. |
| **Warning Hovered** | `--color-warning-hover` | `#FFAD2F` | Hover state for warning actions. |
| **Warning Clicked** | `--color-warning-click` | `#FA8D00` | Active/Pressed state for warning actions. |
| **Warning Hovered BG** | `--color-warning-hover-bg` | `#FFF5E9` | Background for hovering over warning states. |
| **Warning Selected BG**| `--color-warning-select-bg` | `#FFE6C9` | Background for selected warning states. |
| **Error Main** | `--color-error-main` | `#F23C47` | Destructive actions, validation errors. |
| **Error Hovered** | `--color-error-hover` | `#FD6B74` | Hover state for destructive actions. |
| **Error Clicked** | `--color-error-click` | `#D60C18` | Active/Pressed state for destructive actions. |
| **Error Hovered BG** | `--color-error-hover-bg` | `#FFEBEC` | Background for hovering over error states. |
| **Error Selected BG** | `--color-error-select-bg` | `#FDDFE0` | Background for selected error states. |

### 1.3 Neutral & Structural Colors
| Role | CSS Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Text Level 1** | `--color-text-level1` | `#333333` | Primary body text and main headings. |
| **Text Level 2** | `--color-text-level2` | `#727272` | Secondary text, descriptions, labels. |
| **Text White** | `--color-text-white` | `#FFFFFF` | Text on dark or primary backgrounds. |
| **Text Disabled** | `--color-text-disabled` | `#9B9B9B` | Disabled text and placeholder text. |
| **Background Base** | `--color-background` | `#F2F3F7` | Standard page/app background. |
| **Background L1** | `--color-background-level1` | `#FDFDFD` | Elevated surfaces, cards, and modules. |
| **Background Disabled** | `--color-background-disabled` | `#E7E7E7` | Disabled surfaces. |
| **Border** | `--color-border` | `#D8D8D8` | Standard borders, dividers, inputs. |
| **Backdrop** | `--color-backdrop` | `rgba(51, 51, 51, 0.7)` | Modal overlays and drawer backdrops. |

### 1.4 Spare (Extended) Colors
| Role | CSS Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Spare YLW Main** | `--color-spare-ylw-main` | `#F8C100` | Yellow accent - main. |
| **Spare YLW Hovered** | `--color-spare-ylw-hover` | `#FFDF2F` | Yellow accent - hover. |
| **Spare YLW Clicked** | `--color-spare-ylw-click` | `#EDC900` | Yellow accent - click. |
| **Spare YLW Selected BG** | `--color-spare-ylw-select-bg` | `#FFEF9A` | Yellow accent - selected background. |
| **Spare YLW Hovered BG**| `--color-spare-ylw-hover-bg` | `#FFFADE` | Yellow accent - hover background. |
| **Spare PL Main** | `--color-spare-pl-main` | `#8000FF` | Purple accent - main. |
| **Spare PL Hovered** | `--color-spare-pl-hover` | `#9844F8` | Purple accent - hover. |
| **Spare PL Clicked** | `--color-spare-pl-click` | `#7700EF` | Purple accent - click. |
| **Spare PL Selected BG** | `--color-spare-pl-select-bg` | `#DCC2FC` | Purple accent - selected background. |
| **Spare PL Hovered BG** | `--color-spare-pl-hover-bg` | `#F2E6FE` | Purple accent - hover background. |
| **Spare TUR Main** | `--color-spare-tur-main` | `#009D9D` | Turquoise accent - main. |
| **Spare TUR Hovered** | `--color-spare-tur-hover` | `#27CBCB` | Turquoise accent - hover. |
| **Spare TUR Clicked** | `--color-spare-tur-click` | `#17A2A2` | Turquoise accent - click. |
| **Spare TUR Selected BG** | `--color-spare-tur-select-bg` | `#BBF7F7` | Turquoise accent - selected background. |
| **Spare TUR Hovered BG**| `--color-spare-tur-hover-bg` | `#EFFFFF` | Turquoise accent - hover background. |
| **Spare SKY Main** | `--color-spare-sky-main` | `#0E93D7` | Sky blue accent - main. |
| **Spare SKY Hovered** | `--color-spare-sky-hover` | `#5BB9E8` | Sky blue accent - hover. |
| **Spare SKY Clicked** | `--color-spare-sky-click` | `#2F8BBA` | Sky blue accent - click. |
| **Spare SKY Selected BG** | `--color-spare-sky-select-bg` | `#95DCFF` | Sky blue accent - selected background. |
| **Spare SKY Hovered BG**| `--color-spare-sky-hover-bg` | `#F0FAFF` | Sky blue accent - hover background. |

---

## 2. Typography Rules

Derived from the [Typography Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC%EF%BC%BF%E6%96%87%E5%AD%97%20Typography.aspx).

### 2.1 Font Family Stack
The brand identity dictates strict font compliance rules for primary branding and system-level fallbacks across platforms.

* **Primary Corporate Fonts (Default):**
  * English/Numerals: `Arial`
  * Chinese: `Noto Sans` / `思源黑體` (Group Identification Specification)
* **OS-Specific Device Fallbacks:**
  * Apple Ecosystem (macOS/iOS): `PingFang` (PingFang TC / PingFang SC)
  * Windows Ecosystem: `Microsoft JhengHei` (微軟正黑體)

### 2.2 Global Font Scale & Mapping
The system defines a responsive type scale structured across four distinct sizing levels: Small (較小字級), Standard (標準字級), Large (較大字級), and Extra Large (超大字級). 

| Style / Level | Weight | Small (Size / LH) | Standard (Size / LH) | Large (Size / LH) | Extra Large (Size / LH) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **H1** | 700 | 30px / 46px | **32px / 48px** | 34px / 52px | 36px / 54px |
| **H2** | 700 | 22px / 34px | **24px / 36px** | 26px / 40px | 28px / 42px |
| **H3** | 700 | 18px / 28px | **20px / 30px** | 22px / 34px | 24px / 36px |
| **H4** | 700 | 16px / 24px | **18px / 28px** | 20px / 30px | 22px / 34px |
| **H5** | 700 | 14px / 22px | **16px / 24px** | 18px / 28px | 20px / 30px |
| **H6** | 700 | 12px / 18px | **14px / 22px** | 16px / 24px | 18px / 28px |
| **Body1** | 400 | 18px / 28px | **20px / 30px** | 22px / 34px | 24px / 36px |
| **Body2** | 400 | 16px / 24px | **18px / 28px** | 20px / 30px | 22px / 34px |
| **Body3** | 400 | 14px / 22px | **16px / 24px** | 18px / 28px | 20px / 30px |
| **Body4** | 400 | 12px / 18px | **14px / 22px** | 16px / 24px | 18px / 28px |
| **Body5** | 400 | 12px / 18px | **12px / 18px** | 14px / 22px | 16px / 24px |

*Note: **Standard (標準字級)** values are implemented by default across standard layout viewports.*

### 2.3 Tracking & Letter Spacing
To ensure optimal legibility across varying viewports, adjust relative letter-spacing according to type scales:
* **Large UI Type (≥ 20px):** `0` tracking value.
* **Standard Body & UI Labels (14px - 16px):** Standard text layout tracking.
* **Micro Typography (≤ 12px):** Apply positive letter-spacing context offsets (`0.035em` to `0.06em`) depending on English vs Traditional Chinese elements to prevent condensed block crowding.

---

## 3. Layout Rules (Grid, Layout, Space)

### 3.1 Grid System

Derived from the [Grid Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC_%E7%B6%B2%E6%A0%BC.aspx).

The design system utilizes a responsive framework to maintain structural consistency and logical alignment across platforms. The grid is constructed using three primary components:

*   **Columns (欄):** The content area is divided into proportional columns that adapt to scale with the screen width.
*   **Gutters (水槽):** Fixed transparent spaces between columns used to separate and organize content.
*   **Margins (邊距):** The fixed structural empty space between the outermost columns and the extreme edge of the screen or device container.

**Responsive Breakpoints & Column Configurations:**
*   **Desktop (lg):** For screens **≥ 1200px**, the system utilizes a **12-column** grid with **24px** gutters and **24px** margins.
*   **Tablet (md):** For screens between **768px and 1199px**, the system scales down to an **8-column** grid with **24px** gutters and **24px** margins.
*   **Mobile (sm):** For screens **< 768px**, the system relies on a compact **4-column** grid with **16px** gutters and **16px** margins.

### 3.2 Page Layouts

Derived from the [Layout Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E4%BD%88%E5%B1%80_Layout.aspx).

The overall page layouts are built upon distinct structural regions to ensure high uniformity and a predictable user experience.

#### Core Structural Regions
*   **Header (頂部導航):** The primary top navigation area.
*   **Sider (側邊導航):** The secondary left-aligned navigation or configuration area.
*   **Content (主要內容區):** The central area where the primary application data and interactive elements reside.

#### Standard Layout Typologies
*   **Top-Bottom (上下佈局):** A standard web content layout containing only a Header and a Content area.
*   **Left-Right (左右佈局):** A dashboard-style layout containing a Sider and a Content area, common in administrative interfaces.
*   **Mixed (混合佈局):** A comprehensive layout combining a Header, a Sider, and a Content area for highly complex applications.

#### Responsive Behaviors (RWD)
When transitioning to smaller viewports, the layouts adapt using these fundamental behaviors:
*   **Scale:** The main content areas scale their width linearly according to the device screen.
*   **Stack:** Elements that are positioned horizontally side-by-side on desktop will stack vertically on mobile screens.
*   **Hide / Collapse:** Secondary information may be hidden, and primary navigation menus will collapse into consolidated components, such as hamburger menus, to maximize screen real estate.

### 3.3 Base Spacing Scale

Derived from the [Space Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC%EF%BC%BF%E9%96%93%E8%B7%9D.aspx).

The spacing system operates on a **4px base multiple**, ranging from `0px` to `96px`. Space units dictate distance between elements, not the dimensions of the elements themselves.

| Token | Value (px) | Application & Targeted Components |
| :--- | :--- | :--- |
| `space-8` | **8px** | **Extra Small:** Container-to-element spacing for small items (e.g., Tags). |
| `space-12` | **12px** | **Medium:** Components with height 24–80px. Used in Buttons (default), Inputs, Selects, Trees, Uploads, Messages, Tooltips, Tables, Pagination, Menus, Tabs, Anchors. |
| `space-16` | **16px** | **Large:** Components with height > 80px or wide elements. Used in Dropdown menus, Notifications, Popovers, Alerts, Cards, Lists, Transfers. |
| `space-24` | **24px** | **Extra Large:** Container-to-element spacing for major structural surfaces. Used in Surfaces, Modals, Image Croppers, Drawers. |

---

## 4. Visual Features (Radius, Shadow)

### 4.1 Radius Tokens

Derived from the [Radius Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC%EF%BC%BF%E5%9C%93%E8%A7%92.aspx).

To maintain a consistent visual rhythm across the interface, all component border-radius values must strictly follow a **multiple-of-2 design rule**.

#### Radius Levels & Component Mapping
| Token | Radius Value | Definition & Sizing Context | Target Components |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | **2px** | **Extra Small:** Micro UI elements with a component height $\le$ 24px. | Checkbox, Tag |
| `--radius-sm` | **4px** | **Small/Medium:** Standard interactive controls with a component height between 24px and 80px. | Button, Input, Input number, Select, Tree, Upload, Message, Tooltips, Image Viewer, Image, Table, Pagination |
| `--radius-md` | **6px** | **Large:** Large-scale or wide components with a component height $>$ 80px. | Dropdown menu, Time picker, Date picker, Tree select, Alert, Notification, Popover, Pop confirm, Card, List, Transfer |
| `--radius-lg` | **8px** | **Extra Large:** Structural base elements or components utilizing overlays/masks (Default for desktop viewports). | Surface, Modal, Image cropper |
| `--radius-xl` | **16px** | **Maximum:** Mobile structural containers or components utilizing masks when the viewport is $<576\text{px}$. | Mobile Surface, Mobile Modal |

#### Visual Rules & Implementation Details
* **Fixed Radius on Scale:** The border-radius size is defined as an absolute design token. It must **not** scale proportionally when a component's width or height expands or stretches; it must remain fixed to its designated token value.
* **Boundary Flattening (Straight Edges):** When an element is pinned or positioned flush against the viewport or container boundaries (e.g., sticky sidebars, full-bleed bottom sheets), the corners touching the boundary must lose their radius and flatten to **0px**.
* **Single Component Uniformity:** All corners of a standalone component (except when applying boundary flattening) must utilize the exact same radius token. Mixing different radius sizes on a single element is strictly prohibited.

#### Responsive Adaptive Rules (RWD)
* **Invariant Small & Medium Controls:** Small and medium-sized interactive components (such as buttons, inputs, and tags) **maintain fixed radius tokens** regardless of breakpoint changes to preserve baseline visual consistency.
* **Mobile Container Scaling:** * When the screen size drops below **$<576\text{px}$**, large container and layout components (such as Modals and Surfaces) automatically scale their corner radius up from **8px to 16px** to accommodate standard mobile viewing density.
  * If an inner Card component is paired inside a Surface layout, the card's outer radius must adapt dynamically to **match the outer Surface's radius** to ensure nested container harmony.

### 4.2 Shadow Tokens

Derived from the [Shadow Specification](https://foxconn.sharepoint.com/sites/centralitdesignsystem/SitePages/%E9%A2%A8%E6%A0%BC%EF%BC%BF%E9%99%B0%E5%BD%B1.aspx).

Shadows in the design system establish a three-dimensional sense of depth and hierarchy, highlighting elements so they appear to float above the background. This consistent mapping of elevation makes the interface feel natural; the further an object is from the base layer (higher Z-index), the larger the shadow area and blur.

#### Light Source & Direction
*   **Default Light Source:** The system's default light source shines directly from the top down, producing downward-facing shadows.
*   **Upward Light Source:** When components pop out from the bottom of the screen or are restricted by spatial limits, the light source shifts to produce an upward-facing shadow (Level 2-up).

#### Shadow Token Parameters
The system classifies UI elevation into distinct levels, dictating specific X, Y, Blur, and Color variables.

| Token Name | X / Y / Blur | Color (Hex & Opacity) | Elevation Context |
| :--- | :--- | :--- | :--- |
| **Shadow Line** | 0 / 0 / 1 | `#8C9EC9` (100%) | Base layer |
| **Level 1** | 0 / 2 / 8 | `#8C9EC9` (25%) | Low elevation |
| **Level 2** | 0 / 2 / 10 | `#9DACD0` (40%) | Medium elevation |
| **Level 2-up** | 0 / -4 / 10 | `#9DACD0` (40%) | Medium elevation (Inverted) |
| **Level 3** | 0 / 6 / 15 | `#9DACD0` (45%) | High elevation |

#### Usage Guidelines & Component Mapping
*   **Shadow Line:** Used when an element sticks to the background surface with no real height difference, acting primarily as a visual separator. 
    *   *Common UI:* Cards, App bars.
*   **Level 1:** Applied to slightly raised elements, providing subtle interactive feedback to the user. 
    *   *Common UI:* Card hover states, Tooltips.
*   **Level 2:** Used for elements clearly suspended above the main interface, creating a distinct overlay panel. 
    *   *Common UI:* Dropdowns, Popovers, Popconfirms.
*   **Level 2-up:** Retains the Level 2 Z-axis height but is specifically designed for elements anchored to the bottom of the screen that expand upwards. 
    *   *Common UI:* Bottom toolbars, Bottom sheets.
*   **Level 3:** Represents the highest UI elevation, deployed for prominent elements that block the background and demand immediate user focus. 
    *   *Common UI:* Notifications, Messages, Drawers, Modals, FloatButtons.

#### Implementation Rules
*   **Dark Mode & High Contrast Handling:** Shadows are strictly omitted in Dark Mode and High Contrast modes. Instead of shadows, use structural borders (lines) or lighter surface colors to define element hierarchy and separation on dark backgrounds.
*   **Avoid Clipping:** Ensure shadow areas are not cut off by parent container boundaries; the full shadow blur must be allowed to render cleanly.
*   **Interactive Enhancement:** Shadows should be actively utilized on hover states to provide clear depth feedback and indicate interactive element behavior.

---

## 5. Brand Logo Specifications

### 5.1 Core Principles & Composition
* **Core Objective:** Across all brand manifestations, the core objective is to deliver focus, clarity, and visual impact through direct and highly recognizable brand marks. 
* **Component Architecture:** The system logo framework features a modular configuration designed for cross-platform flexibility. It is composed of three distinct elements:
  1. **Hon Hai Logo:** The core corporate mark, applied strictly according to regional compliance guidelines.
  2. **Separator Line (`|`):** A visual dividing element utilized whenever the core brand logo is paired alongside specific system titles or nouns. The Separator line width is 2px.
  3. **System Logo / Title:** A flexible, customizable zone used to display the dedicated application name or its custom system mark.

### 5.2 Regional Compliance Regulations
To comply with local legal standards and market conditions, the textual lockup of the core corporate logo dynamically changes based on the geographic region of deployment:

| Target Region | Logo Mark Composition | Visual Rule |
| :--- | :--- | :--- |
| **Global / International** <br>(Outside TW & Mainland China) | Red square "H" icon + `FOXCONN® HON HAI TECHNOLOGY GROUP` | Standard international lockup. |
| **Taiwan Region (TW)** | Red square "H" icon + `FOXCONN® 鴻海科技集團` | Traditional Chinese regional lockup. |
| **Mainland China Region** | Standalone blue text `FOXCONN® 富士康科技集團` | **Strict Exception:** This regional lockup uses typography only and must completely omit the red square "H" icon. |

---

### 5.3 Logo Styles & Naming Conventions
To maintain a clean asset library, all exported logo graphics must follow a standardized, lowercase snake_case nomenclature:  
`logo_[style]_[mode]_[size].svg`

#### 1. Style Tokens (4 Styles)
* `en` (English): The full English corporate typography lockup.
* `tc` (Traditional Chinese): The Traditional Chinese corporate typography lockup.
* `sc` (Simplified Chinese): The Simplified Chinese corporate typography lockup.
* `icon` (Icon Only): The abbreviated red square "H" graphic mark used for dense layouts.

#### 2. Theme Mode Tokens (2 Modes)
* `light`: Chromatic configuration optimized for white or light-colored user interface backgrounds.
* `dark`: Chromatic configuration reversed and optimized for dark or black user interface backgrounds.

#### 3. Dimension Tokens (3 Standard Sizes)
To protect structural legibility and prevent rendering distortion, logos should be maintained as vector SVGs and adhere to these fixed vertical heights:
* `h48` (48px Height): Large desktop format reserved for primary marketing headers, splash landing frames, and open navigation banners.
* `h32` (32px Height): Medium system format reserved for secondary toolbars and dense data management layouts.
* `h24` (24px Height): **Default UI System Height:** The baseline vertical parameter used across standard application headers to maintain consistent visual proportions.

> **Special Dimensional Exception:** Login interface instances utilize a custom layout token requiring a fixed height of **H40** and a maximum horizontal bounding box limit of **220px**.

#### Official Asset Directory (SVG Links)
Use the following GitLab repository links to cite, embed, or download the approved SVGs.

| Style / Region | Theme Mode | H24 (24px) | H32 (32px) | H48 (48px) |
| :--- | :--- | :--- | :--- | :--- |
| **Traditional Chinese (TC)**<br>Taiwan Region | Light | [logo_tc_light_h24.svg](https://gitlab.com/-/project/74441433/uploads/c582fc1f36f8ea2b889e96bdca45a697/logo_tc_light_h24.svg) | [logo_tc_light_h32.svg](https://gitlab.com/-/project/74441433/uploads/aeaa0df84c89897f474db014c8fbb8dd/logo_tc_light_h32.svg) | [logo_tc_light_h48.svg](https://gitlab.com/-/project/74441433/uploads/513fb8efa33a2317c948675c2759fd90/logo_tc_light_h48.svg) |
| **Traditional Chinese (TC)**<br>Taiwan Region | Dark | [logo_tc_dark_h24.svg](https://gitlab.com/-/project/74441433/uploads/380d669a5f7942ee407d6f591a1b5d88/logo_tc_dark_h24.svg) | [logo_tc_dark_h32.svg](https://gitlab.com/-/project/74441433/uploads/cbdb8b2501ef598873ae19e937e5e57c/logo_tc_dark_h32.svg) | [logo_tc_dark_h48.svg](https://gitlab.com/-/project/74441433/uploads/7113bf2707e7e157d50e0b81620c5e38/logo_tc_dark_h48.svg) |
| **Simplified Chinese (SC)**<br>Mainland China | Light | [logo_sc_light_h24.svg](https://gitlab.com/-/project/74441433/uploads/22da84af25f2fd77285a6f844f908427/logo_sc_light_h24.svg) | [logo_sc_light_h32.svg](https://gitlab.com/-/project/74441433/uploads/ad597488302468b19c91adf8996e3b89/logo_sc_light_h32.svg) | [logo_sc_light_h48.svg](https://gitlab.com/-/project/74441433/uploads/2f03471ab28ad787350f4591c00e91a6/logo_sc_light_h48.svg) |
| **Simplified Chinese (SC)**<br>Mainland China | Dark | [logo_sc_dark_h24.svg](https://gitlab.com/-/project/74441433/uploads/a36f9fbcbd1b0e9273ffb516db312601/logo_sc_dark_h24.svg) | [logo_sc_dark_h32.svg](https://gitlab.com/-/project/74441433/uploads/0d6788f10f59282cfd71ac0819acdaff/logo_sc_dark_h32.svg) | [logo_sc_dark_h48.svg](https://gitlab.com/-/project/74441433/uploads/45b05735df064ea5415725843750b531/logo_sc_dark_h48.svg) |
| **English (EN)**<br>Global / International | Light | [logo_en_light_h24.svg](https://gitlab.com/-/project/74441433/uploads/265a96877e2fea6eab10896b7893e57a/logo_en_light_h24.svg) | [logo_en_light_h32.svg](https://gitlab.com/-/project/74441433/uploads/0ff998e30e577dd23ea0ba0e6250bf29/logo_en_light_h32.svg) | [logo_en_light_h48.svg](https://gitlab.com/-/project/74441433/uploads/e1e5de0797770571ebc1abedf0abaee6/logo_en_light_h48.svg) |
| **English (EN)**<br>Global / International | Dark | [logo_en_dark_h24.svg](https://gitlab.com/-/project/74441433/uploads/1b8179948795ab0480c55cd930a827de/logo_en_dark_h24.svg) | [logo_en_dark_h32.svg](https://gitlab.com/-/project/74441433/uploads/3314251248bac84961347659495fd970/logo_en_dark_h32.svg) | [logo_en_dark_h48.svg](https://gitlab.com/-/project/74441433/uploads/e93838f690eddf6d546bd841519e217a/logo_en_dark_h48.svg) |
| **Graphic Icon Only (ICON)**<br>Responsive / Compact | Light | [logo_icon_light_h24.svg](https://gitlab.com/-/project/74441433/uploads/8d7fb8e1fd75e2950479d284f1c42fd1/logo_icon_light_h24.svg) | [logo_icon_light_h32.svg](https://gitlab.com/-/project/74441433/uploads/57f2b57fed99b961ae1bf7b9957a4cd0/logo_icon_light_h32.svg) | [logo_icon_light_h48.svg](https://gitlab.com/-/project/74441433/uploads/b7804561c27f5c04bdd637470cbb30f2/logo_icon_light_h48.svg) |
| **Graphic Icon Only (ICON)**<br>Responsive / Compact | Dark | [logo_icon_dark_h24.svg](https://gitlab.com/-/project/74441433/uploads/ff93c02a034096cbeb92d35d4f59d839/logo_icon_dark_h24.svg) | [logo_icon_dark_h32.svg](https://gitlab.com/-/project/74441433/uploads/a9bb1a881bbe51d2a232d95ba2c54afe/logo_icon_dark_h32.svg) | [logo_icon_dark_h48.svg](https://gitlab.com/-/project/74441433/uploads/9bde2c6cd89be864e37d35c64c7ccdad/logo_icon_dark_h48.svg) |

---

### 5.4 Environmental Adaptations & Usage Scenarios
* **Image Backgrounds:** When superimposed over photographs, the logo asset must be positioned exclusively over simple, low-contrast, or uncluttered areas of the image to maximize brand recognition.
* **Dark Background Configurations:** On dark theme backdrops, the core "H" mark must undergo a specific inverted treatment. The inner small "h" cutout must be rendered in a non-hollow, solid white filled state rather than letting the dark background bleed through.
* **Solid Brand Fills:** When positioned over the standard Hon Hai corporate red background or other solid brand fills, a completely monochromatic solid white silhouette variant must be applied.

#### Strict Prohibitions (Incorrect Applications)
To preserve global brand integrity, the following asset modifications are strictly prohibited:
* **Aspect Ratio Violation:** Scaling or stretching the logo disproportionately without maintaining its original aspect ratio.
* **Improper Dark Inversion:** Leaving the inner small "h" transparent or failing to apply the non-hollow white inversion on dark backgrounds.
* **Form Distortion:** Shearing, slanting, or bending any component of the typography or vector icon.
* **Color Alteration:** Applying non-system hex values or unapproved color changes to the paths.
* **Effects Abuse:** Adding drop shadows, glows, outer borders, or three-dimensional gradient filters.
* **Component Dismantling:** Detaching, splitting, or rearranging the verified positioning of the icon and text lockups.

---

### 5.5 Layout Placement & Implementation Rules
* **Top Navigation Bar:** The logo lockup is anchored by default to the extreme top-left corner of the interface with a fixed **24px left margin**. The logo bounding box must remain completely unaffected when the side navigation menu expands or collapses.
* **Login Interface Layout:** The logo must be positioned intentionally within the login block, strictly constrained to a maximum width of 220px and a height of H40.
* **Browser Favicon (Ico Assets):**
  * Web platforms, digital documents, and applications must uniformly display the standalone "H" graphic icon as their browser tab identifier.
  * The icon file must possess a completely transparent background channel. Encasing the logo inside an unrefined white square container on dark browser tabs is strictly prohibited.
* **SEO & Tab Text Metadata:** To prevent indexing errors within major search engine crawlers, it is strongly recommended to omit specialized symbol characters such as "丨" or "-" from literal webpage title strings.
* **Footer Area:** Interface footers may optionally incorporate the micro/abbreviated version of the logo mark to close out the layout page rhythm.

---

### 5.6 Responsive Web Design (RWD) Rules
The logo layout alters its structural complexity adaptively based on standard screen breakpoint thresholds to ensure optimal legibility:

* **Desktop Viewports (> 1200px):** The brand logo displays in its complete format, showcasing the full combination of the regional corporate mark, the separator, and the system title.
* **Tablet Viewports (768px to 1200px):** The asset transitions into a simplified layout consisting of the core graphic icon + text. If the individual page layout permits ample white space, the full logo configuration may still be optionally retained.
* **Mobile Viewports (< 768px):** The layout scales down to display the standalone graphic icon (Icon Only) to save horizontal screen real estate. If horizontal space safely permits, a highly simplified icon + text pairing may be implemented.