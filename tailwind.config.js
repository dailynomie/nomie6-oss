module.exports = {
  purge: [
    './**/*.svelte', // Look for .svelte files
    './**/*.html', // Look for .html files
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    screens: {
      sm: '0px',
      md: '325px',
      lg: '500px',
      xl: '900px',
      '2xl': '1200px',
    },
    fontSize: {
      xs: '.75rem',
      sm: '.875rem',
      tiny: '.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
      '7xl': '5rem',
    },
    extend: {
      // iOS look: corner radii and text sizes (section 2.2 and 2.4 of the design guide)
      borderRadius: {
        tile: '18px',
        card: '16px',
        group: '12px',
        chip: '10px',
        float: '22px',
      },
      fontSize: {
        'ios-large': ['34px', { lineHeight: '41px', letterSpacing: '0.37px' }],
        'ios-title1': ['28px', { lineHeight: '34px' }],
        'ios-title3': ['20px', { lineHeight: '25px' }],
        'ios-body': ['17px', { lineHeight: '22px' }],
        'ios-subhead': ['15px', { lineHeight: '20px' }],
        'ios-footnote': ['13px', { lineHeight: '18px' }],
        'ios-caption': ['12px', { lineHeight: '16px' }],
        'ios-caption2': ['11px', { lineHeight: '13px' }],
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
      colors: {
        gray: {
          950: '#090C13',
        },
        // iOS look tokens: defined as CSS variables in src/style/main.css
        ios: {
          bg: 'var(--ios-bg)',
          card: 'var(--ios-card)',
          card2: 'var(--ios-card-2)',
          label: 'var(--ios-label)',
          label2: 'var(--ios-label-2)',
          fill: 'var(--ios-fill)',
          separator: 'var(--ios-separator)',
          tint: 'var(--ios-tint)',
          ontint: 'var(--ios-on-tint)',
          tintsoft: 'var(--ios-tint-soft)',
          good: 'var(--ios-good)',
          goodsoft: 'var(--ios-good-soft)',
          save: 'var(--ios-save)',
          onsave: 'var(--ios-on-save)',
          danger: 'var(--ios-danger)',
          ondanger: 'var(--ios-on-danger)',
          star: 'var(--ios-star)',
          white: 'var(--ios-white)',
          black: 'var(--ios-black)',
        },
        primary: {
          DEFAULT: '#00A4E4',
          50: '#eff9ff',
          100: '#def1ff',
          200: '#b6e5ff',
          300: '#75d3ff',
          400: '#2cbdff',
          500: '#00aaff',
          600: '#0083d4',
          700: '#0068ab',
          800: '#00588d',
          900: '#064974',
        },
      },
    },
  },
  variants: {
    backgroundColor: ['hover', 'responsive', 'focus', 'dark'],
    textColor: ['hover', 'responsive', 'focus', 'dark'],
  },
  plugins: [require('@tailwindcss/line-clamp'), require('@tailwindcss/typography')],
}
