
document.addEventListener('DOMContentLoaded', function() {
    //doms
    const placeInput = document.getElementById('placeInput');
    const planButton = document.getElementById('planButton');
    const outputArea = document.getElementById('outputArea');
    const loadingIndicator = document.getElementById('loadingIndicator');

    if (!placeInput || !planButton || !outputArea || !loadingIndicator) {
        console.error('Some required DOM elements are missing');
        return;
    }

    //ui
    const uiElements = {
        planButton,
        outputArea,
        loadingIndicator,
        placeInput
    };

    //click button
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

