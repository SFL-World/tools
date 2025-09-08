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

// Initialize series based on saved chart type
let currentChartType = localStorage.getItem('chartType') || 'line';
let lineSeries = null;
let candlestickSeries = null;

function initializeSeries() {
    if (currentChartType === 'line') {
        if (candlestickSeries) {
            chart.removeSeries(candlestickSeries);
            candlestickSeries = null;
        }
        lineSeries = chart.addLineSeries({
            color: '#007bff',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 5,
                minMove: 0.00001,
            },
        });
    } else {
        if (lineSeries) {
            chart.removeSeries(lineSeries);
            lineSeries = null;
        }
        candlestickSeries = chart.addCandlestickSeries({
            upColor: '#28a745',
            downColor: '#dc3545',
            borderVisible: false,
            wickUpColor: '#28a745',
            wickDownColor: '#dc3545',
            priceFormat: {
                type: 'price',
                precision: 5,
                minMove: 0.00001,
            },
        });
    }
}

initializeSeries();

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
        if (lineSeries) {
            lineSeries.applyOptions({
                color: '#3d8bfd',
            });
        }
        if (candlestickSeries) {
            candlestickSeries.applyOptions({
                upColor: '#28a745',
                downColor: '#dc3545',
                wickUpColor: '#28a745',
                wickDownColor: '#dc3545',
            });
        }
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
        if (lineSeries) {
            lineSeries.applyOptions({
                color: '#007bff',
            });
        }
        if (candlestickSeries) {
            candlestickSeries.applyOptions({
                upColor: '#28a745',
                downColor: '#dc3545',
                wickUpColor: '#28a745',
                wickDownColor: '#dc3545',
            });
        }
    }
}

// Handle theme change
function handleThemeChange() {
    const theme = document.documentElement.getAttribute('data-bs-theme');
    updateChartTheme(theme);
}

// Observer for theme changes
const observer = new MutationObserver(handleThemeChange);
observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme']
});

// Initialize theme
handleThemeChange();

// Initialize datepicker
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

let currentUrl = '/api/v1/trade/csv/601.csv';
let resourceMap = {};

// Parse URL query parameter for default resource
const urlParams = new URLSearchParams(window.location.search);
const defaultResourceName = urlParams.get('name');

// Load structure.json
fetch('/api/v1/trade/structure.json')
    .then(response => response.json())
    .then(data => {
        const resourceSelect = document.getElementById('resourceSelect');
        resourceSelect.innerHTML = '';

        let selectedUrl = '/api/v1/trade/csv/601.csv';
        let resourceFound = false;

        Object.keys(data).forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;

            Object.keys(data[group]).forEach(item => {
                const resource = data[group][item];
                const option = document.createElement('option');
                option.value = resource.url;
                option.textContent = item;
                optgroup.appendChild(option);

                resourceMap[resource.url] = item;

                if (defaultResourceName && item.toLowerCase() === defaultResourceName.toLowerCase()) {
                    selectedUrl = resource.url;
                    resourceFound = true;
                }
            });

            resourceSelect.appendChild(optgroup);
        });

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

// Handle chart type selection
document.getElementById('chartTypeToggle').addEventListener('click', function(e) {
    const target = e.target.closest('button[data-chart-type]');
    if (target) {
        const newChartType = target.getAttribute('data-chart-type');
        if (newChartType !== currentChartType) {
            currentChartType = newChartType;
            localStorage.setItem('chartType', currentChartType);

            // Update button states
            document.querySelectorAll('#chartTypeToggle .btn').forEach(btn => {
                btn.classList.remove('active');
            });
            target.classList.add('active');

            // Reinitialize series and reload data
            initializeSeries();
            const dateRange = $('#dateRange').datepicker('getDates');
            if (dateRange.length === 2) {
                const from = Math.min(dateRange[0].getTime() / 1000, dateRange[1].getTime() / 1000);
                const to = Math.max(e.dates[0].getTime() / 1000, e.dates[1].getTime() / 1000);
                loadChartData(currentUrl, from, to);
            } else {
                loadChartData(currentUrl);
            }
        }
    }
});

// Function to get all Monday midnights
function getMondayMidnights(startTime, endTime) {
    const mondays = [];
    const startDate = new Date(startTime * 1000);
    const endDate = new Date(endTime * 1000);

    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
    }

    while (current <= endDate) {
        mondays.push(Math.floor(current.getTime() / 1000));
        current.setDate(current.getDate() + 7);
    }

    return mondays;
}

