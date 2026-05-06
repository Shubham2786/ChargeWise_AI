export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#121417',
          card: '#1A1D21',
          elevated: '#22262B',
          subtle: '#2A2F36',
        },
        accent: {
          primary: '#5B7CFA',
          secondary: '#6DD3C7',
          tertiary: '#A3B18A',
        },
        data: {
          actual: '#5B7CFA',
          predicted: '#6DD3C7',
          optimized: '#A3B18A',
          baseline: '#8A94A6',
        },
        status: {
          success: '#7FB069',
          warning: '#E6B566',
          danger: '#D16D6A',
          info: '#7AA2F7',
        },
        text: {
          primary: '#E6E8EB',
          secondary: '#A0A6B1',
          muted: '#6B7280',
          inverse: '#121417',
        },
        border: {
          subtle: '#2F343A',
          strong: '#3A4048',
        },
      },
      fontFamily: {
        sans: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['clamp(1.5rem, 4vw, 2rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['clamp(1.25rem, 3vw, 1.5rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['clamp(1.125rem, 2.5vw, 1.25rem)', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['clamp(0.875rem, 2vw, 1rem)', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['clamp(0.75rem, 1.5vw, 0.875rem)', { lineHeight: '1.5', fontWeight: '400' }],
        'xs': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'card': '12px',
        'button': '10px',
        'pill': '24px',
      },
      boxShadow: {
        'glass': '0px 4px 20px rgba(0,0,0,0.3)',
        'neumorphic': '0px 2px 8px rgba(0,0,0,0.2), inset 0px 1px 2px rgba(255,255,255,0.05)',
        'card-hover': '0px 8px 24px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5B7CFA 0%, #7AA2F7 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6DD3C7 0%, #7FB069 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1D21 0%, #121417 100%)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
