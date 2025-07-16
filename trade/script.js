// Check if LightweightCharts is loaded
if (typeof LightweightCharts === 'undefined') {
    document.getElementById('errorMessage').textContent = 'Error: Lightweight Charts library failed to load.';
    document.getElementById('errorMessage').style.display = 'block';
    throw new Error('LightweightCharts not loaded');
}


// Keep track of any existing “week‐boundary” series so we can remove them
// before drawing new data. (Each Monday gets its own vertical line series.)
let weekLines = [];


// Initialize chart
const chartContainer = document.getElementById('chart');
const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: 600,
    layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
    },
    grid: {
        vertLines: { color: '#e9ecef' },
        horzLines: { color: '#e9ecef' },
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: false,
    },
    rightPriceScale: {
        borderColor: '#e9ecef',
    },
});

// Verify line series method exists
if (!chart.addLineSeries) {
    document.getElementById('errorMessage').textContent = 'Error: addLineSeries is not available in this version of Lightweight Charts.';
    document.getElementById('errorMessage').style.display = 'block';
    throw new Error('addLineSeries not available');
}

let lineSeries = chart.addLineSeries({
    color: '#007bff',
    lineWidth: 2,
    priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
    },
});




function updateChartTheme(theme) {
    if (theme === 'dark') {
        chart.applyOptions({
            layout: {
                background: { color: '#1a1a1a' },
                textColor: '#e9ecef',
            },
            grid: {
                vertLines: { color: '#2a2a2a' },
                horzLines: { color: '#2a2a2a' },
            },
            rightPriceScale: {
                borderColor: '#2a2a2a',
            },
        });
        lineSeries.applyOptions({
            color: '#3d8bfd', // Более светлый синий для тёмной темы
        });
    } else {
        chart.applyOptions({
            layout: {
                background: { color: '#ffffff' },
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#e9ecef' },
                horzLines: { color: '#e9ecef' },
            },
            rightPriceScale: {
                borderColor: '#e9ecef',
            },
        });
        lineSeries.applyOptions({
            color: '#007bff', // Стандартный синий для светлой темы
        });
    }
}

// Обработчик изменения темы
function handleThemeChange() {
    const theme = document.documentElement.getAttribute('data-bs-theme');
    updateChartTheme(theme);
}

// Наблюдатель за изменениями атрибута data-bs-theme
const observer = new MutationObserver(handleThemeChange);
observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme']
});

// Инициализация темы при загрузке
handleThemeChange();



// Initialize datepicker with yyyy-mm-dd format
$('#dateRange').datepicker({
    format: 'yyyy-mm-dd',
    range: true,
    multidate: 2,
    todayHighlight: true,
}).on('changeDate', function(e) {
    if (e.dates.length === 2) {
        const from = Math.min(e.dates[0].getTime() / 1000, e.dates[1].getTime() / 1000);
        const to = Math.max(e.dates[0].getTime() / 1000, e.dates[1].getTime() / 1000);
        loadChartData(currentUrl, from, to);
    }
});

let currentUrl = '/api/v1/trade/csv/601.csv'; // Default to Wood
let resourceMap = {}; // Store resource name to URL mapping

// Parse URL query parameter for default resource
const urlParams = new URLSearchParams(window.location.search);
const defaultResourceName = urlParams.get('name');

