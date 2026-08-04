"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import BlockIcon from "@mui/icons-material/Block";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

interface RoleData {
  id: number;
  name: string;
  permissions: string[];
}

interface ActivationKeyData {
  id: number;
  code: string;
  roleName: string;
  maxUses: number;
  useCount: number;
  revoked: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const AdminKeysPage = () => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [keys, setKeys] = useState<ActivationKeyData[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleId, setRoleId] = useState<string>("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [copiedMessage, setCopiedMessage] = useState("");

  const loadKeys = async () => {
    const res = await fetch("/api/admin/keys");
    if (res.ok) setKeys(await res.json());
  };

  useEffect(() => {
    const init = async () => {
      const resMe = await fetch("/api/user/me");
      const me = resMe.ok ? await resMe.json() : undefined;

      if (!me?.permissions?.includes("MANAGE_KEYS")) {
        setAuthorized(false);
        router.replace("/profile");
        return;
      }
      setAuthorized(true);

      const resRoles = await fetch("/api/admin/roles");
      if (resRoles.ok) {
        const roleList: RoleData[] = await resRoles.json();
        setRoles(roleList);
        if (roleList.length > 0) setRoleId(String(roleList[0].id));
      }

      await loadKeys();
      setLoading(false);
    };
    init();
  }, [router]);

  const handleGenerate = async () => {
    if (!roleId) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: Number(roleId),
          maxUses: Number(maxUses) || 1,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const body = await res.json().catch(() => undefined);

      if (!res.ok) {
        setGenerateError(body?.error ?? "Failed to generate key.");
        return;
      }

      await loadKeys();
      await navigator.clipboard.writeText(body.code).catch(() => undefined);
      setCopiedMessage(`Key generated and copied to clipboard: ${body.code}`);
    } catch {
      setGenerateError("Failed to generate key. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    const res = await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
    if (res.ok) await loadKeys();
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => undefined);
    setCopiedMessage(`Copied: ${code}`);
  };

  if (authorized === false) return null;

  return (
    <Container maxWidth="md" sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
        Activation Keys
      </Typography>

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
              Generate a new key
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Max uses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                sx={{ width: 120 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                label="Expires at (optional)"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button
                onClick={handleGenerate}
                variant="contained"
                startIcon={<VpnKeyIcon />}
                loading={generating}
                disabled={!roleId}
                sx={{ height: 56 }}
              >
                Generate
              </Button>
            </Stack>
            {generateError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {generateError}
              </Alert>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Uses</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keys.map((key) => {
                    const expired = key.expiresAt ? new Date(key.expiresAt) < new Date() : false;
                    const exhausted = key.useCount >= key.maxUses;
                    const status = key.revoked
                      ? "Revoked"
                      : expired
                      ? "Expired"
                      : exhausted
                      ? "Exhausted"
                      : "Active";

                    return (
                      <TableRow key={key.id}>
                        <TableCell sx={{ fontFamily: "monospace" }}>{key.code}</TableCell>
                        <TableCell>{key.roleName}</TableCell>
                        <TableCell>
                          {key.useCount} / {key.maxUses}
                        </TableCell>
                        <TableCell>
                          {key.expiresAt ? new Date(key.expiresAt).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell>{status}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Copy code">
                            <IconButton size="small" onClick={() => handleCopy(key.code)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!key.revoked && (
                            <Tooltip title="Revoke">
                              <IconButton size="small" onClick={() => handleRevoke(key.id)}>
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {keys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ py: 2, textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            No activation keys yet.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      <Snackbar
        open={!!copiedMessage}
        autoHideDuration={4000}
        onClose={() => setCopiedMessage("")}
        message={copiedMessage}
      />
    </Container>
  );
};

export default AdminKeysPage;
