// Ce fichier ne fait que reexporter le client unique defini dans src/supabase.js,
// qui contient le contournement necessaire du bug de verrou navigator.locks
// (issues GitHub #1517, #936, #1594, #1620, #2111 de @supabase/supabase-js).
// Ne PAS creer un nouveau client ici : toujours reexporter depuis "../supabase".
export { supabase } from "../supabase";