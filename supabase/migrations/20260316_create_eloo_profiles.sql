-- Create eloo_profiles table for the application
CREATE TABLE IF NOT EXISTS public.eloo_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    role TEXT CHECK (role IN ('client', 'provider', 'admin')) NOT NULL DEFAULT 'client',
    is_verified BOOLEAN DEFAULT FALSE,
    stripe_account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_eloo_profiles_email ON public.eloo_profiles(email);
CREATE INDEX IF NOT EXISTS idx_eloo_profiles_role ON public.eloo_profiles(role);
CREATE INDEX IF NOT EXISTS idx_eloo_profiles_city ON public.eloo_profiles(city);

-- Enable Row Level Security
ALTER TABLE public.eloo_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for eloo_profiles
CREATE POLICY "Users can view their own profile"
    ON public.eloo_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.eloo_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.eloo_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow public to read provider profiles for discovery
CREATE POLICY "Public can view provider profiles"
    ON public.eloo_profiles FOR SELECT
    USING (role = 'provider');

-- Create trigger for updated_at
CREATE TRIGGER update_eloo_profiles_updated_at
    BEFORE UPDATE ON public.eloo_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration for eloo_profiles
CREATE OR REPLACE FUNCTION public.handle_new_eloo_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into eloo_profiles if not exists
    INSERT INTO public.eloo_profiles (id, role, email, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created_eloo ON auth.users;
CREATE TRIGGER on_auth_user_created_eloo
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_eloo_user();
