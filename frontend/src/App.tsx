import * as React from "react";
import './styles/App.css';
import axios from 'axios';
import { Button } from '@nextui-org/react';


function App() {

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

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
    <div className="App">
      <Button
        onPress={handleGenerateReport}
        radius="full"
        className="btn-gradient"
        isLoading={loading}
      >
        Generate Report
      </Button>
    </div>
  );
}

export default App;
