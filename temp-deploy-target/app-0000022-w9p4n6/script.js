class WeatherApp {
    constructor() {
        this.currentCity = '東京';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadWeatherData();
        this.generateForecast();
    }
    
    setupEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => {
            const city = document.getElementById('city-input').value;
            if (city) {
                this.currentCity = city;
                this.loadWeatherData();
            }
        });
        
        document.getElementById('city-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = e.target.value;
                if (city) {
                    this.currentCity = city;
                    this.loadWeatherData();
                }
            }
        });
    }
    
    loadWeatherData() {
        // モックデータ（実際のAPIを使用する場合は置き換え）
        const mockData = this.getMockWeatherData();
        this.updateCurrentWeather(mockData);
        document.getElementById('city-input').value = '';
    }
    
    getMockWeatherData() {
        const cities = {
            '東京': { temp: 25, humidity: 65, wind: 5, visibility: 10, description: '晴れ', icon: 'fas fa-sun' },
            '大阪': { temp: 28, humidity: 70, wind: 3, visibility: 8, description: '曇り', icon: 'fas fa-cloud' },
            '北海道': { temp: 18, humidity: 55, wind: 8, visibility: 15, description: '雪', icon: 'fas fa-snowflake' },
            '沖縄': { temp: 32, humidity: 80, wind: 12, visibility: 20, description: '雨', icon: 'fas fa-cloud-rain' }
        };
        
        return cities[this.currentCity] || {
            temp: Math.floor(Math.random() * 30) + 10,
            humidity: Math.floor(Math.random() * 40) + 40,
            wind: Math.floor(Math.random() * 10) + 1,
            visibility: Math.floor(Math.random() * 15) + 5,
            description: ['晴れ', '曇り', '雨', '雪'][Math.floor(Math.random() * 4)],
            icon: 'fas fa-sun'
        };
    }
    
    updateCurrentWeather(data) {
        document.getElementById('city-name').textContent = this.currentCity;
        document.getElementById('temp').textContent = data.temp;
        document.getElementById('description').textContent = data.description;
        document.getElementById('humidity').textContent = data.humidity + '%';
        document.getElementById('wind-speed').textContent = data.wind + 'm/s';
        document.getElementById('visibility').textContent = data.visibility + 'km';
        document.getElementById('weather-icon').className = data.icon;
    }
    
    generateForecast() {
        const container = document.getElementById('forecast-container');
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const icons = ['fas fa-sun', 'fas fa-cloud', 'fas fa-cloud-rain', 'fas fa-snowflake'];
        
        container.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            const dayName = i === 0 ? '今日' : i === 1 ? '明日' : days[date.getDay()];
            const high = Math.floor(Math.random() * 15) + 20;
            const low = high - Math.floor(Math.random() * 10) - 5;
            const icon = icons[Math.floor(Math.random() * icons.length)];
            
            const item = document.createElement('div');
            item.className = 'forecast-item';
            item.innerHTML = `
                <div class="date">${dayName}</div>
                <div class="icon"><i class="${icon}"></i></div>
                <div class="temps">
                    <span class="high">${high}°</span>
                    <span class="low">${low}°</span>
                </div>
            `;
            
            container.appendChild(item);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});