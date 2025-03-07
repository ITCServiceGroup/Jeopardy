// Runtime configuration for ITC Jeopardy
window.JEOPARDY_CONFIG = {
  // These values will be replaced during the build process
  // If they remain as placeholders, the app will fall back to default values
  supabaseUrl: "SUPABASE_URL_PLACEHOLDER",
  supabaseAnonKey: "SUPABASE_ANON_KEY_PLACEHOLDER",
  // Build info
  buildTime: new Date().toISOString(),
  environment: "production"
};

// Log that the config was loaded
console.log("Runtime config loaded from config.js");
