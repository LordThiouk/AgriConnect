DROP FUNCTION IF EXISTS get_observations_for_plot(UUID);

CREATE OR REPLACE FUNCTION get_observations_for_plot(p_plot_id UUID)
RETURNS TABLE (
    id UUID,
    observation_date DATE,
    observation_type TEXT,
    description TEXT,
    severity INTEGER,
    author_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.observation_date,
        o.observation_type,
        o.description,
        CAST(o.severity AS INTEGER),
        p.display_name AS author_name
    FROM
        public.observations o
    LEFT JOIN
        public.profiles p ON o.observed_by = p.id
    WHERE
        o.plot_id = p_plot_id
    ORDER BY
        o.observation_date DESC;
END;
$$ LANGUAGE plpgsql;
