import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  LineSeries,
} from "lightweight-charts";
import {
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import {
  useGetDataList,
  useGetFlowerUsdPrice,
} from "../../../hooks/useResources.query.js";
import { FormatMainData, toCandles } from "../../../services/FormatData.js";
import LoadingPage from "../../../Pages/Loading.jsx";
import {
  getPrecision,
  getChartHeight,
  getChartOptions,
  getMinBarSpacing,
  getSeriesOptions,
  getResponsiveOptions,
  LINE_SERIES_COLORS,
  SMA_COLOR,
} from "../../../styles/chart.style.js";
import { getVisibleLogicalRange } from "../../../services/FormatTime.js";
import { getSeason, SEASON_COLORS } from "../../../services/Season.js";
import "./PriceChart.css";

function isValidRange(range) {
  return (
    range &&
    Number.isFinite(range.from) &&
    Number.isFinite(range.to) &&
    range.from <= range.to
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatSma(data, period) {
  return data.flatMap((point, index) => {
    if (index < period - 1) return [];

    const total = data
      .slice(index - period + 1, index + 1)
      .reduce((sum, item) => sum + item.value, 0);

    return [{ time: point.time, value: total / period }];
  });
}

function formatDate(time) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(time * 1000));
}

function getPriceStats(data) {
  if (!data.length) return null;

  const highest = data.reduce(
    (best, point) => (point.value > best.value ? point : best),
    data[0],
  );
  const lowest = data.reduce(
    (best, point) => (point.value < best.value ? point : best),
    data[0],
  );
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const current = data[data.length - 1].value;

  return {
    average: total / data.length,
    current,
    highest,
    lowest,
    points: data.length,
    belowHighest: highest.value
      ? ((highest.value - current) / highest.value) * 100
      : 0,
    aboveLowest: lowest.value
      ? ((current - lowest.value) / lowest.value) * 100
      : 0,
  };
}

function getSeasonBands(data) {
  return data
    .reduce((bands, point, index) => {
      const season = getSeason(new Date(point.time * 1000).toISOString());
      const previousSeason =
        index > 0
          ? getSeason(new Date(data[index - 1].time * 1000).toISOString())
          : null;

      if (season !== previousSeason) {
        bands.push({
          from: index,
          season,
        });
      }

      return bands;
    }, [])
    .map((band, index, bands) => ({
      ...band,
      to: (bands[index + 1]?.from ?? data.length) - 1,
    }));
}

export default function PriceChart({
  resource,
  resourceLabel,
  chartPeriod,
  chartType,
  compareResources = [],
  currency,
  showSma,
  showSeasons,
  smaPeriod,
}) {
  const colorScheme = useComputedColorScheme("dark");
  const resourceIds =
    chartType === "l"
      ? [resource, ...compareResources.map((item) => item.value)]
      : [resource];
  const { data: resourceData, isLoading } = useGetDataList(resourceIds);
  const { data: flowerUsdPrice, isLoading: isLoadingFlowerUsd } =
    useGetFlowerUsdPrice(currency === "usd");
  const mainData = resourceData[0];
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const lastPrecisionRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [seasonBands, setSeasonBands] = useState([]);
  const isSingleResourceLine = chartType === "l" && resourceData.length === 1;
  const statsData = mainData
    ? FormatMainData(mainData).map((point) => ({
        ...point,
        value: currency === "usd" ? point.value * flowerUsdPrice : point.value,
      }))
    : [];
  const priceStats = getPriceStats(statsData);

  useEffect(() => {
    if (
      isLoading ||
      (currency === "usd" && isLoadingFlowerUsd) ||
      !chartContainerRef.current ||
      !mainData
    )
      return;

    const convertValue = (value) =>
      currency === "usd" ? value * flowerUsdPrice : value;
    const data = FormatMainData(mainData).map((point) => ({
      ...point,
      value: convertValue(point.value),
    }));
    if (!data.length) return;

    const container = chartContainerRef.current;
    const initialWidth = container.clientWidth || 300;
    const priceReference = data[data.length - 1].value;
    const initialPrecision = getPrecision(initialWidth, priceReference);
    lastPrecisionRef.current = initialPrecision;
    let range;
    if (chartType === "l") {
      range = getVisibleLogicalRange(chartPeriod, data);
    } else {
      range = getVisibleLogicalRange("Max", toCandles(data));
    }

    const chart = createChart(container, {
      width: initialWidth,
      height: getChartHeight(initialWidth),
      ...getChartOptions(
        initialWidth,
        getMinBarSpacing(initialWidth, range),
        colorScheme,
      ),
    });

    let series;
    let handleCrosshairMove;
    const seasonSegments =
      chartType === "l" && showSeasons ? getSeasonBands(data) : [];

    const updateSeasonBands = () => {
      if (!seasonSegments.length) {
        setSeasonBands([]);
        return;
      }

      const timeScale = chart.timeScale();
      const chartWidth = timeScale.width();
      const positionedBands = seasonSegments.flatMap((band) => {
        const left = timeScale.logicalToCoordinate(band.from);
        const right = timeScale.logicalToCoordinate(band.to + 1);

        if (left === null || right === null) return [];

        const start = Math.max(0, Math.min(left, right));
        const end = Math.min(chartWidth, Math.max(left, right));
        if (end <= start) return [];

        return [
          {
            color: SEASON_COLORS[band.season],
            left: start,
            season: band.season,
            width: end - start,
          },
        ];
      });

      setSeasonBands(positionedBands);
    };

    if (chartType === "l") {
      const seriesMetadata = resourceData.map((rawData, index) => {
        const seriesData = FormatMainData(rawData).map((point) => ({
          ...point,
          value: convertValue(point.value),
        }));
        const lineSeries = chart.addSeries(
          LineSeries,
          getSeriesOptions(
            initialPrecision,
            LINE_SERIES_COLORS[index],
            colorScheme,
          ),
        );
        lineSeries.setData(seriesData);
        if (index === 0) {
          const markers = [];

          if (resourceData.length === 1) {
            const stats = getPriceStats(seriesData);
            markers.push(
              {
                color: "#ef5350",
                position: "aboveBar",
                shape: "arrowDown",
                time: stats.highest.time,
                text: "High",
              },
              {
                color: "#51cf66",
                position: "belowBar",
                shape: "arrowUp",
                time: stats.lowest.time,
                text: "Low",
              },
            );
          }

          if (markers.length) {
            createSeriesMarkers(
              lineSeries,
              markers.sort((first, second) => first.time - second.time),
            );
          }
        }
        if (index === 0 && resourceData.length === 1) {
          const stats = getPriceStats(seriesData);
          lineSeries.createPriceLine({
            axisLabelVisible: true,
            color: SMA_COLOR,
            lineStyle: 2,
            lineWidth: 1,
            price: stats.average,
            title: "Average",
          });
        }
        return {
          color: LINE_SERIES_COLORS[index],
          data: seriesData,
          label:
            index === 0 ? resourceLabel : compareResources[index - 1].label,
          series: lineSeries,
        };
      });
      series = seriesMetadata.map((item) => item.series);

      if (showSma) {
        const smaData = formatSma(data, smaPeriod);
        const smaSeries = chart.addSeries(LineSeries, {
          ...getSeriesOptions(initialPrecision, SMA_COLOR, colorScheme),
          lineStyle: 2,
        });
        smaSeries.setData(smaData);
        series.push(smaSeries);
        seriesMetadata.push({
          color: SMA_COLOR,
          data: smaData,
          label: `SMA ${smaPeriod}`,
          series: smaSeries,
        });
      }

      handleCrosshairMove = (param) => {
        if (!param.point || typeof param.time !== "number") {
          setTooltip(null);
          return;
        }

        const rows = seriesMetadata.flatMap((metadata) => {
          const point = param.seriesData.get(metadata.series);
          const value = point?.value;

          if (typeof value !== "number") return [];

          return [{ color: metadata.color, label: metadata.label, value }];
        });

        if (!rows.length) {
          setTooltip(null);
          return;
        }

        setTooltip({
          left: Math.min(
            Math.max(8, param.point.x + 14),
            Math.max(8, container.clientWidth - 220),
          ),
          rows,
          time: param.time,
          top: Math.min(
            Math.max(8, param.point.y + 14),
            Math.max(
              8,
              getChartHeight(container.clientWidth) - (rows.length * 22 + 32),
            ),
          ),
        });
      };

      chart.subscribeCrosshairMove(handleCrosshairMove);
    } else {
      series = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      series.setData(toCandles(data));
    }

    if (isValidRange(range)) {
      chart.timeScale().setVisibleLogicalRange(range);
    } else {
      chart.timeScale().fitContent();
    }
    updateSeasonBands();
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateSeasonBands);

    chartRef.current = chart;
    seriesRef.current = series;

    let rafId = null;
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width } = entry.contentRect;
        if (!width) return;

        chart.resize(width, getChartHeight(width));
        updateSeasonBands();
        const minBarSpacing = getMinBarSpacing(width, range);
        chart.applyOptions(getResponsiveOptions(width, minBarSpacing));
        const precision = getPrecision(width, priceReference);
        if (precision !== lastPrecisionRef.current) {
          lastPrecisionRef.current = precision;
          const activeSeries = Array.isArray(series) ? series : [series];
          activeSeries.forEach((item) => {
            item.applyOptions({
              priceFormat: {
                type: "price",
                precision: precision.decimals,
                minMove: precision.minMove,
              },
            });
          });
        }
      });
    });

    resizeObserver.observe(container);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateSeasonBands);
      if (handleCrosshairMove)
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [
    chartPeriod,
    chartType,
    compareResources,
    currency,
    colorScheme,
    flowerUsdPrice,
    isLoading,
    isLoadingFlowerUsd,
    mainData,
    resource,
    resourceData,
    resourceLabel,
    showSma,
    showSeasons,
    smaPeriod,
  ]);

  if (isLoading || (currency === "usd" && isLoadingFlowerUsd))
    return <LoadingPage />;

  return (
    <Paper
      p={{ base: 0, sm: "xs" }}
      radius="md"
      withBorder
      className="price-chart"
      style={{ overflow: "hidden", position: "relative" }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        <div
          aria-hidden="true"
          style={{
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            position: "absolute",
            zIndex: 1,
          }}
        >
          {showSeasons &&
            seasonBands.map((band) => (
              <div
                key={`${band.season}-${band.left}`}
                title={band.season}
                style={{
                  background: band.color,
                  borderLeft: `1px solid ${band.color}`,
                  height: "100%",
                  left: band.left,
                  opacity: 0.12,
                  position: "absolute",
                  top: 0,
                  width: band.width,
                }}
              />
            ))}
        </div>
        <div
          id="chart-container"
          ref={chartContainerRef}
          style={{ position: "relative", width: "100%", zIndex: 0 }}
        />
      </div>
      {chartType === "l" && tooltip && (
        <Paper
          p="xs"
          radius="sm"
          shadow="md"
          withBorder
          style={{
            left: tooltip.left,
            pointerEvents: "none",
            position: "absolute",
            top: tooltip.top,
            width: 212,
            zIndex: 1,
          }}
        >
          <Text size="xs" fw={600} mb={4}>
            {formatDate(tooltip.time)}
          </Text>
          <Text size="xs" c="dimmed" mb={4}>
            Season: {getSeason(new Date(tooltip.time * 1000).toISOString())}
          </Text>
          <Stack gap={2}>
            {tooltip.rows.map((item) => (
              <Group key={item.label} gap={5} wrap="nowrap">
                <Box
                  w={8}
                  h={8}
                  style={{
                    background: item.color,
                    borderRadius: "50%",
                    flex: "0 0 auto",
                  }}
                />
                <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                  {item.label}:{" "}
                  <Text component="span" fw={700}>
                    {currency === "usd" ? "$" : ""}
                    {formatPrice(item.value)}
                  </Text>
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}
      {chartType === "l" && priceStats && (
        <Stack gap="sm" p={{ base: "sm", sm: "md" }}>
          <Text fw={700} size="sm">
            Statistics
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {[
              ["Maximum Price", priceStats.highest.value],
              ["Minimum Price", priceStats.lowest.value],
              ["Average Price", priceStats.average],
              [
                "Price Range",
                priceStats.highest.value - priceStats.lowest.value,
              ],
              ["Data Points", priceStats.points],
            ].map(([label, value]) => (
              <Box key={label}>
                <Text size="xs" c="dimmed">
                  {label}
                </Text>
                <Text fw={600} size="sm">
                  {label === "Data Points"
                    ? value.toLocaleString()
                    : `${currency === "usd" ? "$" : ""}${formatPrice(value)}`}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
          {isSingleResourceLine && (
            <Text size="sm" c="dimmed">
              {resourceLabel} reached an all-time high of{" "}
              {currency === "usd" ? "$" : ""}
              {formatPrice(priceStats.highest.value)} and an all-time low of{" "}
              {currency === "usd" ? "$" : ""}
              {formatPrice(priceStats.lowest.value)}. It&apos;s now trading{" "}
              <Text component="span" fw={700}>
                {priceStats.belowHighest.toFixed(2)}% below that peak
              </Text>{" "}
              and{" "}
              <Text component="span" fw={700}>
                {priceStats.aboveLowest.toFixed(2)}% above its lowest price
              </Text>
              .
            </Text>
          )}
        </Stack>
      )}
    </Paper>
  );
}
