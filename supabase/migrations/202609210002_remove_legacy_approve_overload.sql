-- Remove the two-argument approval overload left behind by CREATE OR REPLACE.
-- PostgreSQL treats a changed parameter list as a different function, so the
-- legacy function must be dropped explicitly to avoid ambiguous RPC calls.

begin;

drop function if exists public.admin_approve_borrow_request(integer, date);

notify pgrst, 'reload schema';

commit;