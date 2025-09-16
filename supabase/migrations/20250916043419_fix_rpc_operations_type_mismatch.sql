CREATE OR REPLACE FUNCTION get_operations_for_plot(p_plot_id UUID)
RETURNS TABLE (
    id UUID,
    operation_date TIMESTAMPTZ,
    operation_type TEXT,
    product_used TEXT,
    description TEXT,
    author_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.operation_date::TIMESTAMPTZ,
        o.operation_type,
        o.product_used,
        o.description,
        CASE
            WHEN o.performer_type = 'profile' THEN p.display_name
            WHEN o.performer_type = 'participant' THEN pa.name
            ELSE 'Inconnu'
        END AS author_name
    FROM
        public.operations o
    LEFT JOIN
        public.profiles p ON o.performer_id = p.id AND o.performer_type = 'profile'
    LEFT JOIN
        public.participants pa ON o.performer_id = pa.id AND o.performer_type = 'participant'
    WHERE
        o.plot_id = p_plot_id
    ORDER BY
        o.operation_date DESC;
END;
$$ LANGUAGE plpgsql;
