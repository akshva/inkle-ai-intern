// Utility functions for the tourism system

// Retry logic for API calls - sometimes APIs fail temporarily, so we retry with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Not a successful response, throw error
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000;
            console.warn(`Request failed, retrying in ${delay / 1000}s...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Extract the place name from whatever the user typed
function extractPlaceFromQuery(query) {
    // Helper to strip out query words that accidentally got captured
    function cleanPlace(place) {
        // Clean up stuff at the beginning
        place = place
            .replace(/^(weather|temperature|temp)\s+in\s+/i, '')
            .replace(/^in\s+(weather|temperature|temp)\s+/i, '')
            .replace(/^(what|how|is|the|a|an)\s+/i, '')
            .trim();
        
        // Clean up stuff at the end
        place = place
            .replace(/\s+(weather|temperature|temp|plan|trip|my|let'?s|let|us|visit|places|attractions|sights|tourist|things\s+to\s+do)\s*$/i, '')
            .replace(/\s+(what|how|is|the|a|an)\s*$/i, '')
            .trim();
        
        // Get rid of action words that might have snuck in
        place = place.replace(/\s+(plan|trip|visit|go|going)\s*$/i, '').trim();
        
        return place;
    }
    
    // Handle cases where place name comes first, like "chennai plan" or "paris, plan my trip"
    let match = query.match(/^([a-zA-Z\s,]+?)(?:,|\s+)(?:plan|trip|visit|let'?s|let|us)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        // Make sure we didn't just grab a query word
        if (place.length > 2 && !/^(i'?m|going|to|go|what|how|is|the|weather|temperature|temp)$/i.test(place)) {
            return place;
        }
    }
    
    // Check for "I'm going to go to [place]" pattern
    match = query.match(/going\s+to\s+go\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        // Sometimes "go to" gets captured, remove it
        place = place.replace(/^go\s+to\s+/i, '').replace(/\s+go\s+to\s+/i, ' ').trim();
        if (place.length > 0) {
            return place;
        }
    }
    
    // Handle "weather in [place]" or "temperature in [place]"
    match = query.match(/(?:weather|temperature|temp)\s+in\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 0) {
            return place;
        }
    }
    
    // Fallback: look for "in [place]" pattern
    match = query.match(/\bin\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        // Don't return if it's just a query word
        if (place.length > 0 && !/^(weather|temperature|temp|there)$/i.test(place)) {
            return place;
        }
    }
    
    // Check for "going to [place]"
    match = query.match(/going\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        // Strip out "go to" if it got mixed in
        place = place.replace(/^go\s+to\s+/i, '').trim();
        if (place.length > 0 && !place.toLowerCase().startsWith('go ')) {
            return place;
        }
    }
    
    // Check for "go to [place]"
    match = query.match(/\bgo\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 0) {
            return place;
        }
    }
    
    // Last resort: find anything after "to" (but watch out for "go to")
    match = query.match(/\bto\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        // Remove "go to" if it snuck in
        place = place.replace(/^go\s+to\s+/i, '').trim();
        // Skip if it looks like we captured "go to"
        if (place.length > 0 && !place.toLowerCase().startsWith('go ')) {
            return place;
        }
    }
    
    // If all else fails, assume the place is at the start of the query
    // Split on commas, question marks, etc. to get the first part
    let fallback = query.split(',')[0].split('?')[0].split('!')[0].trim();
    
    // If there are action words like "plan" or "trip", grab everything before them
    const actionWords = /\s+(plan|trip|visit|let'?s|let|us|what|how|is|temperature|weather|temp)/i;
    if (actionWords.test(fallback)) {
        const beforeAction = fallback.split(actionWords)[0].trim();
        if (beforeAction.length > 0) {
            fallback = beforeAction;
        }
    }
    
    // Clean up any prefixes and we're done
    const cleaned = cleanPlace(fallback.replace(/^(i'?m\s+)?(going\s+to\s+)?(go\s+to\s+)?/i, '').trim());
    return cleaned.length > 0 ? cleaned : null;
}

// Clean up the place name before sending to geocoding API
function cleanPlaceName(place) {
    return place.split(',')[0].split('?')[0].split('!')[0].trim();
}

// Nominatim returns really long addresses, so we shorten it to just the city name for display
function getShortDisplayName(fullName, originalPlace = '') {
    const nameParts = fullName.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    // If the user's input matches what Nominatim found, use their original input
    if (originalPlace && nameParts.length > 0) {
        const firstPart = nameParts[0].toLowerCase();
        const originalLower = originalPlace.toLowerCase();
        if (firstPart === originalLower || firstPart.includes(originalLower) || originalLower.includes(firstPart)) {
            return originalPlace; // Keeps it consistent with what they typed
        }
    }
    
    // Otherwise just use the first part from Nominatim (usually the city name)
    if (nameParts.length > 0) {
        return nameParts[0];
    }
    
    return fullName;
}

