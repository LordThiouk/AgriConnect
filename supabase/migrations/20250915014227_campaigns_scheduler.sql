-- Schedule process_campaigns to run every minute using pg_cron if available
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('agriconnect_process_campaigns', '* * * * *', $cmd$
      select public.process_campaigns();
    $cmd$);
  end if;
end $$;