// Load structure.json and populate dropdown dynamically
fetch('/api/v1/trade/structure.json')
    .then(response => response.json())
    .then(data => {
        const resourceSelect = document.getElementById('resourceSelect');
        resourceSelect.innerHTML = ''; // Clear existing content

        let selectedUrl = '/api/v1/trade/csv/601.csv'; // Fallback default
        let resourceFound = false;

        // Iterate over all groups in structure.json
        Object.keys(data).forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;

            // Populate items within the group
            Object.keys(data[group]).forEach(item => {
                const resource = data[group][item];
                const option = document.createElement('option');
                option.value = resource.url;
                option.textContent = item;
                optgroup.appendChild(option);

                // Store resource name to URL mapping
                resourceMap[resource.url] = item;

                // Check if this resource matches the URL query parameter
                if (defaultResourceName && item.toLowerCase() === defaultResourceName.toLowerCase()) {
                    selectedUrl = resource.url;
                    resourceFound = true;
                }
            });

            resourceSelect.appendChild(optgroup);
        });

        // Set default selection
        if (resourceSelect.options.length > 0) {
            resourceSelect.value = selectedUrl;
            currentUrl = selectedUrl;
            if (!resourceFound && defaultResourceName) {
                document.getElementById('errorMessage').textContent = `Resource "${defaultResourceName}" not found. Defaulting to Wood.`;
                document.getElementById('errorMessage').style.display = 'block';
            }
            loadChartData(currentUrl);
        }
    })
    .catch(error => {
        document.getElementById('errorMessage').textContent = 'Error loading structure.json: ' + error.message;
        document.getElementById('errorMessage').style.display = 'block';
        console.error('Error loading structure.json:', error);
    });

// Handle resource selection
document.getElementById('resourceSelect').addEventListener('change', function() {
    currentUrl = this.value;
    const resourceName = resourceMap[currentUrl] || 'Unknown';

    // Update URL with the selected resource name
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('name', resourceName);
    window.history.pushState({}, '', newUrl);

    const dateRange = $('#dateRange').datepicker('getDates');
    if (dateRange.length === 2) {
        const from = Math.min(dateRange[0].getTime() / 1000, dateRange[1].getTime() / 1000);
        const to = Math.max(dateRange[0].getTime() / 1000, dateRange[1].getTime() / 1000);
        loadChartData(currentUrl, from, to);
    } else {
        loadChartData(currentUrl);
    }
});

// Function to get all Monday midnights in the given time range
function getMondayMidnights(startTime, endTime) {
    const mondays = [];
    const startDate = new Date(startTime * 1000);
    const endDate = new Date(endTime * 1000);

    // Find the first Monday on or after startDate
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0); // Set to midnight
    while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
    }

    // Add all Mondays until endDate
    while (current <= endDate) {
        mondays.push(Math.floor(current.getTime() / 1000));
        current.setDate(current.getDate() + 7); // Move to next Monday
    }

    return mondays;
}

