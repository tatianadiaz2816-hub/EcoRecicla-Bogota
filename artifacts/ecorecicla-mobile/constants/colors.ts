/**
 * Design tokens synced from the EcoRecicla web app (artifacts/ecorecicla/src/index.css).
 * HSL values converted to hex.
 */

const colors = {
  light: {
    // Aliases
    text: '#111D2E',
    tint: '#2B7A55',

    // Core surfaces
    background: '#F3F4F8',
    foreground: '#111D2E',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#111D2E',

    // Primary – green brand (hsl 152, 55%, 33%)
    primary: '#2B7A55',
    primaryForeground: '#FFFFFF',

    // Secondary
    secondary: '#DDE2F0',
    secondaryForeground: '#111D2E',

    // Muted / subdued elements
    muted: '#EDF0F8',
    mutedForeground: '#6C7D96',

    // Accent – light green (hsl 152, 20%, 93%)
    accent: '#E6F2EC',
    accentForeground: '#1C5C3C',

    // Destructive
    destructive: '#E84040',
    destructiveForeground: '#FFFFFF',

    // Borders and inputs
    border: '#D0D7E8',
    input: '#D0D7E8',
  },

  dark: {
    text: '#E5E9EF',
    tint: '#33AA6A',

    background: '#0E1728',
    foreground: '#E5E9EF',

    card: '#132233',
    cardForeground: '#E5E9EF',

    primary: '#33AA6A',
    primaryForeground: '#FFFFFF',

    secondary: '#1E2E46',
    secondaryForeground: '#E5E9EF',

    muted: '#192640',
    mutedForeground: '#7A8DA4',

    accent: '#182A1E',
    accentForeground: '#5CC994',

    destructive: '#7A1F1F',
    destructiveForeground: '#EDF6FA',

    border: '#1E2E46',
    input: '#1E2E46',
  },

  // Matches web app --radius: 0.625rem → 10px
  radius: 10,
};

export default colors;
