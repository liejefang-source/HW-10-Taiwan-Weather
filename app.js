const cities = [
    { name: "台北市", lat: 25.0478, lon: 121.5319 },
    { name: "新北市", lat: 25.0112, lon: 121.4560 },
    { name: "桃園市", lat: 24.9936, lon: 121.3010 },
    { name: "台中市", lat: 24.1469, lon: 120.6839 },
    { name: "台南市", lat: 22.9997, lon: 120.2270 },
    { name: "高雄市", lat: 22.6273, lon: 120.3014 }
];

function getWeatherIconAndDesc(code, isDay) {
    let icon = '';
    let desc = '';
    const dayNight = isDay ? '' : '-night';

    if (code === 0) {
        icon = isDay ? 'ph-sun' : 'ph-moon';
        desc = '晴朗';
    } else if (code >= 1 && code <= 3) {
        icon = isDay ? 'ph-cloud-sun' : 'ph-cloud-moon';
        desc = code === 1 ? '多雲' : (code === 2 ? '局部多雲' : '陰天');
    } else if (code === 45 || code === 48) {
        icon = 'ph-cloud-fog';
        desc = '起霧';
    } else if (code >= 51 && code <= 55) {
        icon = 'ph-cloud-drizzle';
        desc = '毛毛雨';
    } else if (code >= 61 && code <= 65) {
        icon = 'ph-cloud-rain';
        desc = '降雨';
    } else if (code >= 71 && code <= 77) {
        icon = 'ph-snowflake';
        desc = '降雪';
    } else if (code >= 80 && code <= 82) {
        icon = 'ph-cloud-showers';
        desc = '陣雨';
    } else if (code >= 95 && code <= 99) {
        icon = 'ph-cloud-lightning';
        desc = '雷雨';
    } else {
        icon = 'ph-cloud';
        desc = '未知天氣';
    }

    return { icon, desc };
}

async function fetchWeather() {
    const grid = document.getElementById('weather-grid');
    const timeEl = document.getElementById('last-updated');
    
    // Format coordinates for batch request
    const lats = cities.map(c => c.lat).join(',');
    const lons = cities.map(c => c.lon).join(',');
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FTaipei`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Clear loading text
        grid.innerHTML = '';
        
        // Determine if it's a batch response (array) or single (which shouldn't happen here but just in case)
        const isArray = Array.isArray(data);
        const results = isArray ? data : [data];

        cities.forEach((city, index) => {
            const cityData = results[index].current;
            const { icon, desc } = getWeatherIconAndDesc(cityData.weather_code, cityData.is_day);
            
            const card = document.createElement('div');
            card.className = 'weather-card';
            
            card.innerHTML = `
                <div class="card-header">
                    <h2 class="city-name">${city.name}</h2>
                    <i class="ph ${icon} weather-icon"></i>
                </div>
                <div class="temperature">
                    ${Math.round(cityData.temperature_2m)}<span>°C</span>
                </div>
                <div class="weather-desc">${desc}</div>
                <div class="details">
                    <div class="detail-item">
                        <i class="ph ph-drop"></i>
                        <span>濕度: ${cityData.relative_humidity_2m}%</span>
                    </div>
                    <div class="detail-item">
                        <i class="ph ph-wind"></i>
                        <span>風速: ${cityData.wind_speed_10m} km/h</span>
                    </div>
                    <div class="detail-item">
                        <i class="ph ph-thermometer"></i>
                        <span>體感: ${Math.round(cityData.apparent_temperature)}°C</span>
                    </div>
                    <div class="detail-item">
                        <i class="ph ph-cloud-rain"></i>
                        <span>降雨: ${cityData.precipitation} mm</span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        const now = new Date();
        timeEl.textContent = `最後更新: ${now.toLocaleTimeString('zh-TW', { hour12: false })}`;
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        grid.innerHTML = '<div class="loading">無法載入天氣資訊，請稍後再試。</div>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    // Refresh every 5 minutes
    setInterval(fetchWeather, 5 * 60 * 1000);
});
