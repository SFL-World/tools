/* -----------------------------------------------------------------------
 *  Lightweight Charts price-history viewer
 *  - Line & Candlestick modes
 *  - Weekly vertical lines
 *  - Min/Max markers
 *  - Average price line
 *  - Dark / Light theme support
 *  - Resource selector + date range picker
 * ----------------------------------------------------------------------- */

// Verify that the charting library is loaded
if (typeof LightweightCharts === 'undefined') {
    showError('Error: Lightweight Charts library failed to load.');
    throw new Error('LightweightCharts not loaded');
}

/* --------------------------- Global state --------------------------- */
let weekLines = [];                     // vertical line series (one per Monday)
let currentChartType = localStorage.getItem('chartType') || 'line';
let lineSeries = null;
let candlestickSeries = null;
let currentUrl = '/api/v1/trade/csv/601.csv';
let resourceMap = {};                   // url → human-readable name

/* --------------------------- DOM references -------------------------- */
const chartContainer = document.getElementById('chart');
const errorMessage   = document.getElementById('errorMessage');
const exportBtn      = document.getElementById('exportPngBtn');

/* --------------------------- Chart creation -------------------------- */
const chart = LightweightCharts.createChart(chartContainer, {
    width:  chartContainer.clientWidth,
    height: 600,
    layout: { background: { color: '#ffffff' }, textColor: '#333' },
    grid:   { vertLines: { color: '#e9ecef' }, horzLines: { color: '#e9ecef' } },
    timeScale: { timeVisible: true, secondsVisible: false },
    rightPriceScale: { borderColor: '#e9ecef' },
});

/* --------------------------- Utility functions ---------------------- */
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
}
function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}
function getActiveSeries() {
    return currentChartType === 'line' ? lineSeries : candlestickSeries;
}
function removeSeries(series) {
    if (series) chart.removeSeries(series);
}

/* --------------------------- Series management ---------------------- */
function createSeries(type) {
    // Remove any existing series
    removeSeries(lineSeries);
    removeSeries(candlestickSeries);
    lineSeries = candlestickSeries = null;

    const baseOpts = {
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
    };

    if (type === 'line') {
        lineSeries = chart.addLineSeries({ ...baseOpts, color: '#007bff', lineWidth: 2 });
    } else {
        candlestickSeries = chart.addCandlestickSeries({
            ...baseOpts,
            upColor: '#28a745', downColor: '#dc3545',
            borderVisible: false,
            wickUpColor: '#28a745', wickDownColor: '#dc3545',
        });
    }
}

/* --------------------------- Theme handling ------------------------- */
function updateChartTheme(theme) {
    const isDark = theme === 'dark';
    chart.applyOptions({
        layout: { background: { color: isDark ? '#1a1a1a' : '#ffffff' }, textColor: isDark ? '#e9ecef' : '#333' },
        grid:   { vertLines: { color: isDark ? '#2a2a2a' : '#e9ecef' }, horzLines: { color: isDark ? '#2a2a2a' : '#e9ecef' } },
        rightPriceScale: { borderColor: isDark ? '#2a2a2a' : '#e9ecef' },
    });

    const lineColor      = isDark ? '#3d8bfd' : '#007bff';
    const weekLineColor  = isDark ? '#3d8bfd' : '#20b2aa';

    if (lineSeries)      lineSeries.applyOptions({ color: lineColor });
    if (candlestickSeries) candlestickSeries.applyOptions({
        upColor: '#28a745', downColor: '#dc3545',
        wickUpColor: '#28a745', wickDownColor: '#dc3545',
    });

    // Update colour of already-drawn weekly lines
    weekLines.forEach(s => s.applyOptions({ color: weekLineColor }));
}

// Observe HTML attribute changes (Bootstrap theme toggle)
new MutationObserver(() => updateChartTheme(document.documentElement.getAttribute('data-bs-theme')))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

