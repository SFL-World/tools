import { Box, Group, Image, Text } from "@mantine/core";

export default function ChartLegend({ series }) {
  return (
    <Group gap="md" wrap="wrap" py="sm">
      {series.map((item) => (
        <Group key={item.value} gap={6} wrap="nowrap">
          <Box
            w={10}
            h={10}
            style={{
              background: item.color,
              borderRadius: "50%",
              flex: "0 0 auto",
            }}
          />
          {item.icon && <Image src={item.icon} w={16} h={16} fit="contain" />}
          <Text size="sm" lineClamp={1}>
            {item.label}
          </Text>
        </Group>
      ))}
    </Group>
  );
}
