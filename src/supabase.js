import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qpuksrlsguobjsibqtxj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdWtzcmxzZ3VvYmpzaWJxdHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUwNzEwOTcsImV4cCI6MjAzMDY0NzA5N30.l-kif_W7O88wAK-COBlTM4P6JTCXv3S65gI1gx1EwoU";

export const supabase = createClient(supabaseUrl, supabaseKey);
