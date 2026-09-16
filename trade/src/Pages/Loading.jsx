import { Center } from "@mantine/core";
import { motion } from "motion/react";

export default function LoadingPage() {
  return (
    <Center pos="fixed" inset={0} style={{ zIndex: 10 }}>
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "3px solid var(--mantine-color-dark-4)",
          borderTopColor: "var(--mantine-color-teal-5)",
        }}
      />
    </Center>
  );
}
