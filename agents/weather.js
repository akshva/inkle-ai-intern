//Weather agent-fetches current weather data from Open-Meteo API
async function getWeather(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation_probability&forecast_days=1&timezone=auto`;
    
    console.log("Weather URL:", weatherUrl);

    try {
        const response = await fetchWithRetry(weatherUrl);
        const data = await response.json();

        if (data && data.current) {
            const temp = data.current.temperature_2m;
            const precip = data.current.precipitation_probability;
            const units = data.current_units.temperature_2m;
            
            return {
                temperature: Math.round(temp),
                temperatureUnit: units,
                precipitation: precip
            };
        }
        return null;
    } catch (error) {
        console.error("Weather data fetch failed:", error);
        return null;
    }
}

