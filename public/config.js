// Runtime configuration for ITC Jeopardy
window.JEOPARDY_CONFIG = {
  // Default Supabase credentials - these are already public in your .env file
  supabaseUrl: "https://dwbuyhxjaqlydlhaulca.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnV5aHhqYXFseWRsaGF1bGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MzYxODQsImV4cCI6MjA1NjAxMjE4NH0.l64i74owmFelvdbn0Gqk0k6pYtQ9NqQIQGsWaDu1eCE",
  // Build info
  buildTime: new Date().toISOString(),
  environment: "production"
};

// Log that the config was loaded
console.log("Runtime config loaded from config.js");
