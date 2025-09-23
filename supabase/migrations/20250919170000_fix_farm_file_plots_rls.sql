-- Fix RLS policies for farm_file_plots table
-- This will allow agents to access plots assigned to their producers

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'farm_file_plots';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view plots of assigned producers" ON farm_file_plots;
DROP POLICY IF EXISTS "Agents can insert plots for assigned producers" ON farm_file_plots;
DROP POLICY IF EXISTS "Agents can update plots of assigned producers" ON farm_file_plots;

-- Create new policies for farm_file_plots
CREATE POLICY "Agents can view plots of assigned producers" ON farm_file_plots
    FOR SELECT
    TO authenticated
    USING (
        producer_id IN (
            SELECT apa.producer_id 
            FROM agent_producer_assignments apa
            JOIN profiles p ON apa.agent_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can insert plots for assigned producers" ON farm_file_plots
    FOR INSERT
    TO authenticated
    WITH CHECK (
        producer_id IN (
            SELECT apa.producer_id 
            FROM agent_producer_assignments apa
            JOIN profiles p ON apa.agent_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update plots of assigned producers" ON farm_file_plots
    FOR UPDATE
    TO authenticated
    USING (
        producer_id IN (
            SELECT apa.producer_id 
            FROM agent_producer_assignments apa
            JOIN profiles p ON apa.agent_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE farm_file_plots ENABLE ROW LEVEL SECURITY;

-- Test the policy
DO $$
DECLARE
    test_user_id UUID := 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    test_agent_id UUID;
    plot_count INTEGER;
BEGIN
    -- Get the agent profile ID
    SELECT id INTO test_agent_id
    FROM profiles
    WHERE user_id = test_user_id AND role = 'agent';
    
    RAISE NOTICE 'Agent ID: %', test_agent_id;
    
    -- Count plots accessible to this agent
    SELECT COUNT(*) INTO plot_count
    FROM farm_file_plots ffp
    WHERE ffp.producer_id IN (
        SELECT apa.producer_id 
        FROM agent_producer_assignments apa
        WHERE apa.agent_id = test_agent_id
    );
    
    RAISE NOTICE 'Plots accessible to agent: %', plot_count;
END $$;
