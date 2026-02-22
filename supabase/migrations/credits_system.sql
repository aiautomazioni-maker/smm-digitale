-- Add credits column to profiles
ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 10; -- Give 10 free credits to start

-- Create usage_logs table
CREATE TABLE usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert logs (for backend)
CREATE POLICY "Service role can insert logs" ON usage_logs
    FOR INSERT WITH CHECK (true);