// Function to load and process CSV data
function loadChartData(url, from, to) {
    document.getElementById('errorMessage').textContent = '';
    document.getElementById('errorMessage').style.display = 'none';

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch CSV: ' + response.statusText);
            return response.text();
        })
        .then(csvText => {
            if (!csvText.trim()) throw new Error('CSV file is empty');

            const lines = csvText.trim().split('\n');
            let data;
            if (currentChartType === 'line') {
                data = lines.map(line => {
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
            } else {
                // For candlestick, aggregate data by day
                const dailyData = {};
                lines.forEach(line => {
                    const [time, price] = line.split(',');
                    if (!time || price === undefined) return;
                    const date = new Date(time);
                    if (isNaN(date)) return;
                    const priceValue = parseFloat(price);
                    if (isNaN(priceValue)) return;

                    const day = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
                    if (!dailyData[day]) {
                        dailyData[day] = {
                            open: priceValue,
                            high: priceValue,
                            low: priceValue,
                            close: priceValue,
                            time: Math.floor(date.getTime() / 1000),
                            count: 1,
                        };
                    } else {
                        dailyData[day].high = Math.max(dailyData[day].high, priceValue);
                        dailyData[day].low = Math.min(dailyData[day].low, priceValue);
                        dailyData[day].close = priceValue;
                        dailyData[day].count++;
                    }
                });
                data = Object.values(dailyData).map(d => ({
                    time: d.time,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));
            }

            let filteredData = data;
            if (from && to) {
                filteredData = data.filter(d => d.time >= from && d.time <= to);
            }

            const prices = currentChartType === 'line' ? filteredData.map(d => d.value) : filteredData.map(d => d.close);
            const maxPrice = prices.length ? Math.max(...prices) : NaN;
            const minPrice = prices.length ? Math.min(...prices) : NaN;
            const avgPrice = prices.length ? prices.reduce((sum, p) => sum + p, 0) / prices.length : NaN;
            const priceRange = prices.length ? maxPrice - minPrice : NaN;

            document.getElementById('maxPrice').textContent = isNaN(maxPrice) ? 'N/A' : maxPrice.toFixed(6);
            document.getElementById('minPrice').textContent = isNaN(minPrice) ? 'N/A' : minPrice.toFixed(6);
            document.getElementById('avgPrice').textContent = isNaN(avgPrice) ? 'N/A' : avgPrice.toFixed(6);
            document.getElementById('priceRange').textContent = isNaN(priceRange) ? 'N/A' : priceRange.toFixed(6);
            document.getElementById('dataPoints').textContent = prices.length;

            if (currentChartType === 'line') {
                if (candlestickSeries) {
                    chart.removeSeries(candlestickSeries);
                    candlestickSeries = null;
                }
                if (lineSeries) {
                    chart.removeSeries(lineSeries);
                }
                lineSeries = chart.addLineSeries({
                    color: '#007bff',
                    lineWidth: 2,
                    priceFormat: {
                        type: 'price',
                        precision: 5,
                        minMove: 0.00001,
                    },
                });
                lineSeries.setData(filteredData);
            } else {
                if (lineSeries) {
                    chart.removeSeries(lineSeries);
                    lineSeries = null;
                }
                if (candlestickSeries) {
                    chart.removeSeries(candlestickSeries);
                }
                candlestickSeries = chart.addCandlestickSeries({
                    upColor: '#28a745',
                    downColor: '#dc3545',
                    borderVisible: false,
                    wickUpColor: '#28a745',
                    wickDownColor: '#dc3545',
                    priceFormat: {
                        type: 'price',
                        precision: 5,
                        minMove: 0.00001,
                    },
                });
                candlestickSeries.setData(filteredData);
            }

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

            if (currentChartType === 'line') {
                lineSeries.setMarkers(markers);
            } else {
                candlestickSeries.setMarkers(markers);
            }

            weekLines.forEach(s => chart.removeSeries(s));
            weekLines = [];
            if (filteredData.length) {
                const firstTs = filteredData[0].time * 1000;
                const lastTs = filteredData[filteredData.length - 1].time * 1000;

                const firstDate = new Date(firstTs);
                const firstUTCDate = new Date(Date.UTC(
                    firstDate.getUTCFullYear(),
                    firstDate.getUTCMonth(),
                    firstDate.getUTCDate()
                ));
                const offsetToMonday = (8 - firstUTCDate.getUTCDay()) % 7;
                let firstMonday = new Date(firstUTCDate.getTime() + offsetToMonday * 24 * 60 * 60 * 1000);

                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                for (let d = firstMonday.getTime(); d <= lastTs; d += 7 * 24 * 60 * 60 * 1000) {
                    const mondayTimestamp = Math.floor(d / 1000);
                    const vertSeries = chart.addLineSeries({
                        color: currentTheme === 'dark' ? '#3d8bfd' : '#20b2aa',
                        lineWidth: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                        priceScaleId: '',
                        scaleMargins: { top: 0, bottom: 0 },
                    });
                    vertSeries.setData([
                        { time: mondayTimestamp, value: minPrice },
                        { time: mondayTimestamp, value: maxPrice },
                    ]);
                    weekLines.push(vertSeries);
                }
            }

            // Add average price line if valid
            if (!isNaN(avgPrice)) {
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                const priceLineOptions = {
                    price: avgPrice,
                    color: currentTheme === 'dark' ? '#3d8bfd' : '#007bff',
                    lineWidth: 2,
                    lineStyle: LightweightCharts.LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: 'Avg: ' + avgPrice.toFixed(6),
                };
                if (currentChartType === 'line') {
                    lineSeries.createPriceLine(priceLineOptions);
                } else {
                    candlestickSeries.createPriceLine(priceLineOptions);
                }
            }

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

// Initialize chart type buttons based on saved preference
document.querySelectorAll('#chartTypeToggle .btn').forEach(btn => {
    const chartType = btn.getAttribute('data-chart-type');
    if (chartType === currentChartType) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
});

$(document).ready(function() {
    initializeTheme();
    $('#themeToggle').on('click', toggleTheme);
});

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
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