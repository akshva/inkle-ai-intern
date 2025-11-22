// Geocoding agent - converts place names to coordinates using Nominatim API
async function getCoordinates(place) {
    const locationName = cleanPlaceName(place);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
    
    console.log("Geocoding URL:", nominatimUrl);

    try {
        const response = await fetchWithRetry(nominatimUrl, {
           
            headers: { 'User-Agent': 'InkleAssignmentTourismAI/1.0 (CanvasApp)' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon, display_name } = data[0];
            return { 
                lat: parseFloat(lat), 
                lon: parseFloat(lon), 
                name: display_name 
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        throw new Error("Could not find the coordinates for this place.");
    }
}

