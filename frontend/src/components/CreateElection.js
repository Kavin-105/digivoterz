import React, { useState } from 'react';
import api from '../services/api';
import { wakeUpServer } from '../utils/serverWakeup';

const CreateElection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Step 1: Wake up server
      setStatus('Connecting to server...');
      await wakeUpServer();

      // Step 2: Create election
      setStatus('Creating election...');
      console.log('Sending election data:', formData);

      const response = await api.post('/api/elections', formData);
      
      console.log('Election creation response:', response.data);
      
      if (response.data.success) {
        setStatus('Election created successfully!');
        alert('Election created successfully!');
        // Reset form or redirect
      } else {
        throw new Error('Election creation failed');
      }

    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setStatus(`Error: ${errorMessage}`);
      alert(`Failed to create election: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Your form fields */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Election'}
        </button>
      </form>
      
      {status && (
        <div className="status-message">
          <p>{status}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-indicator">
          <p>This may take 30-60 seconds on first request...</p>
        </div>
      )}
    </div>
  );
};

export default CreateElection;