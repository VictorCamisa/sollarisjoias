-- Add payment_method to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix';

-- Add bank_balance to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS bank_balance numeric DEFAULT 0;

-- Add assigned_to to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to uuid;