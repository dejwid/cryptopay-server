import type { Config } from "tailwindcss";
import tailwindcssRadixColors from "tailwindcss-radix-colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container:{
      padding: '2rem',
      center: true,
      screens: {
        DEFAULT: '1128px',
      }
    },
  },
  plugins: [
    // tailwindcssRadixColors,
  ],
};
export default config;
