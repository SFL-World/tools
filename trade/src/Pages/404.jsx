import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconHome, IconMoodConfuzed } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Center h="100%" mih="70vh">
      <Stack align="center" gap="lg">
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <IconMoodConfuzed size={72} stroke={1.4} />
        </motion.div>

        <Stack align="center" gap={4}>
          <Title order={1} fz={{ base: 64, sm: 80 }} fw={800}>
            404
          </Title>

          <Title order={3}>Page not found</Title>

          <Text c="dimmed" ta="center" maw={420}>
            The page you are looking for does not exist or may have been moved.
          </Text>
        </Stack>

        <Button
          leftSection={<IconHome size={17} />}
          onClick={() => navigate("/")}
        >
          Back to dashboard
        </Button>
      </Stack>
    </Center>
  );
}
