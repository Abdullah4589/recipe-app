export const themes = {
  forest: {
    key: 'forest',
    name: 'Forest',
    swatch: '#2D6A4F',
    primary: '#2D6A4F',
    primaryLight: '#EAF3DE',
    primaryDark: '#1E4D38',
  },
  ocean: {
    key: 'ocean',
    name: 'Ocean',
    swatch: '#1565C0',
    primary: '#1565C0',
    primaryLight: '#E3F2FD',
    primaryDark: '#0D47A1',
  },
  sunset: {
    key: 'sunset',
    name: 'Sunset',
    swatch: '#D84315',
    primary: '#D84315',
    primaryLight: '#FBE9E7',
    primaryDark: '#BF360C',
  },
  lavender: {
    key: 'lavender',
    name: 'Lavender',
    swatch: '#6A1B9A',
    primary: '#6A1B9A',
    primaryLight: '#F3E5F5',
    primaryDark: '#4A148C',
  },
  slate: {
    key: 'slate',
    name: 'Slate',
    swatch: '#37474F',
    primary: '#37474F',
    primaryLight: '#ECEFF1',
    primaryDark: '#263238',
  },
};

export const defaultTheme = themes.forest;

// Non-theme colours (fixed across all themes)
export const Colors = {
  amber: '#FAEEDA',
  amberText: '#633806',
  green: '#EAF3DE',
  greenText: '#27500A',
  blue: '#E6F1FB',
  blueText: '#0C447C',
  coral: '#FAECE7',
  coralText: '#993C1D',
  purple: '#EEEDFE',
  purpleText: '#3C3489',
  background: '#F8F8F6',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  border: '#E8E8E4',
};

export const CuisineBadge = {
  Pakistani:       { bg: Colors.green,  text: Colors.greenText  },
  Indian:          { bg: Colors.purple, text: Colors.purpleText },
  Arabic:          { bg: Colors.amber,  text: Colors.amberText  },
  Mediterranean:   { bg: Colors.blue,   text: Colors.blueText   },
  Italian:         { bg: Colors.blue,   text: Colors.blueText   },
  French:          { bg: Colors.blue,   text: Colors.blueText   },
  Greek:           { bg: Colors.blue,   text: Colors.blueText   },
  Mexican:         { bg: Colors.coral,  text: Colors.coralText  },
  American:        { bg: Colors.coral,  text: Colors.coralText  },
  'Middle Eastern':{ bg: Colors.purple, text: Colors.purpleText },
  Chinese:         { bg: Colors.amber,  text: Colors.amberText  },
  Japanese:        { bg: Colors.amber,  text: Colors.amberText  },
  Thai:            { bg: Colors.amber,  text: Colors.amberText  },
};

export const Typography = {
  heading1: { fontSize: 28, fontWeight: '700' },
  heading2: { fontSize: 20, fontWeight: '600' },
  heading3: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const cardShadow = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};
