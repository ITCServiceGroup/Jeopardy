// Runtime configuration for ITC Jeopardy
// This file is for local development and will be replaced during the build process
window.JEOPARDY_CONFIG = {
  // These values will be replaced by environment variables in production
  // For local development, they will fall back to the .env values
  supabaseUrl: "",
  supabaseAnonKey: "",
  // Build info
  buildTime: new Date().toISOString(),
  environment: "development"
};

// Log that the config was loaded
console.log("Runtime config loaded from config.js (development)");
