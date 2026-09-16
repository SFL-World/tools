import { useState } from "react";
import PriceChart from "../components/common/charts/PriceChart.jsx";
import ChartLegend from "../components/common/charts/ChartLegend.jsx";
import ResourceSelect from "../components/common/ResourceSelect.jsx";
import { useGetData, useGetList } from "../hooks/useResources.query.js";
import LoadingPage from "../Pages/Loading.jsx";
import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  Image,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { formatResourceOptions } from "../services/FormatData.js";
import icons from "../assets/image_paths.json";
import { useDisclosure } from "@mantine/hooks";
import { LINE_SERIES_COLORS, SMA_COLOR } from "../styles/chart.style.js";

function ResourceSection({ label, children }) {
  return (
    <Stack gap={4}>
      <Group gap="sm" wrap="nowrap">
        <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
        <Divider style={{ flex: 1 }} />
      </Group>
      <Stack gap={2}>{children}</Stack>
    </Stack>
  );
}

export default function Body() {
  const [resource, setResource] = useState({
    value: "201",
    label: "Sunflower",
  });

  const [chartPeriod, setChartPeriod] = useState("1M");
  const [chartType, setChartType] = useState("l");
  const [currency, setCurrency] = useState("flower");
  const [showSma, setShowSma] = useState(false);
  const [showSeasons, setShowSeasons] = useState(true);
  const [toolsVisible, setToolsVisible] = useState(true);
  const [compareSearch, setCompareSearch] = useState("");
  const [compareResources, setCompareResources] = useState([]);
  const { data, isLoading: isLoadingList } = useGetList();
  const { isLoading } = useGetData(resource.value);
  const [opened, { open, close }] = useDisclosure(false);

  if (isLoading || isLoadingList) return <LoadingPage />;

  const formattedList = formatResourceOptions(data);

  const items = formattedList.flatMap((group) => group.items);

  const iconMap = new Map(
    icons.map((icon) => [icon.name.toLowerCase(), icon.path]),
  );
  const filteredCompareItems = compareSearch.trim()
    ? items.filter((item) =>
        item.label.toLowerCase().includes(compareSearch.trim().toLowerCase()),
      )
    : items;
  const chartSeries = [
    ...[resource, ...compareResources].map((item, index) => ({
      ...item,
      color: LINE_SERIES_COLORS[index],
      icon: iconMap.get(item.label.toLowerCase()),
    })),
    ...(showSma ? [{ color: SMA_COLOR, label: "SMA 7", value: "sma" }] : []),
  ];

  const toggleCompareResource = (item) => {
    const isSelected = compareResources.some(
      (selected) => selected.value === item.value,
    );

    setCompareResources((selected) => {
      const isCurrentlySelected = selected.some(
        (resource) => resource.value === item.value,
      );

      if (isCurrentlySelected) {
        return selected.filter((resource) => resource.value !== item.value);
      }

      return selected.length < 4 ? [...selected, item] : selected;
    });

    if (!isSelected && compareResources.length < 4) {
      setCompareSearch("");
      setShowSma(false);
    }
  };

  const selectChartResource = (item) => {
    setResource(item);
    setCompareResources([]);
  };

  const renderResourceOption = (item) => {
    const isSelected = compareResources.some(
      (selected) => selected.value === item.value,
    );
    const icon = iconMap.get(item.label.toLowerCase());

    return (
      <UnstyledButton
        key={item.value}
        onClick={() => toggleCompareResource(item)}
        aria-pressed={isSelected}
        disabled={!isSelected && compareResources.length === 4}
        style={{
          borderRadius: 6,
          color: "var(--mantine-color-text)",
          opacity: !isSelected && compareResources.length === 4 ? 0.45 : 1,
          padding: "8px 8px",
          textAlign: "left",
          width: "100%",
        }}
      >
        <Group gap="sm" wrap="nowrap">
          {icon ? (
            <Image src={icon} w={22} h={22} fit="contain" />
          ) : (
            <Box w={22} h={22} />
          )}
          <Text size="sm" fw={600} lineClamp={1}>
            {item.label}
          </Text>
        </Group>
      </UnstyledButton>
    );
  };

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={
            toolsVisible ? (
              <IconChevronUp size={16} />
            ) : (
              <IconChevronDown size={16} />
            )
          }
          onClick={() => setToolsVisible((visible) => !visible)}
        >
          {toolsVisible ? "Hide controls" : "Show controls"}
        </Button>
      </Group>

      <Collapse in={toolsVisible}>
        <Paper p={{ base: "sm", sm: "md" }} radius="sm" withBorder>
          <Stack gap="sm">
            <SimpleGrid
              cols={
                chartType === "l"
                  ? { base: 1, xs: 2, lg: 4 }
                  : { base: 1, xs: 2, lg: 3 }
              }
              spacing="sm"
            >
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" fw={600} mb={5}>
                  Resource
                </Text>
                <ResourceSelect
                  ariaLabel="Select chart resource"
                  data={formattedList}
                  iconMap={iconMap}
                  items={items}
                  onResourceChange={selectChartResource}
                  resource={resource}
                />
              </Box>

              <Box style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" fw={600} mb={5}>
                  Chart type
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { label: "Line", value: "l" },
                    { label: "Candles", value: "c" },
                  ]}
                  value={chartType}
                  onChange={setChartType}
                />
              </Box>

              {chartType === "l" && (
                <Box style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed" fw={600} mb={5}>
                    Range
                  </Text>
                  <SegmentedControl
                    fullWidth
                    data={["24H", "7D", "1M", "Max"]}
                    value={chartPeriod}
                    onChange={setChartPeriod}
                  />
                </Box>
              )}

              <Box style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" fw={600} mb={5}>
                  Display currency
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { label: "FLOWER", value: "flower" },
                    { label: "USD", value: "usd" },
                  ]}
                  value={currency}
                  onChange={setCurrency}
                />
              </Box>
            </SimpleGrid>

            {chartType === "l" && (
              <>
                <Group
                  justify="space-between"
                  align="center"
                  wrap="wrap"
                  gap="sm"
                >
                  <Group gap="md">
                    <Switch
                      checked={showSma}
                      disabled={compareResources.length > 0}
                      label="SMA (7 periods)"
                      onChange={(event) =>
                        setShowSma(event.currentTarget.checked)
                      }
                    />
                    <Switch
                      checked={showSeasons}
                      label="Seasons"
                      onChange={(event) =>
                        setShowSeasons(event.currentTarget.checked)
                      }
                    />
                  </Group>

                  <Button variant="default" onClick={open}>
                    Compare
                  </Button>
                </Group>

                <Modal
                  opened={opened}
                  onClose={close}
                  withCloseButton={false}
                  centered
                  size={690}
                  padding="xl"
                  radius="md"
                >
                  <Stack gap="lg">
                    <ResourceSelect
                      aria-label="Search resources to compare"
                      clearAfterSelect
                      data={formattedList}
                      iconMap={iconMap}
                      items={items}
                      onResourceChange={toggleCompareResource}
                      onSearchValueChange={setCompareSearch}
                      placeholder="Search Resources"
                      searchValue={compareSearch}
                      withDropdown={false}
                    />

                    <ResourceSection label="Selected Resources">
                      <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="sm">
                        {Array.from({ length: 4 }, (_, index) => {
                          const selected = compareResources[index];
                          const selectedIcon =
                            selected &&
                            iconMap.get(selected.label.toLowerCase());

                          return (
                            <Box
                              key={selected?.value ?? `empty-${index}`}
                              h={48}
                              px="xs"
                              style={{
                                alignItems: "center",
                                border:
                                  "1px dashed var(--mantine-color-gray-5)",
                                borderRadius: 8,
                                display: "flex",
                                justifyContent: "center",
                                minWidth: 0,
                              }}
                            >
                              {selected ? (
                                <Group
                                  gap={5}
                                  wrap="nowrap"
                                  style={{ minWidth: 0 }}
                                >
                                  {selectedIcon && (
                                    <Image
                                      src={selectedIcon}
                                      w={18}
                                      h={18}
                                      fit="contain"
                                    />
                                  )}
                                  <Text
                                    size="xs"
                                    fw={600}
                                    lineClamp={1}
                                    style={{ flex: 1 }}
                                  >
                                    {selected.label}
                                  </Text>
                                  <ActionIcon
                                    aria-label={`Remove ${selected.label}`}
                                    color="gray"
                                    variant="subtle"
                                    size="sm"
                                    onClick={() =>
                                      toggleCompareResource(selected)
                                    }
                                  >
                                    <IconX size={14} />
                                  </ActionIcon>
                                </Group>
                              ) : (
                                <IconPlus
                                  size={20}
                                  color="var(--mantine-color-dimmed)"
                                />
                              )}
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    </ResourceSection>

                    <ScrollArea h={300} offsetScrollbars>
                      <Stack gap={2}>
                        {filteredCompareItems.map(renderResourceOption)}
                      </Stack>
                    </ScrollArea>

                    <Box
                      mt="auto"
                      pt="sm"
                      style={{
                        borderTop:
                          "1px solid var(--mantine-color-default-border)",
                      }}
                    >
                      <Group justify="flex-end">
                        <Button variant="default" onClick={close}>
                          Cancel
                        </Button>
                        <Button onClick={close}>Done</Button>
                      </Group>
                    </Box>
                  </Stack>
                </Modal>
              </>
            )}
          </Stack>
        </Paper>
      </Collapse>

      {chartType === "l" && (compareResources.length > 0 || showSma) && (
        <ChartLegend series={chartSeries} />
      )}

      <PriceChart
        resource={resource.value}
        resourceLabel={resource.label}
        compareResources={compareResources}
        chartPeriod={chartPeriod}
        chartType={chartType}
        currency={currency}
        showSma={showSma}
        showSeasons={showSeasons}
        smaPeriod={7}
      />
    </Stack>
  );
}
