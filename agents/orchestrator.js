//orchester-coordinates all the child agents and puts together the final response
async function planTrip(fullQuery, uiElements) {
    const { planButton, outputArea, loadingIndicator, placeInput } = uiElements;

    if (!fullQuery.trim()) {
        outputArea.innerHTML = '<p class="text-red-500">Please enter a place and your request.</p>';
        return;
    }

    //loading state
    planButton.disabled = true;
    planButton.textContent = 'Processing...';
    outputArea.innerHTML = '';
    loadingIndicator.classList.remove('hidden');
    
    //figuring out which place
    const place = extractPlaceFromQuery(fullQuery);
    
    if (!place) {
        outputArea.innerHTML = '<p class="text-red-500">Could not identify the place in your query. Please format it as "I\'m going to go to [Place]".</p>';
        loadingIndicator.classList.add('hidden');
        planButton.disabled = false;
        planButton.textContent = 'Start Planning';
        return;
    }

    //check what they're asking for-weather, places, or both
    const queryLower = fullQuery.toLowerCase();
    const wantsWeather = queryLower.includes('temperature') || queryLower.includes('weather') || queryLower.includes('temp');
    const wantsPlaces = queryLower.includes('places') || 
                        queryLower.includes('visit') || 
                        queryLower.includes('plan') || 
                        queryLower.includes('trip') ||
                        queryLower.includes('attractions') ||
                        queryLower.includes('sights') ||
                        queryLower.includes('things to do') ||
                        queryLower.includes('tourist');
    
    // If they say "plan my trip" without asking for weather, assume they want places
    const isPlanningQuery = queryLower.includes('plan') || queryLower.includes('trip');
    const shouldShowPlaces = wantsPlaces || (isPlanningQuery && !wantsWeather);

    let coords, weatherData, placesData;
    
    try {
        // First, get coordinates for the place (we need this for everything)
        coords = await getCoordinates(place);

        if (!coords) {
            // Place not found
            outputArea.innerHTML = `<p class="text-red-600 font-semibold">I'm sorry, I don't know if a place called "${place}" exists or I couldn't find its location data. Please try again with a more specific or valid place name.</p>`;
            loadingIndicator.classList.add('hidden');
            planButton.disabled = false;
            planButton.textContent = 'Start Planning';
            return;
        }
        
        // Shorten the place name for display (Nominatim gives us really long addresses)
        const displayPlaceName = getShortDisplayName(coords.name, place);

        const lat = coords.lat;
        const lon = coords.lon;
        
        const promises = [];

        if (wantsWeather) {
            promises.push(getWeather(lat, lon));
        } else {
            promises.push(Promise.resolve(null)); // Keep array order consistent
        }

        if (shouldShowPlaces) {
            promises.push(getTouristPlaces(lat, lon));
        } else {
            promises.push(Promise.resolve(null)); // Keep array order consistent
        }

        // Run both agents in parallel for speed
        [weatherData, placesData] = await Promise.all(promises);

        // Format the response to match the example format
        let weatherText = '';
        let placesText = '';
        let placesList = [];

        // Build weather text: "In [Place] it's currently [temp]°C with a chance of [precip]% to rain."
        if (wantsWeather && weatherData) {
            weatherText = `In ${displayPlaceName} it's currently ${weatherData.temperature}${weatherData.temperatureUnit === '°C' ? '°C' : weatherData.temperatureUnit} with a chance of ${weatherData.precipitation}% to rain.`;
        } else if (wantsWeather && !weatherData) {
            weatherText = `Weather data is currently unavailable for ${displayPlaceName}.`;
        }
        
        // Build places text: "In [Place] these are the places you can go, [list]"
        if (shouldShowPlaces) {
            if (placesData && placesData.length > 0) {
                placesList = placesData;
                if (weatherText) {
                    // If we already have weather, use "And these are the places..."
                    placesText = 'And these are the places you can go:';
                } else {
                    // Otherwise use the full format
                    placesText = `In ${displayPlaceName} these are the places you can go,`;
                }
            } else {
                // No places found
                placesText = `I couldn't find any specific tourist attractions for ${displayPlaceName} using the Places Agent, but feel free to explore the area!`;
            }
        }

        // If they didn't ask for weather or places, tell them to be more specific
        if (!wantsWeather && !shouldShowPlaces) {
            outputArea.innerHTML = '<p class="text-red-500">Please include a question in your query, like "what are the places I can visit" or "what is the temperature there?".</p>';
        } else {
            // Put together the HTML response
            let htmlResponse = '';
            
            if (weatherText) {
                htmlResponse += `<p class="mb-4">${weatherText}</p>`;
            }
            
            if (placesText) {
                if (placesList.length > 0) {
                    htmlResponse += `<p class="mb-2">${placesText}</p>`;
                    htmlResponse += '<ul class="divide-y divide-gray-200 mt-2 p-0">';
                    placesList.forEach((placeName) => {
                        htmlResponse += `<li class="flex items-center space-x-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg><span>${placeName}</span></li>`;
                    });
                    htmlResponse += '</ul>';
                } else {
                    htmlResponse += `<p class="mt-4 text-orange-600">${placesText}</p>`;
                }
            }
            
            outputArea.innerHTML = htmlResponse;
        }

    } catch (error) {
        console.error("Orchestration Error:", error);
        // Something went wrong - probably an API issue
        outputArea.innerHTML = `<p class="text-red-600 font-semibold">An unexpected error occurred during the trip planning process. This is likely an issue with one of the underlying APIs. Please try again later. (Error: ${error.message})</p>`;
    } finally {
        // Always reset the UI, even if something failed
        loadingIndicator.classList.add('hidden');
        planButton.disabled = false;
        planButton.textContent = 'Start Planning';
    }
}

