import { Anchor, AppShell, Group, Text, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconBuildingCottage, IconBrandGithub } from "@tabler/icons-react";

export default function Footer() {
  const isSmallScreen = useMediaQuery("(max-width: 400px)");

  return (
    <AppShell.Footer>
      <Group
        h="100%"
        px={{ base: "sm", sm: "lg" }}
        justify="space-between"
        wrap="wrap"
        gap="xs"
      >
        <Group gap={6}>
          <IconBuildingCottage size={16} color="var(--mantine-color-teal-5)" />
          <Text size="sm" c="dimmed">
            Made by &quot;
            <Tooltip label="Care to help?">
              <Anchor
                href="https://sunflower-land.com/play/#/visit/647773264037829"
                target="_blank"
                rel="noopener noreferrer"
              >
                nameless00
              </Anchor>
            </Tooltip>
            &quot;
          </Text>
        </Group>

        <Group gap="md" wrap="wrap" justify="center">
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} SFL.WORLD
          </Text>
          <Anchor
            href="https://github.com/SFL-world"
            target="_blank"
            size="sm"
            c="dimmed"
            underline="hover"
            aria-label="SFL.WORLD on GitHub"
          >
            <Group gap={5} wrap="nowrap">
              <IconBrandGithub size={16} />
              {!isSmallScreen && <span>GitHub</span>}
            </Group>
          </Anchor>
        </Group>
      </Group>
    </AppShell.Footer>
  );
}
