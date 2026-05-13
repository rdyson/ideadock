-- Enable Row-Level Security on all public tables exposed through Supabase APIs.
-- Application data is accessed server-side via Prisma after Supabase auth checks;
-- no anon/authenticated PostgREST policies are required.
ALTER TABLE public."Idea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResearchSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
