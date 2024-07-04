import React, { useState } from 'react';
import { Button, Typography, CircularProgress, Container, Paper } from '@mui/material';
import axios from 'axios';
import './App.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.get('http://localhost:9221/generate-report');
      setMessage('Report Generated');
    } catch (error) {
      setMessage('Error generating report');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} className="paper">
        <Typography variant="h4" gutterBottom>
          Report Generator
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Report'}
        </Button>
        {message && <Typography variant="body1" className="message">{message}</Typography>}
      </Paper>
    </Container>
  );
};

export default App;