// Function to load and process CSV data
function loadChartData(url, from, to) {
    // Clear error message
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch CSV: ' + response.statusText);
            return response.text();
        })
        .then(csvText => {
            // Check for empty or invalid CSV
            if (!csvText.trim()) throw new Error('CSV file is empty');

            const lines = csvText.trim().split('\n');
            const data = lines.map(line => {
                const [time, price] = line.split(',');
                if (!time || price === undefined) throw new Error('Invalid CSV format: missing time or price');
                const date = new Date(time);
                if (isNaN(date)) throw new Error('Invalid date format in CSV');
                const priceValue = parseFloat(price);
                if (isNaN(priceValue)) throw new Error('Invalid price format in CSV');
                return {
                    time: Math.floor(date.getTime() / 1000),
                    value: priceValue,
                };
            });

            // Filter data by date range if provided
            let filteredData = data;
            if (from && to) {
                filteredData = data.filter(d => d.time >= from && d.time <= to);
            }

            // Calculate statistics
            const prices = filteredData.map(d => d.value);
            const maxPrice = prices.length ? Math.max(...prices) : NaN;
            const minPrice = prices.length ? Math.min(...prices) : NaN;
            const avgPrice = prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : NaN;
            const priceRange = prices.length ? maxPrice - minPrice : NaN;

            // Update statistics display
            document.getElementById('maxPrice').textContent = isNaN(maxPrice) ? 'N/A' : maxPrice.toFixed(6);
            document.getElementById('minPrice').textContent = isNaN(minPrice) ? 'N/A' : minPrice.toFixed(6);
            document.getElementById('avgPrice').textContent = isNaN(avgPrice) ? 'N/A' : avgPrice.toFixed(6);
            document.getElementById('priceRange').textContent = isNaN(priceRange) ? 'N/A' : priceRange.toFixed(6);
            document.getElementById('dataPoints').textContent = prices.length;

            // Remove existing series and create a new one to clear price lines
            chart.removeSeries(lineSeries);
            lineSeries = chart.addLineSeries({
                color: '#007bff',
                lineWidth: 2,
                priceFormat: {
                    type: 'price',
                    precision: 5,
                    minMove: 0.00001,
                },
            });

            // Update chart with new data
            lineSeries.setData(filteredData);

            // Add markers for max and min prices
            const markers = [];
            const maxIndex = prices.indexOf(maxPrice);
            const minIndex = prices.indexOf(minPrice);
            if (maxIndex !== -1) {
                markers.push({
                    time: filteredData[maxIndex].time,
                    position: 'aboveBar',
                    color: '#dc3545',
                    shape: 'arrowDown',
                    text: 'Max: ' + maxPrice.toFixed(6),
                });
            }
            if (minIndex !== -1) {
                markers.push({
                    time: filteredData[minIndex].time,
                    position: 'belowBar',
                    color: '#28a745',
                    shape: 'arrowUp',
                    text: 'Min: ' + minPrice.toFixed(6),
                });
            }

            lineSeries.setMarkers(markers);


            // Remove any old weekLines from the chart
            weekLines.forEach(s => chart.removeSeries(s));
            weekLines =[];
            // Now draw a vertical line for each Monday in the visible range:
            if (filteredData.length) {
                // Determine the timestamp range (in seconds)
                const firstTs = filteredData[0].time * 1000;  // in ms
                const lastTs = filteredData[filteredData.length - 1].time * 1000;
                
                // Find the first Monday on or after the very first data point
                const firstDate = new Date(firstTs);
                const firstUTCDate = new Date(Date.UTC(
                    firstDate.getUTCFullYear(),
                    firstDate.getUTCMonth(),
                    firstDate.getUTCDate()
                ));
                const offsetToMonday = (8 - firstUTCDate.getUTCDay()) % 7;
                let firstMonday = new Date(firstUTCDate.getTime() + offsetToMonday * 24 * 60 * 60 * 1000);

                // Цикл от этого понедельника до превышения lastTs
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                for (let d = firstMonday.getTime(); d <= lastTs; d += 7 * 24 * 60 * 60 * 1000) {
                    // Convert back to Unix‐seconds
                    const mondayTimestamp = Math.floor(d / 1000);
                    
                    // Create a tiny 2-point series straight up from minPrice to maxPrice
                    const vertSeries = chart.addLineSeries({
                        color: currentTheme === 'dark' ? '#3d8bfd' : '#20b2aa', // Разные цвета для темной и светлой тем
                        lineWidth: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                        priceScaleId: '',        // overlay on main price scale
                        scaleMargins: { top: 0, bottom: 0 },
                    });
                    vertSeries.setData([
                        { time: mondayTimestamp, value: minPrice },
                        { time: mondayTimestamp, value: maxPrice },
                    ]);
                    weekLines.push(vertSeries);
                }
            }
            // ───────────────────────────────────────────────────────────
            
            // Add average price line if valid
            if (!isNaN(avgPrice)) {
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                lineSeries.createPriceLine({
                    price: avgPrice,
                    color: currentTheme === 'dark' ? '#3d8bfd' : '#007bff', // Разные цвета для темной и светлой тем
                    lineWidth: 2,
                    lineStyle: LightweightCharts.LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: 'Avg: ' + avgPrice.toFixed(6),
                });
            }

            // Auto-fit the time scale
            chart.timeScale().fitContent();
        })
        .catch(error => {
            document.getElementById('errorMessage').textContent = 'Error loading CSV: ' + error.message;
            document.getElementById('errorMessage').style.display = 'block';
            console.error('Error loading CSV:', error);
        });
}

// Resize chart on window resize
window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, 600);
});

$(document).ready(function() {
    initializeTheme();
    $('#themeToggle').on('click', toggleTheme);
});
function toggleTheme() {
    console.log('toggleTheme')
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    console.log('toggleTheme',newTheme)

    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeIcon(newTheme);
}
function updateThemeIcon(theme) {
    const icon = $('#themeIcon');
    icon.removeClass('bi-moon bi-brightness-high');
    icon.addClass(theme === 'dark' ? 'bi-brightness-high' : 'bi-moon');
}
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);
}