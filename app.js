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
    const tbody = document.getElementById('weather-tbody');
    const detailsTbody = document.getElementById('details-tbody');
    const timeEl = document.getElementById('last-updated');
    
    // Format coordinates for batch request
    const lats = cities.map(c => c.lat).join(',');
    const lons = cities.map(c => c.lon).join(',');
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FTaipei`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Clear loading text
        tbody.innerHTML = '';
        detailsTbody.innerHTML = '';
        
        // Determine if it's a batch response (array) or single
        const isArray = Array.isArray(data);
        const results = isArray ? data : [data];

        cities.forEach((city, index) => {
            const cityData = results[index].current;
            const { icon, desc } = getWeatherIconAndDesc(cityData.weather_code, cityData.is_day);
            
            // Build Weather Table Row
            const tr1 = document.createElement('tr');
            tr1.innerHTML = `
                <td class="table-city">${city.name}</td>
                <td>
                    <div class="table-weather">
                        <i class="ph ${icon}"></i>
                        <span>${desc}</span>
                    </div>
                </td>
                <td class="table-temp">${Math.round(cityData.temperature_2m)}°C</td>
                <td class="table-rain">${cityData.precipitation} mm</td>
            `;
            tbody.appendChild(tr1);
            
            // Build Details Table Row
            const tr2 = document.createElement('tr');
            tr2.innerHTML = `
                <td class="table-city">${city.name}</td>
                <td class="table-rain">${cityData.relative_humidity_2m}%</td>
                <td class="table-rain">${cityData.wind_speed_10m} km/h</td>
                <td class="table-temp" style="color: var(--accent);">${Math.round(cityData.apparent_temperature)}°C</td>
            `;
            detailsTbody.appendChild(tr2);
        });
        
        const now = new Date();
        timeEl.textContent = `最後更新: ${now.toLocaleTimeString('zh-TW', { hour12: false })}`;
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="loading">無法載入天氣資訊，請稍後再試。</td></tr>';
        detailsTbody.innerHTML = '<tr><td colspan="4" class="loading">無法載入進階資訊，請稍後再試。</td></tr>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    // Refresh every 5 minutes
    setInterval(fetchWeather, 5 * 60 * 1000);
});
