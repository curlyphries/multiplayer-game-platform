import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import logger from '../utils/logger';

const LogViewer = ({ open, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (open) {
      refreshLogs();
    }
  }, [open]);

  useEffect(() => {
    filterLogs();
  }, [logs, levelFilter, searchTerm]);

  const refreshLogs = () => {
    const allLogs = logger.getLogs(null, 500);
    const logStats = logger.getLogStats();
    setLogs(allLogs);
    setStats(logStats);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    logger.exportLogs();
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs();
      refreshLogs();
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatData = (data) => {
    if (!data || Object.keys(data).length === 0) return null;
    return JSON.stringify(data, null, 2);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Application Logs</Typography>
          <Box>
            <IconButton onClick={refreshLogs} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={handleExport} size="small">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={handleClearLogs} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Stats Summary */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Session:</strong> {stats.sessionDuration ? Math.round(stats.sessionDuration / 1000 / 60) : 0} minutes | 
            <strong> Total Logs:</strong> {stats.total || 0} | 
            <strong> Errors:</strong> {stats.byLevel?.error || 0} | 
            <strong> Warnings:</strong> {stats.byLevel?.warn || 0}
          </Typography>
        </Alert>

        {/* Filters */}
        <Box display="flex" gap={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={levelFilter}
              label="Level"
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            sx={{ flexGrow: 1 }}
          />
        </Box>

        {/* Log Entries */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No logs found
            </Typography>
          ) : (
            filteredLogs.map((log, index) => (
              <Accordion key={log.id || index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    <Chip 
                      label={log.level.toUpperCase()} 
                      color={getLevelColor(log.level)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {log.message}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>URL:</strong> {log.url}
                    </Typography>
                    {formatData(log.data) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Data:</strong>
                        </Typography>
                        <Box 
                          component="pre" 
                          sx={{ 
                            backgroundColor: 'grey.100', 
                            p: 1, 
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 200
                          }}
                        >
                          {formatData(log.data)}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogViewer;
