//Places agent-finds tourist attractions using Overpass API (OpenStreetMap)
async function getTouristPlaces(lat, lon, count = 5) {
    const overpassQuery = `
[out:json][timeout:25];
// Search within 10km radius (10000 meters)
(
  node[tourism=attraction](around:10000, ${lat}, ${lon});
  node[tourism=museum](around:10000, ${lat}, ${lon});
  node[tourism=theme_park](around:10000, ${lat}, ${lon});
  node[leisure=park](around:10000, ${lat}, ${lon});
  node[historic](around:10000, ${lat}, ${lon});
  way[tourism=attraction](around:10000, ${lat}, ${lon});
);
// Get up to ${count} results
out body ${count};
>;
out skel qt;
`;

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    
    console.log("Overpass Query sent.");

    try {
        const response = await fetchWithRetry(overpassUrl, {
            method: 'POST',
            body: overpassQuery,
        
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 
                'User-Agent': 'InkleAssignmentTourismAI/1.0 (CanvasApp)' 
            }
        });
        const data = await response.json();
        
        if (data && data.elements) {
            const placeNames = data.elements
                .filter(e => e.tags && e.tags.name)
                .map(e => e.tags.name)
                .slice(0, count); 
            
            //removing dupli
            return [...new Set(placeNames)];
        }
        return [];
    } catch (error) {
        console.error("Overpass data fetch failed:", error);
        return [];
    }
}

