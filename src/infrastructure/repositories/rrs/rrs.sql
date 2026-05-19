WITH current_period AS (
    SELECT
        (
            date_trunc('week', current_date::timestamp - interval '2 days')
            + interval '2 days'
        )::date AS current_save_week_start
),
input_characters AS (
    SELECT DISTINCT lower(trim(x)) AS character_name
    FROM unnest($1) AS x -- $1 is the array of character names passed as a parameter
),
the_characters AS (
    SELECT DISTINCT ON (ic.character_name)
        ic.character_name AS input_character_name,
        lower(m."character"->'realm'->>'slug') AS realm_slug,
        m.*
    FROM input_characters ic
    JOIN public.ev_member m
      ON lower(m."character"->>'name') = ic.character_name
     AND lower(m."character"->'realm'->>'slug') = lower($2) -- $2 is the realm slug passed as a parameter
    ORDER BY ic.character_name, m.created_at DESC
),
relevant_members AS (
    SELECT
        tc.input_character_name,
        tc.realm_slug,
        m.id
    FROM the_characters tc
    JOIN public.ev_member m
      ON m.user_id = tc.user_id
),
valid_resets AS (
    SELECT
        rs.id AS reset_id,
        rs.raid_id,
        rs.name AS raid_name,
        (
            date_trunc('week', rs.raid_date::timestamp - interval '2 days')
            + interval '2 days'
        )::date AS save_week_start
    FROM public.raid_resets rs
    JOIN public.ev_raid r
      ON r.id = rs.raid_id
    WHERE (
        SELECT COUNT(*)
        FROM public.ev_raid_participant rp
        WHERE rp.raid_id = rs.id
          AND (
              CASE
                  WHEN rp.details->>'status' IS NOT NULL
                      THEN (rp.details->>'status') IN ('confirmed', 'tentative', 'bench', 'late')
                  ELSE rp.is_confirmed
              END
          )
    ) >= r.size * 0.5
      AND COALESCE(rs.status, '') <> 'cancelled'
      AND (
            rs.end_date::timestamp
            + COALESCE(rs.time, time '00:00')
          ) < now() - interval '12 hours'
),
recent_weeks AS (
    SELECT x.save_week_start
    FROM (
        SELECT DISTINCT vr.save_week_start
        FROM valid_resets vr
        CROSS JOIN current_period cp
        WHERE vr.save_week_start < cp.current_save_week_start
          AND vr.save_week_start > '2026-01-01'::date
        ORDER BY vr.save_week_start DESC
        LIMIT 12
    ) x
),
recent_valid_resets AS (
    SELECT vr.*
    FROM valid_resets vr
    JOIN recent_weeks rw
      ON rw.save_week_start = vr.save_week_start
),
weekly_raid_status AS (
    SELECT
        tc.input_character_name,
        tc.realm_slug,
        rvr.save_week_start,
        rvr.raid_id,
        COALESCE(
            MAX(
                CASE
                    WHEN rm.id IS NOT NULL THEN
                        CASE
                            WHEN rp.details->>'status' IS NOT NULL THEN
                                CASE rp.details->>'status'
                                    WHEN 'confirmed' THEN 1.0
                                    WHEN 'bench' THEN 1.0
                                    WHEN 'late' THEN 0.8
                                    WHEN 'tentative' THEN 0.4
                                    WHEN 'declined' THEN 0.1
                                    WHEN 'absent' THEN -0.5
                                    ELSE 0.0
                                END
                            ELSE
                                CASE
                                    WHEN rp.is_confirmed THEN 1.0
                                    ELSE 0.0
                                END
                        END
                    ELSE NULL
                END
            ),
            0.0
        ) AS participation_score
    FROM the_characters tc
    CROSS JOIN recent_valid_resets rvr
    LEFT JOIN public.ev_raid_participant rp
      ON rp.raid_id = rvr.reset_id
    LEFT JOIN relevant_members rm
      ON rm.input_character_name = tc.input_character_name
     AND rm.realm_slug = tc.realm_slug
     AND rm.id = rp.member_id
    GROUP BY
        tc.input_character_name,
        tc.realm_slug,
        rvr.save_week_start,
        rvr.raid_id
),
weekly_scores AS (
    SELECT
        wrs.input_character_name,
        wrs.realm_slug,
        wrs.save_week_start,
        COUNT(*)::integer AS available_raid_types,
        ROUND(SUM(wrs.participation_score), 4) AS attended_raid_types_weighted,
        SUM(wrs.participation_score) / NULLIF(COUNT(*), 0) AS week_ratio
    FROM weekly_raid_status wrs
    GROUP BY
        wrs.input_character_name,
        wrs.realm_slug,
        wrs.save_week_start
),
ranked_weeks AS (
    SELECT
        x.*,
        (x.total_weeks - x.recency_rank + 1) AS recency_weight
    FROM (
        SELECT
            ws.*,
            row_number() OVER (
                PARTITION BY ws.input_character_name, ws.realm_slug
                ORDER BY ws.save_week_start DESC
            ) AS recency_rank,
            count(*) OVER (
                PARTITION BY ws.input_character_name, ws.realm_slug
            ) AS total_weeks
        FROM weekly_scores ws
    ) x
),
coverage_agg AS (
    SELECT
        input_character_name,
        realm_slug,
        COALESCE(
            ROUND(
                100.0 * SUM(participation_score) / NULLIF(COUNT(*), 0),
                2
            ),
            0
        ) AS coverage_score,
        COUNT(*)::integer AS opportunities_considered
    FROM weekly_raid_status
    GROUP BY input_character_name, realm_slug
),
weekly_agg AS (
    SELECT
        input_character_name,
        realm_slug,
        COALESCE(
            ROUND(
                100.0 * COUNT(*) FILTER (WHERE attended_raid_types_weighted > 0) / NULLIF(COUNT(*), 0),
                2
            ),
            0
        ) AS weekly_presence_score,
        COALESCE(
            ROUND(
                100.0 * SUM(week_ratio * recency_weight) / NULLIF(SUM(recency_weight), 0),
                2
            ),
            0
        ) AS weighted_weekly_score,
        COUNT(*)::integer AS weeks_considered
    FROM ranked_weeks
    GROUP BY input_character_name, realm_slug
)
SELECT
    ca.input_character_name AS character_name,
    ca.realm_slug,
    ca.coverage_score,
    wa.weekly_presence_score,
    wa.weighted_weekly_score,
    ROUND(
        ca.coverage_score * 0.35
        + wa.weighted_weekly_score * 0.65,
        2
    ) AS final_recent_reliability,
    wa.weeks_considered,
    ca.opportunities_considered
FROM coverage_agg ca
JOIN weekly_agg wa
  ON wa.input_character_name = ca.input_character_name
 AND wa.realm_slug = ca.realm_slug
ORDER BY final_recent_reliability DESC;