/*
  # Add set_config helper function

  ## Overview
  Creates a helper function to set session variables for RLS policies.
  This allows the application to set the current user context.

  ## New Functions
  - `set_config(text, text)` - Helper function to set session variables
*/

-- Create helper function to set session config
CREATE OR REPLACE FUNCTION set_config(setting text, value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting, value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;