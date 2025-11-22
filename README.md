# Inkle Tourism AI Agent

A multi-agent tourism system that helps users plan trips by providing weather information and tourist attraction suggestions for any location.

![Screenshot](screenshot.png)

## Features

-  **Weather Information**: Current temperature and precipitation probability
-  **Tourist Attractions**: Discover up to 5 popular places to visit
-  **Smart Recognition**: Extracts place names from natural language queries
-  **Multi-Agent System**: Parent orchestrator with specialized child agents

## How It Works

The system uses three child agents coordinated by a parent orchestrator:

1. **Geocoding Agent**: Converts place names to coordinates (Nominatim API)
2. **Weather Agent**: Fetches current weather data (Open-Meteo API)
3. **Places Agent**: Finds tourist attractions (Overpass API / OpenStreetMap)
  ```

## Usage Examples

### Get Tourist Attractions
**Input**: `I'm going to go to Bangalore, let's plan my trip.`

### Get Weather
**Input**: `I'm going to go to Bangalore, what is the temperature there`

### Get Both
**Input**: `I'm going to go to Bangalore, what is the temperature there? And what are the places I can visit?`

## APIs Used

- **Nominatim API**: Geocoding service - [Docs](https://nominatim.org/release-docs/develop/api/Search/)
- **Open-Meteo API**: Weather data - [Docs](https://open-meteo.com/en/docs)
- **Overpass API**: Tourist attractions from OpenStreetMap - [Docs](https://wiki.openstreetmap.org/wiki/Overpass_API)

All APIs are free and open-source. No API keys required!

## Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- Tailwind CSS
- Open-source APIs (Nominatim, Open-Meteo, Overpass)


