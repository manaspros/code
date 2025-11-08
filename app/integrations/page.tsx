"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, AppBar, Toolbar, Button, IconButton } from "@mui/material";
import IntegrationManager from "@/components/IntegrationManager";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";

export default function IntegrationsPage() {
  const { user, loading, signOut } = useFirebaseAuth();
  const router = useRouter();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* Top Navigation */}
      <AppBar position="static" sx={{ backgroundColor: "#667eea" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Collegiate Inbox Navigator
          </Typography>
          <Button color="inherit" component={Link} href="/integrations">
            Integrations
          </Button>
          <Button color="inherit" component={Link} href="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} href="/inbox">
            Inbox
          </Button>
          <IconButton color="inherit" onClick={signOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <IntegrationManager />
      </Container>
    </Box>
  );
}