updateChartTheme(localStorage.getItem('theme') || 'light');

/* --------------------------- Datepicker ----------------------------- */
$('#dateRange').datepicker({
    format: 'yyyy-mm-dd',
    range: true,
    multidate: 2,
    todayHighlight: true,
}).on('changeDate', e => {
    if (e.dates.length === 2) {
        const [d1, d2] = e.dates;
        const from = Math.min(d1.getTime(), d2.getTime()) / 1000;
        const to   = Math.max(d1.getTime(), d2.getTime()) / 1000;
        loadChartData(currentUrl, from, to);
    }
});

/* --------------------------- Load structure.json -------------------- */
fetch('/api/v1/trade/structure.json')
    .then(r => r.json())
    .then(data => {
        const select = document.getElementById('resourceSelect');
        select.innerHTML = '';

        const urlParams   = new URLSearchParams(window.location.search);
        const defaultName = urlParams.get('name');
        let selectedUrl   = currentUrl;
        let found         = false;

        Object.entries(data).forEach(([group, items]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;

            Object.entries(items).forEach(([name, { url }]) => {
                const opt = document.createElement('option');
                opt.value = url;
                opt.textContent = name;
                optgroup.appendChild(opt);
                resourceMap[url] = name;

                if (defaultName && name.toLowerCase() === defaultName.toLowerCase()) {
                    selectedUrl = url;
                    found = true;
                }
            });
            select.appendChild(optgroup);
        });

        select.value = selectedUrl;
        currentUrl   = selectedUrl;

        if (!found && defaultName) {
            showError(`Resource "${defaultName}" not found. Defaulting to Wood.`);
        }

        loadChartData(currentUrl);
    })
    .catch(err => showError('Error loading structure.json: ' + err.message));

/* --------------------------- Resource selector ---------------------- */
document.getElementById('resourceSelect').addEventListener('change', function () {
    currentUrl = this.value;
    const name = resourceMap[currentUrl] || 'Unknown';
    const url  = new URL(window.location);
    url.searchParams.set('name', name);
    window.history.pushState({}, '', url);

    const dates = $('#dateRange').datepicker('getDates');
    if (dates.length === 2) {
        const from = Math.min(dates[0].getTime(), dates[1].getTime()) / 1000;
        const to   = Math.max(dates[0].getTime(), dates[1].getTime()) / 1000;
        loadChartData(currentUrl, from, to);
    } else {
        loadChartData(currentUrl);
    }
});

