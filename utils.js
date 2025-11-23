//functions
//Retrylogic
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
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

function extractPlaceFromQuery(query) {
    function cleanPlace(place) {
        //cleanup
        place = place
            .replace(/^(weather|temperature|temp)\s+in\s+/i, '')
            .replace(/^in\s+(weather|temperature|temp)\s+/i, '')
            .replace(/^(what|how|is|the|a|an)\s+/i, '')
            .trim();
        
        //cleanup
        place = place
            .replace(/\s+(weather|temperature|temp|plan|trip|my|let'?s|let|us|visit|places|attractions|sights|tourist|things\s+to\s+do)\s*$/i, '')
            .replace(/\s+(what|how|is|the|a|an)\s*$/i, '')
            .trim();
        
        place = place.replace(/\s+(plan|trip|visit|go|going)\s*$/i, '').trim();
        
        return place;
    }
    
    //place name comes first
    let match = query.match(/^([a-zA-Z\s,]+?)(?:,|\s+)(?:plan|trip|visit|let'?s|let|us)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 2 && !/^(i'?m|going|to|go|what|how|is|the|weather|temperature|temp)$/i.test(place)) {
            return place;
        }
    }
    
    //diff pattern like "i'm going"
    match = query.match(/going\s+to\s+go\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        //remove "go to"
        place = place.replace(/^go\s+to\s+/i, '').replace(/\s+go\s+to\s+/i, ' ').trim();
        if (place.length > 0) {
            return place;
        }
    }
    
    //temp
    match = query.match(/(?:weather|temperature|temp)\s+in\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 0) {
            return place;
        }
    }
    

    match = query.match(/\bin\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 0 && !/^(weather|temperature|temp|there)$/i.test(place)) {
            return place;
        }
    }
    
    //"going to" function
    match = query.match(/going\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        place = place.replace(/^go\s+to\s+/i, '').trim();
        if (place.length > 0 && !place.toLowerCase().startsWith('go ')) {
            return place;
        }
    }
    
    //"go to" func
    match = query.match(/\bgo\s+to\s+([a-zA-Z\s,]+?)(?:[\s,!\.?]|$)/i);
    if (match && match[1]) {
        let place = cleanPlace(match[1].trim());
        if (place.length > 0) {
            return place;
        }
    }
    
    //anything after "go to"
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
    
    //split commas, qn marks
    let fallback = query.split(',')[0].split('?')[0].split('!')[0].trim();
    
    //for words like "plan or trip"
    const actionWords = /\s+(plan|trip|visit|let'?s|let|us|what|how|is|temperature|weather|temp)/i;
    if (actionWords.test(fallback)) {
        const beforeAction = fallback.split(actionWords)[0].trim();
        if (beforeAction.length > 0) {
            fallback = beforeAction;
        }
    }
    
    //clean up prefixes
    const cleaned = cleanPlace(fallback.replace(/^(i'?m\s+)?(going\s+to\s+)?(go\s+to\s+)?/i, '').trim());
    return cleaned.length > 0 ? cleaned : null;
}

//clean up
function cleanPlaceName(place) {
    return place.split(',')[0].split('?')[0].split('!')[0].trim();
}

//shortening
function getShortDisplayName(fullName, originalPlace = '') {
    const nameParts = fullName.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    //using original only
    if (originalPlace && nameParts.length > 0) {
        const firstPart = nameParts[0].toLowerCase();
        const originalLower = originalPlace.toLowerCase();
        if (firstPart === originalLower || firstPart.includes(originalLower) || originalLower.includes(firstPart)) {
            return originalPlace; 
        }
    }
    
    // Otherwise just use the first part from Nominatim (usually the city name)
    if (nameParts.length > 0) {
        return nameParts[0];
    }
    
    return fullName;
}

