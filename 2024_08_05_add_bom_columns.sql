-- Migration: Add new columns to bom_items for Xarajatlar Varaqasi (Costing)
ALTER TABLE public.bom_items ADD COLUMN IF NOT EXISTS is_main boolean DEFAULT false;
ALTER TABLE public.bom_items ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.bom_items ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.bom_items ADD COLUMN IF NOT EXISTS price numeric(12,2) DEFAULT 0;
