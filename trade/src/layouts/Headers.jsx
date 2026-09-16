import {
  ActionIcon,
  AppShell,
  Group,
  Text,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function Header() {
  const computedColorScheme = useComputedColorScheme("dark");
  const { setColorScheme } = useMantineColorScheme();
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const resetLaunchState = () => setIsLaunching(false);
    window.addEventListener("pageshow", resetLaunchState);

    return () => window.removeEventListener("pageshow", resetLaunchState);
  }, []);

  const launchSflWorld = () => {
    if (isLaunching) return;
    setIsLaunching(true);
  };

  return (
    <AppShell.Header>
      <Group
        h="100%"
        px={{ base: "sm", sm: "lg" }}
        justify="space-between"
        wrap="nowrap"
      >
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <motion.button
            type="button"
            aria-label="Open SFL.WORLD"
            disabled={isLaunching}
            onClick={launchSflWorld}
            whileHover={{ scale: 1.15, rotate: 12 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: "transparent",
              border: 0,
              cursor: isLaunching ? "default" : "pointer",
              display: "flex",
              padding: 0,
            }}
          >
            <motion.img
              src="https://sfl.world/favicon.ico"
              alt=""
              height={42}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>

          <Title
            order={3}
            size={{ base: "1rem", sm: "1.25rem" }}
            lineClamp={1}
            style={{ minWidth: 0 }}
          >
            SFL.WORLD / Price History
          </Title>
          <Text c="dimmed" size="xs" visibleFrom="sm">
            v2.0
          </Text>
        </Group>

        <Tooltip
          label={
            computedColorScheme === "dark"
              ? "Use light theme"
              : "Use dark theme"
          }
        >
          <ActionIcon
            aria-label={
              computedColorScheme === "dark"
                ? "Use light theme"
                : "Use dark theme"
            }
            variant="default"
            size="lg"
            onClick={() =>
              setColorScheme(computedColorScheme === "dark" ? "light" : "dark")
            }
          >
            {computedColorScheme === "dark" ? (
              <IconSun size={18} />
            ) : (
              <IconMoon size={18} />
            )}
          </ActionIcon>
        </Tooltip>
      </Group>
      <AnimatePresence>
        {isLaunching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(0, 0, 0, 0.72)",
              inset: 0,
              position: "fixed",
              zIndex: 1000,
            }}
          >
            <motion.img
              src="https://sfl.world/favicon.ico"
              alt="Opening SFL.WORLD"
              initial={{
                left: 20,
                top: 10,
                scale: 1,
                rotate: 0,
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                left: "50%",
                top: "50%",
                scale: [1, 2, 8, 0],
                rotate: 1440,
                x: "-50%",
                y: "-50%",
                opacity: [1, 1, 1, 0],
              }}
              transition={{ duration: 1.8, ease: [0.12, 0.8, 0.18, 1] }}
              onAnimationComplete={() => {
                setIsLaunching(false);
                window.setTimeout(
                  () => window.location.assign("https://sfl.world"),
                  220,
                );
              }}
              style={{ height: 42, position: "absolute" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell.Header>
  );
}
