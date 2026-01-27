
export default {
  content: ["./index.html", "./App.tsx", "./components/**/*.tsx", "./utils.ts", "./constants.ts"],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
        chinese: ['Noto Sans SC', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
