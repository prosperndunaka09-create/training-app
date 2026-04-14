-- Customer Service Schema for EARNINGSLLC
-- This schema handles customer support tickets and conversations

-- Create customer service tickets table
CREATE TABLE IF NOT EXISTS customer_service_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    initial_message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_to UUID REFERENCES users(id), -- Admin user assigned to ticket
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer service messages table
CREATE TABLE IF NOT EXISTS customer_service_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES customer_service_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'admin_note')),
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_user_id ON customer_service_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_status ON customer_service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_created_at ON customer_service_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_service_messages_ticket_id ON customer_service_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_messages_created_at ON customer_service_messages(created_at ASC);

-- Enable RLS
ALTER TABLE customer_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_service_tickets
CREATE POLICY "Users can view their own tickets" ON customer_service_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON customer_service_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Users can create their own tickets" ON customer_service_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all tickets" ON customer_service_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

-- RLS Policies for customer_service_messages
CREATE POLICY "Users can view messages from their tickets" ON customer_service_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_service_tickets 
            WHERE customer_service_tickets.id = ticket_id 
            AND customer_service_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON customer_service_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

CREATE POLICY "Users can insert messages to their tickets" ON customer_service_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customer_service_tickets 
            WHERE customer_service_tickets.id = ticket_id 
            AND customer_service_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert messages to any ticket" ON customer_service_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.email = 'admin@optimize.com'
        )
    );

-- Function to generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    ticket_num TEXT;
    prefix TEXT := 'CS';
    year_part TEXT := EXTRACT(year FROM NOW())::TEXT;
    sequence_num TEXT;
BEGIN
    -- Get next sequence number for this year
    SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') 
    INTO sequence_num 
    FROM customer_service_tickets 
    WHERE EXTRACT(year FROM created_at) = EXTRACT(year FROM NOW());
    
    ticket_num := prefix || year_part || sequence_num;
    
    -- Ensure uniqueness (very rare case)
    WHILE EXISTS (SELECT 1 FROM customer_service_tickets WHERE ticket_number = ticket_num) LOOP
        SELECT LPAD((SUBSTRING(sequence_num FROM 2) + 1)::TEXT, 4, '0')
        INTO sequence_num;
        ticket_num := prefix || year_part || sequence_num;
    END LOOP;
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to create new customer service ticket
CREATE OR REPLACE FUNCTION create_customer_service_ticket(
    p_full_name VARCHAR(255),
    p_phone_number VARCHAR(50),
    p_initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
    new_ticket_id UUID;
    ticket_num TEXT;
BEGIN
    -- Generate ticket number
    ticket_num := generate_ticket_number();
    
    -- Create the ticket
    INSERT INTO customer_service_tickets (
        user_id,
        ticket_number,
        full_name,
        phone_number,
        initial_message
    ) VALUES (
        auth.uid(),
        ticket_num,
        p_full_name,
        p_phone_number,
        p_initial_message
    ) RETURNING id INTO new_ticket_id;
    
    -- Add the initial message
    INSERT INTO customer_service_messages (
        ticket_id,
        sender_id,
        message,
        message_type,
        is_system_message
    ) VALUES (
        new_ticket_id,
        auth.uid(),
        p_initial_message,
        'text',
        FALSE
    );
    
    -- Add system message
    INSERT INTO customer_service_messages (
        ticket_id,
        sender_id,
        message,
        message_type,
        is_system_message
    ) VALUES (
        new_ticket_id,
        auth.uid(),
        'HOLD ON WHILE THE SYSTEM INITIALIZE YOUR DETAILS.',
        'system',
        TRUE
    );
    
    RETURN new_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send message to ticket
CREATE OR REPLACE FUNCTION send_customer_service_message(
    p_ticket_id UUID,
    p_message TEXT,
    p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    ticket_user_id UUID;
    is_admin_user BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email = 'admin@optimize.com'
    ) INTO is_admin_user;
    
    -- Get ticket user_id for permission check
    SELECT user_id INTO ticket_user_id 
    FROM customer_service_tickets 
    WHERE id = p_ticket_id;
    
    -- Permission check
    IF NOT is_admin_user AND ticket_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Insert message
    INSERT INTO customer_service_messages (
        ticket_id,
        sender_id,
        message,
        message_type,
        is_system_message
    ) VALUES (
        p_ticket_id,
        auth.uid(),
        p_message,
        CASE WHEN p_is_admin THEN 'admin_note' ELSE 'text' END,
        FALSE
    );
    
    -- Update ticket's last_message_at
    UPDATE customer_service_tickets 
    SET last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for customer conversations
CREATE OR REPLACE VIEW customer_conversations AS
SELECT 
    cst.id as ticket_id,
    cst.ticket_number,
    cst.full_name,
    cst.phone_number,
    cst.status,
    cst.priority,
    cst.created_at,
    cst.updated_at,
    cst.last_message_at,
    csm.id as message_id,
    csm.message,
    csm.message_type,
    csm.is_system_message,
    csm.created_at as message_created_at,
    csm.read_at,
    CASE 
        WHEN csm.is_system_message THEN 'system'
        WHEN csm.sender_id = cst.user_id THEN 'customer'
        ELSE 'admin'
    END as sender_role,
    u.display_name as sender_name
FROM customer_service_tickets cst
LEFT JOIN customer_service_messages csm ON cst.id = csm.ticket_id
LEFT JOIN users u ON csm.sender_id = u.id
ORDER BY cst.created_at DESC, csm.created_at ASC;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON customer_service_tickets TO authenticated;
GRANT ALL ON customer_service_messages TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ticket_number() TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_service_ticket(VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_customer_service_message(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT SELECT ON customer_conversations TO authenticated;
