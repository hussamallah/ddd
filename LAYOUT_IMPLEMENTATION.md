# Conditional Left Sidebar Layout Implementation

## Overview
This implementation adds a conditional left sidebar to the web application that displays the `screen-header.png` image on the left side of the screen, but only on non-landing pages. The landing page maintains its original full-width design without the sidebar.

## Features Implemented

### 1. Layout Structure
- **Conditional Layout**: Different layouts for landing page vs. other pages
- **Landing Page**: Full-width layout without sidebar (original design)
- **Other Pages**: Two-column layout with persistent left sidebar and main content
- **Layout Container**: Flexbox-based layout that divides the screen into sidebar and main content when sidebar is active

### 2. Sidebar Features (Non-Landing Pages Only)
- **Persistent Display**: Always visible, even when scrolling
- **Fixed Positioning**: Stays in place on the left side of the screen
- **Responsive Design**: Adapts to different screen sizes
- **Custom Scrollbar**: Styled scrollbar that matches the design theme

### 3. Visual Enhancements
- **Gold Border**: Subtle gold border on the right edge of the sidebar
- **Drop Shadow**: Elegant shadow effect for depth
- **Hover Effects**: Subtle glow effects on the header image
- **Smooth Animations**: Entrance animations for both sidebar and content

### 4. Responsive Breakpoints
- **Desktop**: 300px sidebar width
- **Tablet (≤768px)**: 250px sidebar width
- **Mobile (≤640px)**: 200px sidebar width
- **Small Mobile (≤480px)**: 180px sidebar width

## Files Modified

### 1. `apps/web-app/src/app/layout.tsx`
- Added conditional layout logic based on current route
- Landing page (`/`) uses full-width layout without sidebar
- Other pages use sidebar layout with screen-header.png
- Wrapped main content area conditionally

### 2. `apps/web-app/src/app/globals.css`
- Added layout container styles for sidebar pages
- Added landing page layout styles (full-width)
- Implemented sidebar positioning and styling
- Added responsive design rules
- Included custom scrollbar styling
- Added entrance animations

## CSS Classes Added

- `.layout-container`: Main layout wrapper for sidebar pages
- `.landing-layout`: Full-width layout for landing page
- `.left-sidebar`: Left sidebar container
- `.sidebar-header-image`: Header image styling
- `.main-content`: Main content area wrapper

## Usage

- **Landing Page (`/`)**: Displays in full-width layout without sidebar
- **Other Pages**: Display with persistent left sidebar containing screen-header.png
- **Automatic Detection**: The layout automatically detects the current route and applies the appropriate layout

## Route Behavior

- `/` (Landing Page): No sidebar, full-width design
- `/quiz`, `/results`, `/engine`, etc.: With sidebar, screen-header.png always visible
- All other routes: With sidebar layout

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Custom scrollbar styling works in WebKit-based browsers
- Fallback scrollbar styling for other browsers

## Performance Considerations

- Fixed positioning ensures smooth scrolling performance
- CSS animations use transform and opacity for optimal performance
- Minimal DOM manipulation required
- Responsive design uses CSS media queries for efficiency
- Conditional rendering prevents unnecessary sidebar DOM on landing page
