# Deploying the Area Scanning Edge Function

This guide explains how to deploy the server-side cron job for automated area scanning.

## Prerequisites

1. **Supabase Pro Plan** - pg_cron is only available on Pro plan or higher
2. **Supabase CLI** installed (`npm install -g supabase`)
3. Your Supabase project linked

## Step 1: Link Your Project

```bash
cd "/Users/vasvenss/Desktop/vessel by area app"
npx supabase link --project-ref ylpxxezhrlnqamgjybau
```

You'll be prompted for your database password.

## Step 2: Run the Migration

Apply the database migration to add the required columns:

```bash
npx supabase db push
```

Or run the SQL manually in the Supabase Dashboard SQL Editor:
- Go to: https://supabase.com/dashboard/project/ylpxxezhrlnqamgjybau/sql
- Copy and run the contents of `supabase/migrations/20240323_add_monitoring_columns.sql`

## Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy scan-areas
```

## Step 4: Set Up pg_cron (Pro Plan Required)

1. Go to the Supabase Dashboard SQL Editor
2. Enable the pg_net extension (for HTTP requests):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

3. Get your service role key from:
   - Project Settings > API > Service Role Key (secret)

4. Create the cron job (replace `YOUR_SERVICE_ROLE_KEY`):
   ```sql
   SELECT cron.schedule(
     'scan-monitored-areas',
     '*/5 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://ylpxxezhrlnqamgjybau.supabase.co/functions/v1/scan-areas',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
       ),
       body := jsonb_build_object('force_all', false)
     );
     $$
   );
   ```

## Managing the Cron Job

### View scheduled jobs:
```sql
SELECT * FROM cron.job;
```

### View job run history:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

### Pause the job:
```sql
SELECT cron.unschedule('scan-monitored-areas');
```

### Change interval:
```sql
-- First unschedule, then reschedule with new interval
SELECT cron.unschedule('scan-monitored-areas');

-- Run every 15 minutes instead:
SELECT cron.schedule(
  'scan-monitored-areas',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ylpxxezhrlnqamgjybau.supabase.co/functions/v1/scan-areas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('force_all', false)
  );
  $$
);
```

## How It Works

1. **pg_cron** triggers every 5 minutes
2. Calls the **scan-areas** Edge Function
3. The function queries `saved_areas` where `is_monitoring = true`
4. For each area, it checks `last_scanned_at` vs `monitor_interval_minutes`
5. If due for scanning, it:
   - Fetches the user's API key from `profiles`
   - Calls the DataDocked API
   - Inserts results into `area_sightings`
   - Updates `last_scanned_at`

## Testing the Edge Function

Test manually with curl:

```bash
curl -X POST 'https://ylpxxezhrlnqamgjybau.supabase.co/functions/v1/scan-areas' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"force_all": true}'
```

## Monitoring

- Check Edge Function logs in Supabase Dashboard > Edge Functions > scan-areas > Logs
- View sightings: `SELECT * FROM area_sightings ORDER BY spotted_at DESC LIMIT 50;`
- View scan history: Check `last_scanned_at` in `saved_areas`

## Cost Considerations

- Each area scan costs 10 DataDocked API credits
- With 5-minute cron interval, the function runs 288 times/day
- Only areas where `is_monitoring = true` AND interval has elapsed are scanned
- Users control their own scan frequency via `monitor_interval_minutes`
