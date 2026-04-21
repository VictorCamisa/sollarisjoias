DROP VIEW IF EXISTS public.crediario_summary;

CREATE VIEW public.crediario_summary
WITH (security_invoker = on) AS
SELECT
  p.id AS customer_id,
  p.full_name,
  p.phone,
  p.credit_limit,
  p.credit_score,
  p.credit_blocked,
  COALESCE(SUM(CASE WHEN ft.status = 'pending' THEN ft.amount ELSE 0 END), 0) AS total_owed,
  COALESCE(SUM(CASE WHEN ft.status = 'pending' AND ft.due_date < CURRENT_DATE THEN ft.amount ELSE 0 END), 0) AS total_overdue,
  COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) AS open_installments,
  COUNT(CASE WHEN ft.status = 'pending' AND ft.due_date < CURRENT_DATE THEN 1 END) AS overdue_installments,
  MIN(CASE WHEN ft.status = 'pending' THEN ft.due_date END) AS next_due_date,
  MAX(ft.paid_date) AS last_payment_date
FROM profiles p
LEFT JOIN orders o ON o.customer_id = p.id
LEFT JOIN financial_transactions ft ON ft.order_id = o.id AND ft.sub_type = 'crediario'
GROUP BY p.id, p.full_name, p.phone, p.credit_limit, p.credit_score, p.credit_blocked
HAVING COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) > 0
   OR p.credit_limit > 0;