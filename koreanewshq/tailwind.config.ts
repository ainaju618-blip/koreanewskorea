import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from spec
        primary: "#1E40AF",      // Royal Blue - Trust, Authority
        secondary: "#DC2626",    // News Red - Urgency, Breaking
        background: "#FFFFFF",
        foreground: "#1E293B",
        muted: "#F8FAFC",
      },
    },
  },
  plugins: [],
};

export default config;
