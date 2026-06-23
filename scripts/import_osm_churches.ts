import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Overpass API Query for Protestant Churches
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const QUERY = `
  [out:json][timeout:60];
  (
    node["amenity"="place_of_worship"]["denomination"~"pentecostal|evangelical|protestant|baptist|adventist"](40.0, 20.0, 70.0, 180.0);
    way["amenity"="place_of_worship"]["denomination"~"pentecostal|evangelical|protestant|baptist|adventist"](40.0, 20.0, 70.0, 180.0);
  );
  out center;
`;
// Bounding box (40.0, 20.0, 70.0, 180.0) covers roughly Russia/CIS and Europe

async function importChurches() {
  // Изменим bbox на меньший размер для теста (например, центральная Россия) или оставим весь СНГ
  // Но для начала проверим на небольшом куске чтобы не получить таймаут
  const TEST_QUERY = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["denomination"~"pentecostal|evangelical|protestant|baptist|adventist"](55.0, 36.0, 56.5, 38.5);
      way["amenity"="place_of_worship"]["denomination"~"pentecostal|evangelical|protestant|baptist|adventist"](55.0, 36.0, 56.5, 38.5);
    );
    out center;
  `;

  console.log("Fetching data from OpenStreetMap...");
  try {
    const response = await fetch(OVERPASS_URL + '?data=' + encodeURIComponent(TEST_QUERY), {
      headers: {
        'User-Agent': 'GraceMap/1.0 (script by Antigravity)'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements.length} churches in OSM. Filtering and importing...`);

    const requestsToInsert = [];

    for (const element of data.elements) {
      if (!element.tags) continue;
      
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      let name = element.tags.name || 'Христианская церковь';
      if (element.tags.denomination === 'pentecostal') name += ' (Пятидесятники)';
      else if (element.tags.denomination === 'baptist') name += ' (Баптисты)';

      requestsToInsert.push({
        type: 'project',
        title: name,
        author_name: 'OSM',
        description: 'Импортировано из OpenStreetMap',
        lng: lon,
        lat: lat,
        contact_type: 'phone',
        contact_value: element.tags.phone || 'Не указан',
        is_verified: false
      });
    }

    // Insert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < requestsToInsert.length; i += BATCH_SIZE) {
      const batch = requestsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('help_requests').insert(batch);
      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      } else {
        console.log(`Imported batch ${i / BATCH_SIZE + 1} (${batch.length} churches)`);
      }
    }

    console.log("Done importing churches!");
  } catch (error) {
    console.error("Failed to import churches:", error);
  }
}

importChurches();
