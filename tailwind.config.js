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
 *   body  #57554F on paper   6.56:1  (AA)   muted #6E6B63 on paper 4.68:1 (AA)
 *   body  #C9C4B9 on dark    9.03:1  (AAA)  muted #B5B0A6 on dark  7.27:1 (AAA)
 *   clay  #8C4230 on paper   6.29:1  (AA)   clay  #DC9E8A on dark  6.95:1 (AA)
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
        // System monospace: JetBrains Mono was dropped from the render-blocking
        // font request (see index.html), so technical labels use the platform
        // face. Same role, one less family to download before first paint.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // Semantic Loam tokens (preferred in new code).
        //
        // Text tokens exist because the interface was drifting onto Tailwind's
        // default `stone` greys, which are cool and which fail AA on this warm
        // paper in both themes: stone-500 measures 4.22:1 on #F4F0E8 (needs
        // 4.5) and 3.27:1 on vinyl-900. Every value below was computed, not
        // eyeballed, and the pair is chosen so one class works in light mode
        // and its `-dark` partner in evening mode:
        //
        //   body      #57554F  paper 6.56  card 7.45
        //   muted     #6E6B63  paper 4.68  card 5.32
        //   body-dark #C9C4B9  vinyl-900 9.03  vinyl-800 7.81  vinyl-700 6.25
        //   muted-dark#B5B0A6  vinyl-900 7.27  vinyl-800 6.29  vinyl-700 5.04
        loam: {
          paper: '#F4F0E8',
          card: '#FFFFFF',
          ink: '#353432',
          sage: '#64745D',
          focus: '#6A7DAD',
          body: '#57554F',
          muted: '#6E6B63',
          'body-dark': '#C9C4B9',
          'muted-dark': '#B5B0A6',
          line: '#DED6C6',
          'line-dark': '#3E3D39',
        },

        // Warm alert clay. Replaces Tailwind's cool default `rose`, which sat
        // oddly on warm paper and had no Loam equivalent. Text roles:
        //   clay-600 #8C4230 on paper 6.29 (AA)   clay-300 #DC9E8A on
        //   vinyl-900 6.95 / vinyl-800 6.01 (AA)  white on clay-600 7.15
        clay: {
          50: '#FBF0EC',
          100: '#F6E1DA',
          200: '#EBC4B7',
          300: '#DC9E8A',
          400: '#C6755C',
          500: '#A8563D',
          600: '#8C4230',
          700: '#6E3325',
          800: '#55271D',
          900: '#3E1D16',
          950: '#2B1410',
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
          // Added so the settling-sounds dialog can use tokens instead of the
          // fourteen one-off hex values it was carrying.
          800: '#4A3720',
          900: '#38291A',
          950: '#2A1F14',
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
      fontSize: {
        // 0.8125rem sat between text-xs and text-sm and was written by hand
        // dozens of times. One token keeps it consistent and lets it scale with
        // the reading preference like every other rem step.
        meta: ['0.8125rem', { lineHeight: '1.45' }],
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