/* --------------------------- Chart-type toggle ---------------------- */
document.getElementById('chartTypeToggle').addEventListener('click', e => {
    const btn = e.target.closest('button[data-chart-type]');
    if (!btn) return;

    const newType = btn.dataset.chartType;
    if (newType === currentChartType) return;

    currentChartType = newType;
    localStorage.setItem('chartType', newType);

    document.querySelectorAll('#chartTypeToggle .btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    createSeries(newType);
    loadChartData(currentUrl);
});

/* --------------------------- Markers -------------------------------- */
function createMarkers(filteredData, prices, maxPrice, minPrice) {
    const markers = [];
    let maxCandle = null, minCandle = null;

    if (currentChartType === 'line') {
        const maxIdx = prices.indexOf(maxPrice);
        const minIdx = prices.indexOf(minPrice);
        if (maxIdx !== -1) maxCandle = filteredData[maxIdx];
        if (minIdx !== -1) minCandle = filteredData[minIdx];
    } else {
        filteredData.forEach(c => {
            if (!maxCandle || c.high > maxCandle.high) maxCandle = c;
            if (!minCandle || c.low  < minCandle.low)  minCandle = c;
        });
    }

    if (maxCandle) {
        markers.push({
            time: maxCandle.time,
            position: 'aboveBar',
            color: '#dc3545',
            shape: 'arrowDown',
            text: `Max: ${maxPrice.toFixed(6)}`,
        });
    }
    if (minCandle) {
        markers.push({
            time: minCandle.time,
            position: 'belowBar',
            color: '#28a745',
            shape: 'arrowUp',
            text: `Min: ${minPrice.toFixed(6)}`,
        });
    }
    return markers;
}

/* --------------------------- Weekly vertical lines ----------------- */
function drawWeekLines(filteredData, minPrice, maxPrice) {
    weekLines.forEach(s => chart.removeSeries(s));
    weekLines = [];

    if (filteredData.length === 0 || isNaN(minPrice) || isNaN(maxPrice)) return;

    const firstTs = filteredData[0].time * 1000;
    const lastTs  = filteredData[filteredData.length - 1].time * 1000;

    const firstDate = new Date(firstTs);
    const utcDate   = new Date(Date.UTC(firstDate.getUTCFullYear(),
        firstDate.getUTCMonth(),
        firstDate.getUTCDate()));
    const offset    = (8 - utcDate.getUTCDay()) % 7;
    let monday      = new Date(utcDate.getTime() + offset * 86400000);

    const theme = document.documentElement.getAttribute('data-bs-theme');
    const color = theme === 'dark' ? '#3d8bfd' : '#20b2aa';

    for (let d = monday.getTime(); d <= lastTs; d += 7 * 86400000) {
        const ts = Math.floor(d / 1000);
        const series = chart.addLineSeries({
            color, lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
            priceScaleId: '',
            scaleMargins: { top: 0, bottom: 0 },
        });
        series.setData([
            { time: ts, value: minPrice },
            { time: ts, value: maxPrice },
        ]);
        weekLines.push(series);
    }
}

/* --------------------------- Average price line -------------------- */
function drawAverageLine(avgPrice) {
    if (isNaN(avgPrice)) return;

    const theme = document.documentElement.getAttribute('data-bs-theme');
    const opts  = {
        price: avgPrice,
        color: theme === 'dark' ? '#3d8bfd' : '#007bff',
        lineWidth: 2,
        lineStyle: LightweightCharts.LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Avg: ${avgPrice.toFixed(6)}`,
    };
    getActiveSeries()?.createPriceLine(opts);
}

/* --------------------------- Statistics UI -------------------------- */
function updateStats(max, min, avg, range, points) {
    document.getElementById('maxPrice').textContent   = isNaN(max) ? 'N/A' : max.toFixed(6);
    document.getElementById('minPrice').textContent   = isNaN(min) ? 'N/A' : min.toFixed(6);
    document.getElementById('avgPrice').textContent   = isNaN(avg) ? 'N/A' : avg.toFixed(6);
    document.getElementById('priceRange').textContent = isNaN(range) ? 'N/A' : range.toFixed(6);
    document.getElementById('dataPoints').textContent = points;
}

/* --------------------------- Core data loader ----------------------- */
function loadChartData(url, from = null, to = null) {
    hideError();

    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error('Failed to fetch CSV: ' + r.statusText);
            return r.text();
        })
        .then(csvText => {
            if (!csvText.trim()) throw new Error('CSV file is empty');

            const lines = csvText.trim().split('\n');
            let data = [];

            // ----- Line mode (raw points) -----
            if (currentChartType === 'line') {
                data = lines.map(line => {
                    const [timeStr, priceStr] = line.split(',');
                    if (!timeStr || priceStr === undefined) throw new Error('Invalid CSV: missing time or price');
                    const date  = new Date(timeStr);
                    if (isNaN(date)) throw new Error('Invalid date in CSV');
                    const price = parseFloat(priceStr);
                    if (isNaN(price)) throw new Error('Invalid price in CSV');
                    return { time: Math.floor(date.getTime() / 1000), value: price };
                });
            }
            // ----- Candlestick mode (daily aggregation) -----
            else {
                const daily = {};
                lines.forEach(line => {
                    const [timeStr, priceStr] = line.split(',');
                    if (!timeStr || priceStr === undefined) return;
                    const date  = new Date(timeStr);
                    if (isNaN(date)) return;
                    const price = parseFloat(priceStr);
                    if (isNaN(price)) return;

                    const day = Math.floor(date.getTime() / 86400000); // ms → day
                    if (!daily[day]) {
                        daily[day] = {
                            open: price, high: price, low: price, close: price,
                            time: Math.floor(date.getTime() / 1000)
                        };
                    } else {
                        daily[day].high  = Math.max(daily[day].high,  price);
                        daily[day].low   = Math.min(daily[day].low,   price);
                        daily[day].close = price;
                    }
                });
                data = Object.values(daily).map(d => ({
                    time: d.time, open: d.open, high: d.high, low: d.low, close: d.close
                }));
            }

            // ----- Date range filter -----
            let filteredData = data;
            if (from && to) {
                filteredData = data.filter(d => d.time >= from && d.time <= to);
            }

            // ----- No data → early exit -----
            if (filteredData.length === 0) {
                updateStats(NaN, NaN, NaN, NaN, 0);
                getActiveSeries()?.setData([]);
                drawWeekLines([], NaN, NaN);
                chart.timeScale().fitContent();
                showError('No data for selected range.');
                return;
            }

            // ----- Price array for statistics -----
            const prices = currentChartType === 'line'
                ? filteredData.map(d => d.value)
                : filteredData.flatMap(d => [d.high, d.low, d.open, d.close]);

            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const range    = maxPrice - minPrice;

            updateStats(maxPrice, minPrice, avgPrice, range, prices.length);

            // ----- (Re)create series & feed data -----
            createSeries(currentChartType);
            getActiveSeries().setData(filteredData);

            // ----- Markers -----
            const markers = createMarkers(filteredData, prices, maxPrice, minPrice);
            getActiveSeries().setMarkers(markers);

            // ----- Weekly lines & average line -----
            drawWeekLines(filteredData, minPrice, maxPrice);
            drawAverageLine(avgPrice);

            chart.timeScale().fitContent();
        })
        .catch(err => showError('Error loading CSV: ' + err.message));
}

/* ----------------------- PNG Export -------------------------- */
function exportToPng() {
    // LightweightCharts provides a hidden canvas – we render the chart there
    chart.resize(chartContainer.clientWidth, 600);
    chart.timeScale().fitContent();

    // Force a redraw
    setTimeout(() => {
        const canvas = chartContainer.querySelector('canvas');
        if (!canvas) {
            showError('Canvas not found for export.');
            return;
        }

        // Create a downloadable link
        canvas.toBlob(blob => {
            const name = resourceMap[currentUrl] || 'chart';
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -4)
            link.download = `${timestamp}-${name.replace(/[^a-z0-9]/gi, '_')}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/png');
    }, 100);
}

/* Attach export button */
if (exportBtn) exportBtn.addEventListener('click', exportToPng);

/* ----------------------- Resize ----------------------------- */
window.addEventListener('resize', () => chart.resize(chartContainer.clientWidth, 600));

/* --------------------------- Chart-type button init ---------------- */
document.querySelectorAll('#chartTypeToggle .btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.chartType === currentChartType);
});


/* --------------------------- Page ready --------------------------- */
$(document).ready(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', saved);
    $('#themeIcon')
        .removeClass('bi-moon bi-brightness-high')
        .addClass(saved === 'dark' ? 'bi-brightness-high' : 'bi-moon');

    /* --------------------------- Theme toggle (Bootstrap) -------------- */
    $('#themeToggle').on('click', () => {
        const cur = document.documentElement.getAttribute('data-bs-theme');
        const nxt = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', nxt);
        localStorage.setItem('theme', nxt);
        $('#themeIcon')
            .removeClass('bi-moon bi-brightness-high')
            .addClass(nxt === 'dark' ? 'bi-brightness-high' : 'bi-moon');
    });
});
