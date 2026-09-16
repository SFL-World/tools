import { AppShell } from "@mantine/core";
import Header from "../layouts/Headers.jsx";
import Body from "../layouts/Body.jsx";
import Footer from "../layouts/Footer.jsx";

export default function Home() {
  return (
    <AppShell
      header={{ height: { base: 58, sm: 64 } }}
      padding="md"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <AppShell.Main style={{ flex: 1, minHeight: 0 }}>
        <Body />
      </AppShell.Main>
      <Footer />
    </AppShell>
  );
}
