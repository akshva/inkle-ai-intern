// Main app setup - wait for page to load before doing anything
document.addEventListener('DOMContentLoaded', function() {
    // Grab all the DOM elements we need
    const placeInput = document.getElementById('placeInput');
    const planButton = document.getElementById('planButton');
    const outputArea = document.getElementById('outputArea');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Make sure everything exists before we try to use it
    if (!placeInput || !planButton || !outputArea || !loadingIndicator) {
        console.error('Some required DOM elements are missing');
        return;
    }

    // Bundle up the UI elements to pass to the orchestrator
    const uiElements = {
        planButton,
        outputArea,
        loadingIndicator,
        placeInput
    };

    // Handle button clicks and Enter key presses
    function handlePlanTrip() {
        const fullQuery = placeInput.value.trim();
        planTrip(fullQuery, uiElements);
    }

    planButton.addEventListener('click', handlePlanTrip);

    placeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePlanTrip();
        }
    });
});

