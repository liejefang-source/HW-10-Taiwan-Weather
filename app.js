const cities = [
    { name: "台北市", lat: 25.0478, lon: 121.5319 },
    { name: "新北市", lat: 25.0112, lon: 121.4560 },
    { name: "桃園市", lat: 24.9936, lon: 121.3010 },
    { name: "台中市", lat: 24.1469, lon: 120.6839 },
    { name: "台南市", lat: 22.9997, lon: 120.2270 },
    { name: "高雄市", lat: 22.6273, lon: 120.3014 }
];

let globalWeatherData = null;

function getWeatherIconAndDesc(code, isDay = true) {
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
        desc = '未知';
    }

    return { icon, desc };
}

function renderCombinedTable(results) {
    const tbody = document.getElementById('weather-tbody');
    tbody.innerHTML = '';
    
    cities.forEach((city, index) => {
        const current = results[index].current;
        const { icon, desc } = getWeatherIconAndDesc(current.weather_code, current.is_day);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="table-city">${city.name}</td>
            <td>
                <div class="table-weather">
                    <i class="ph ${icon}"></i>
                    <span>${desc}</span>
                </div>
            </td>
            <td class="table-temp">${Math.round(current.temperature_2m)}°C</td>
            <td style="color: var(--accent);">${Math.round(current.apparent_temperature)}°C</td>
            <td class="table-rain">${current.precipitation} mm</td>
            <td>${current.relative_humidity_2m}%</td>
            <td>${current.wind_speed_10m} km/h</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderForecast(cityIndex) {
    const content = document.getElementById('forecast-content');
    if (!globalWeatherData) return;
    
    const hourly = globalWeatherData[cityIndex].hourly;
    const times = hourly.time;
    const temps = hourly.temperature_2m;
    const codes = hourly.weather_code;
    const pops = hourly.precipitation_probability;
    
    // Group by days
    const daysMap = {};
    times.forEach((timeStr, i) => {
        const date = timeStr.split('T')[0];
        const hour = timeStr.split('T')[1].substring(0, 2);
        
        if (!daysMap[date]) daysMap[date] = {};
        
        // Pick 08:00 (Morning), 14:00 (Noon), 20:00 (Night)
        if (hour === '08') daysMap[date].morning = { temp: temps[i], code: codes[i], pop: pops[i], isDay: true };
        if (hour === '14') daysMap[date].noon = { temp: temps[i], code: codes[i], pop: pops[i], isDay: true };
        if (hour === '20') daysMap[date].night = { temp: temps[i], code: codes[i], pop: pops[i], isDay: false };
    });
    
    let html = '';
    Object.keys(daysMap).slice(0, 7).forEach(date => {
        const day = daysMap[date];
        const dateObj = new Date(date);
        const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
        const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()} (${dayOfWeek})`;
        
        const renderPeriod = (data) => {
            if (!data) return '<div class="forecast-period">-</div>';
            const { icon, desc } = getWeatherIconAndDesc(data.code, data.isDay);
            return `
                <div class="forecast-period">
                    <i class="ph ${icon}"></i>
                    <div class="period-temp">${Math.round(data.temp)}°C</div>
                    <div class="period-pop"><i class="ph ph-drop"></i> ${data.pop}%</div>
                </div>
            `;
        };
        
        html += `
            <div class="forecast-day-row">
                <div class="forecast-date">${displayDate}</div>
                <div class="forecast-periods">
                    <div class="period-col">
                        <div class="period-label">早</div>
                        ${renderPeriod(day.morning)}
                    </div>
                    <div class="period-col">
                        <div class="period-label">中</div>
                        ${renderPeriod(day.noon)}
                    </div>
                    <div class="period-col">
                        <div class="period-label">晚</div>
                        ${renderPeriod(day.night)}
                    </div>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

async function fetchWeather() {
    const timeEl = document.getElementById('last-updated');
    
    // Format coordinates for batch request
    const lats = cities.map(c => c.lat).join(',');
    const lons = cities.map(c => c.lon).join(',');
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&timezone=Asia%2FTaipei`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const isArray = Array.isArray(data);
        globalWeatherData = isArray ? data : [data];
        
        renderCombinedTable(globalWeatherData);
        
        // Initial render for selected city
        const cityIndex = document.getElementById('city-selector').value;
        renderForecast(cityIndex);
        
        const now = new Date();
        timeEl.textContent = `最後更新: ${now.toLocaleTimeString('zh-TW', { hour12: false })}`;
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('weather-tbody').innerHTML = '<tr><td colspan="7" class="loading">無法載入資訊，請稍後再試。</td></tr>';
        document.getElementById('forecast-content').innerHTML = '<div class="loading">無法載入預報，請稍後再試。</div>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    
    // Listen for city changes
    document.getElementById('city-selector').addEventListener('change', (e) => {
        renderForecast(e.target.value);
    });
    
    // Refresh every 5 minutes
    setInterval(fetchWeather, 5 * 60 * 1000);
});
