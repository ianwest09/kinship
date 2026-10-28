/** @type {import('tailwindcss').Config} */

/**
 * Loam Design System
 * ---------------------------------------------------------------------------
 * Calm, familiar, warm, trustworthy. The legacy palette names (parchment,
 * plum, brass, pine, vinyl) are deliberately KEPT and retuned to Loam values
 * so the five existing components inherit the new direction without being
 * rewritten. `loam` below is the semantic alias used by newer screens.
 *
 * Contrast ratios were computed against the warm paper (#F4F0E8) and the dark
 * base (#242321), not assumed:
 *   ink   #353432 on paper  10.95:1  (AAA)
 *   sage  #55634E on paper   5.63:1  (AA)
 *   sage  #64745D on white   5.00:1  (AA)
 *   white on sage #64745D    5.00:1  (AA - filled buttons)
 *   focus #6A7DAD on paper   3.59:1  (WCAG 2.2 non-text 3:1)
 *   paper on dark #242321   13.81:1  (AAA)
 *   sage  #A9B5A2 on dark    7.34:1  (AAA)
 *
 * The supplied sage #64745D is only 4.40:1 on warm paper, so it is used for
 * fills, borders and icons; the darker sage-600 #55634E carries text on paper.
 * The supplied focus blue #788CBA is 2.95:1 on paper - just under the 3:1
 * non-text minimum - so focus rings use the refined #6A7DAD and #788CBA is
 * kept as blue-400 for tints and badges.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', '"Newsreader"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Semantic Loam tokens (preferred in new code).
        loam: {
          paper: '#F4F0E8',
          card: '#FFFFFF',
          ink: '#353432',
          sage: '#64745D',
          focus: '#6A7DAD',
        },

        // Warm paper scale. 100 is the approved page background.
        parchment: {
          50: '#FDFCF9',
          100: '#F4F0E8',
          200: '#EBE5D9',
          300: '#DED6C6',
          400: '#C6BBA5',
          500: '#A89C85',
        },

        // Muted sage. Was plum; now the single calm primary accent.
        plum: {
          50: '#F2F4F0',
          100: '#E4E8E0',
          200: '#CBD3C6',
          300: '#A9B5A2',
          400: '#869579',
          500: '#64745D',
          600: '#55634E',
          700: '#444F3E',
          800: '#353D31',
          900: '#282E25',
        },

        // Soft warm clay. Was brass; secondary warmth for badges and highlights.
        brass: {
          50: '#FBF6EC',
          100: '#F5EADB',
          200: '#E8D5BC',
          300: '#D8BC97',
          400: '#C49F72',
          500: '#A9834F',
          600: '#8E6C3F',
          700: '#6F5431',
        },

        // Deepened green harmonised with sage, for live/success states.
        pine: {
          50: '#EFF4F0',
          100: '#DCE8E0',
          200: '#B9D2C4',
          300: '#8FB6A0',
          400: '#5F9478',
          500: '#3F7A5C',
          600: '#2F6249',
          700: '#244C39',
        },

        // Warm charcoal dark surfaces. Was a purple-black; now neutral-warm so
        // dark mode reads as "evening" rather than "dashboard".
        vinyl: {
          950: '#1C1B1A',
          900: '#242321',
          800: '#2F2E2B',
          700: '#3E3D39',
          600: '#4C4B46',
          500: '#63615B',
        },

        // Soft blue focus / informational accent.
        blue: {
          100: '#E7EBF5',
          200: '#C9D2E8',
          300: '#A3B1D5',
          400: '#788CBA',
          500: '#6A7DAD',
          600: '#55638C',
          700: '#434E6E',
        },
      },
      boxShadow: {
        // Restrained, warm-tinted elevation. No harsh black shadows.
        soft: '0 1px 2px rgba(53, 52, 50, 0.04), 0 2px 8px rgba(53, 52, 50, 0.05)',
        card: '0 1px 3px rgba(53, 52, 50, 0.05), 0 6px 20px rgba(53, 52, 50, 0.06)',
        lift: '0 2px 6px rgba(53, 52, 50, 0.07), 0 12px 32px rgba(53, 52, 50, 0.09)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      maxWidth: {
        readable: '46rem',
      },
    },
  },
  plugins: [],
};
