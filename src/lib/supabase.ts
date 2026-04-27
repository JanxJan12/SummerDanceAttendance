import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://hrssnvlytayyhmxsvtym.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc3Nudmx5dGF5eWhteHN2dHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDc4MTUsImV4cCI6MjA5MjU4MzgxNX0.iIxskh-phDwrfp6BKNTqtyQBDqbR5MP9WLbzPVf7Xws"
)