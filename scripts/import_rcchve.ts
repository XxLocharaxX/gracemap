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

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Запрос ищет все протестантские церкви в России (пятидесятники, баптисты, адвентисты, евангелисты и т.д.)
const QUERY = `
  [out:json][timeout:300];
  area["ISO3166-1"="RU"][admin_level=2]->.searchArea;
  (
    node["amenity"="place_of_worship"]["denomination"~"protestant|pentecostal|baptist|adventist|evangelical|methodist|presbyterian",i](area.searchArea);
    way["amenity"="place_of_worship"]["denomination"~"protestant|pentecostal|baptist|adventist|evangelical|methodist|presbyterian",i](area.searchArea);
    node["amenity"="place_of_worship"]["name"~"ХВЕ|РЦХВЕ|РОСХВЕ|пятидесят|баптист|адвентист|евангел|протестант|методист",i](area.searchArea);
    way["amenity"="place_of_worship"]["name"~"ХВЕ|РЦХВЕ|РОСХВЕ|пятидесят|баптист|адвентист|евангел|протестант|методист",i](area.searchArea);
  );
  out center;
`;

async function importChurches() {
  console.log("Удаляем старые импортированные церкви из базы...");
  await supabase.from('help_requests').delete().eq('author_name', 'OSM');

  console.log("Скачиваем церкви РЦХВЕ/ХВЕ по всей России из OpenStreetMap...");
  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(QUERY),
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GraceMap/1.0 (script by Antigravity)' 
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    console.log(`Найдено ${data.elements.length} церквей ХВЕ в России. Импортируем...`);

    const requestsToInsert = [];

    for (const element of data.elements) {
      if (!element.tags) continue;
      
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) continue;

      let name = element.tags.name || 'Церковь ХВЕ';
      
      requestsToInsert.push({
        type: 'project',
        title: name,
        author_name: 'OSM',
        description: 'Импортировано из OpenStreetMap (РЦХВЕ / ХВЕ)',
        lng: lon,
        lat: lat,
        contact_type: 'phone',
        contact_value: element.tags.phone || 'Не указан',
        is_verified: true // Можно сразу верифицировать, так как это из офф. карты
      });
    }

    // Insert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < requestsToInsert.length; i += BATCH_SIZE) {
      const batch = requestsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('help_requests').insert(batch);
      if (error) {
        console.error(`Ошибка при вставке батча ${i / BATCH_SIZE + 1}:`, error);
      } else {
        console.log(`Импортировано ${i + batch.length} из ${requestsToInsert.length}`);
      }
    }

    console.log("Готово! Все церкви РЦХВЕ загружены.");
  } catch (error) {
    console.error("Ошибка при импорте:", error);
  }
}

importChurches();
