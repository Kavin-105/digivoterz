import React, { useState, useRef } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Alert, 
  Row, 
  Col, 
  ListGroup, 
  Modal,
  Spinner
} from 'react-bootstrap';
import { electionAPI } from '../services/api';
import * as XLSX from 'xlsx';

const CreateElection = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });
  const [nominees, setNominees] = useState(['']);
  const [voters, setVoters] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [emailValidationOnSubmit, setEmailValidationOnSubmit] = useState(false);
  
  // CSV/Excel upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedVoters, setUploadedVoters] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [domainRestriction, setDomainRestriction] = useState('');

  // Update the validateEmailDomain function
  const validateEmailDomain = (email) => {
    if (!domainRestriction) return true;
    
    const emailLower = email.toLowerCase().trim();
    const restriction = domainRestriction.toLowerCase().trim();

    if (restriction.includes('@')) {
      const [pattern, domain] = restriction.split('@');
      const yearMatch = pattern.match(/\d{2}/);
      const deptMatch = pattern.match(/[a-z]+/);
      
      if (yearMatch && deptMatch) {
        const year = yearMatch[0];
        const dept = deptMatch[0];
        // Updated regex to allow optional dot before pattern
        const fullPattern = new RegExp(`^[a-z]+(\\.)?${year}${dept}@${domain.replace('.', '\\.')}$`);
        return fullPattern.test(emailLower);
      }
      return false;
    } else {
      return emailLower.endsWith(`@${restriction}`);
    }
  };

  const fileInputRef = useRef(null);

  // Helper function to combine date and time
  const combineDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  // Validation functions
  const validateElectionTitle = (title) => {
    if (!title.trim()) {
      return 'Election title is required';
    }
    if (/^\d/.test(title)) {
      return 'Election title should not start with numbers';
    }
    if (!/^[a-zA-Z0-9\s\-_,.!?()]+$/.test(title)) {
      return 'Title should only contain letters, numbers, spaces, and basic punctuation';
    }
    return '';
  };

  const validateDateTime = () => {
    const errors = {};
    const now = new Date();
    const start = combineDateTime(formData.startDate, formData.startTime);
    const end = combineDateTime(formData.endDate, formData.endTime);

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (start && end) {
      if (start <= now) {
        errors.startDate = 'Start date must be in the future';
      }
      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
      // Check minimum duration (5 minutes)
      const minDuration = 5 * 60 * 1000;
      if (end - start < minDuration) {
        errors.endTime = 'Election must run for at least 5 minutes';
      }
    }

    return errors;
  };

  const validateName = (name, fieldName) => {
    if (!name.trim()) {
      return `${fieldName} is required`;
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return `${fieldName} should contain only letters and spaces`;
    }
    if (name.trim().length < 2) {
      return `${fieldName} should be at least 2 characters long`;
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Reset upload modal to fresh state
  const resetUploadModal = () => {
    setUploadedVoters([]);
    setUploadErrors([]);
    setIsUploading(false);
    setDomainRestriction('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setTimeout(() => {
      resetUploadModal();
    }, 300);
  };

  const handleShowUploadModal = () => {
    resetUploadModal();
    setShowUploadModal(true);
  };

  // CSV/Excel upload functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadErrors([]);
    setUploadedVoters([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        processUploadedData(jsonData, file.name);
      } catch (error) {
        setUploadErrors(['Error reading file. Please check the file format.']);
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      setUploadErrors(['Error reading the file. Please try again.']);
      setIsUploading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const processUploadedData = (data, fileName) => {
    const errors = [];
    const validVoters = [];
    const existingEmails = voters.map(v => v.email.toLowerCase());
    const existingNames = voters.map(v => v.name.toLowerCase());
    const uploadedEmails = new Set();
    const uploadedNames = new Set();
    
    data.forEach((row, index) => {
      const lineNumber = index + 2;
      
      try {
        const name = row['Name'] || row['name'] || row['NAME'] || row['Voter Name'] || row['voter name'] || '';
        const email = row['Email'] || row['email'] || row['EMAIL'] || row['Mail'] || row['mail'] || row['Email Address'] || row['email address'] || '';

        if (!name.trim() && !email.trim()) {
          return;
        }

        const rowErrors = [];

        if (!name.trim()) {
          rowErrors.push('Name is required');
        } else {
          const nameError = validateName(name, 'Name');
          if (nameError) {
            rowErrors.push(nameError);
          }
        }
      //validate email
        if (!email.trim()) {
          rowErrors.push('Email is required');
        } else {
          const emailError = validateEmail(email);
          if (emailError) {
            rowErrors.push(emailError);
          } else if (!validateEmailDomain(email)) {
            if (domainRestriction.includes('@')) {
              const [pattern, domain] = domainRestriction.toLowerCase().split('@');
              const yearDept = pattern.match(/(\d{2})([a-z]+)/);
              if (yearDept) {
                rowErrors.push(`Email must include the pattern '${yearDept[1]}${yearDept[2]}' (e.g., kavin${yearDept[1]}${yearDept[2]}@${domain} or kavinr.${yearDept[1]}${yearDept[2]}@${domain})`);
              } else {
                rowErrors.push(`Invalid pattern format. Please use format like '23cse@kongu.edu'`);
              }
            } else {
              rowErrors.push(`Email must be from @${domainRestriction} domain`);
            }
          }
        }

        const lowerCaseName = name.toLowerCase().trim();
        const lowerCaseEmail = email.toLowerCase().trim();

        if (uploadedNames.has(lowerCaseName) && name.trim()) {
          rowErrors.push('Duplicate name in this file');
        }

        if (uploadedEmails.has(lowerCaseEmail) && email.trim()) {
          rowErrors.push('Duplicate email in this file');
        }

        if (existingNames.includes(lowerCaseName) && name.trim()) {
          rowErrors.push('Name already exists in current voters list');
        }

        if (existingEmails.includes(lowerCaseEmail) && email.trim()) {
          rowErrors.push('Email already exists in current voters list');
        }

        if (rowErrors.length > 0) {
          errors.push({
            row: lineNumber,
            name: name || 'N/A',
            email: email || 'N/A',
            errors: rowErrors
          });
        } else {
          validVoters.push({ 
            name: name.trim(), 
            email: email.trim().toLowerCase() 
          });
          uploadedNames.add(lowerCaseName);
          uploadedEmails.add(lowerCaseEmail);
        }
      } catch (error) {
        errors.push({
          row: lineNumber,
          name: 'N/A',
          email: 'N/A',
          errors: ['Error processing this row']
        });
      }
    });

    setUploadedVoters(validVoters);
    setUploadErrors(errors);
    setIsUploading(false);
  };

  const handleAddUploadedVoters = () => {
    if (uploadedVoters.length > 0) {
      setVoters(prevVoters => {
        if (prevVoters.length === 1 && !prevVoters[0].name && !prevVoters[0].email) {
          return [...uploadedVoters];
        }
        return [...prevVoters, ...uploadedVoters];
      });
      handleCloseUploadModal();
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { Name: 'John Doe', Email: 'john.doe@example.com' },
      { Name: 'Jane Smith', Email: 'jane.smith@example.com' },
      { Name: 'Bob Johnson', Email: 'bob.johnson@example.com' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');
    
    const colWidths = [
      { wch: 20 },
      { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'voters_template.xlsx');
  };

  // Real-time validation for form fields
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        return validateElectionTitle(value);
      default:
        return '';
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (touchedFields[name] || value.trim()) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }

    // Real-time date/time validation
    if (name.includes('Date') || name.includes('Time')) {
      const dateTimeErrors = validateDateTime();
      setFieldErrors(prev => ({
        ...prev,
        ...dateTimeErrors
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Validate date/time on blur
    if (name.includes('Date') || name.includes('Time')) {
      const dateTimeErrors = validateDateTime();
      setFieldErrors(prev => ({
        ...prev,
        ...dateTimeErrors
      }));
    }
  };

  // Add this function to check for duplicate nominee names
  const checkDuplicateNominees = (nominees) => {
    const nameSet = new Set();
    const duplicates = [];
    
    nominees.forEach((nominee, index) => {
      const nameLower = nominee.trim().toLowerCase();
      if (nameLower && nameSet.has(nameLower)) {
        duplicates.push(index);
      }
      nameSet.add(nameLower);
    });
    
    return duplicates;
  };

  const handleNomineeChange = (index, value) => {
    const updatedNominees = [...nominees];
    updatedNominees[index] = value;
    
    // Check for duplicates
    const duplicates = checkDuplicateNominees(updatedNominees);
    
    setNominees(updatedNominees);

    const errorKey = `nominee-${index}`;
    if (touchedFields[errorKey] || value.trim()) {
      let error = validateName(value, 'Nominee name');
      if (!error && duplicates.includes(index)) {
        error = 'This nominee name already exists';
      }
      setFieldErrors(prev => ({
        ...prev,
        [errorKey]: error
      }));
    }
  };

  const handleNomineeBlur = (index, value) => {
    const errorKey = `nominee-${index}`;
    setTouchedFields(prev => ({
      ...prev,
      [errorKey]: true
    }));

    const error = validateName(value, 'Nominee name');
    setFieldErrors(prev => ({
      ...prev,
      [errorKey]: error
    }));
  };

  const addNominee = () => {
    setNominees([...nominees, '']);
  };

  const removeNominee = (index) => {
    if (nominees.length > 1) {
      setNominees(nominees.filter((_, i) => i !== index));
      const errorKey = `nominee-${index}`;
      if (fieldErrors[errorKey]) {
        const newFieldErrors = { ...fieldErrors };
        delete newFieldErrors[errorKey];
        setFieldErrors(newFieldErrors);
      }
      const newTouchedFields = { ...touchedFields };
      delete newTouchedFields[errorKey];
      setTouchedFields(newTouchedFields);
    }
  };

  // Add this function to check for duplicate voter emails
  const checkDuplicateVoterEmails = (voters) => {
    const emailSet = new Set();
    const duplicates = [];
    
    voters.forEach((voter, index) => {
      const emailLower = voter.email.trim().toLowerCase();
      if (emailLower && emailSet.has(emailLower)) {
        duplicates.push(index);
      }
      emailSet.add(emailLower);
    });
    
    return duplicates;
  };

  const handleVoterChange = (index, field, value) => {
    const updatedVoters = [...voters];
    updatedVoters[index][field] = value;
    
    // Check for duplicate emails
    const duplicates = checkDuplicateVoterEmails(updatedVoters);
    
    setVoters(updatedVoters);

    if (field === 'name') {
      const errorKey = `voter-${index}-name`;
      if (touchedFields[errorKey] || value.trim()) {
        const error = validateName(value, 'Voter name');
        setFieldErrors(prev => ({
          ...prev,
          [errorKey]: error
        }));
      }
    } else if (field === 'email') {
      const errorKey = `voter-${index}-email`;
      let error = '';
      
      if (value.trim()) {
        error = validateEmail(value);
        if (!error && !validateEmailDomain(value)) {
          if (domainRestriction.includes('@')) {
            const [pattern, domain] = domainRestriction.toLowerCase().split('@');
            const yearDept = pattern.match(/(\d{2})([a-z]+)/);
            if (yearDept) {
              error = `Email must follow the pattern: username[.optional]${yearDept[1]}${yearDept[2]}@${domain}`;
            }
          } else {
            error = `Email must be from @${domainRestriction} domain`;
          }
        }
        if (!error && duplicates.includes(index)) {
          error = 'This email address is already in use';
        }
      }
      
      setFieldErrors(prev => ({
        ...prev,
        [errorKey]: error
      }));
    }
  };

  const handleVoterBlur = (index, field, value) => {
    const errorKey = `voter-${index}-${field}`;
    setTouchedFields(prev => ({
      ...prev,
      [errorKey]: true
    }));

    if (field === 'name') {
      const error = validateName(value, 'Voter name');
      setFieldErrors(prev => ({
        ...prev,
        [errorKey]: error
      }));
    }
  };

  const addVoter = () => {
    setVoters([...voters, { name: '', email: '' }]);
  };

  const removeVoter = (index) => {
    if (voters.length > 1) {
      setVoters(voters.filter((_, i) => i !== index));
      const nameErrorKey = `voter-${index}-name`;
      const emailErrorKey = `voter-${index}-email`;
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[nameErrorKey];
      delete newFieldErrors[emailErrorKey];
      setFieldErrors(newFieldErrors);
      const newTouchedFields = { ...touchedFields };
      delete newTouchedFields[nameErrorKey];
      delete newTouchedFields[emailErrorKey];
      setTouchedFields(newTouchedFields);
    }
  };

  const validateAllFields = () => {
    const errors = {};

    const titleError = validateElectionTitle(formData.title);
    if (titleError) {
      errors.title = titleError;
    }

    // Validate date/time
    const dateTimeErrors = validateDateTime();
    Object.assign(errors, dateTimeErrors);

    nominees.forEach((nominee, index) => {
      if (nominee.trim()) {
        const nomineeError = validateName(nominee, 'Nominee name');
        if (nomineeError) {
          errors[`nominee-${index}`] = nomineeError;
        }
      } else if (index === 0 || nominees.length > 1) {
        errors[`nominee-${index}`] = 'Nominee name is required';
      }
    });

    voters.forEach((voter, index) => {
      const nameError = validateName(voter.name, 'Voter name');
      if (nameError) {
        errors[`voter-${index}-name`] = nameError;
      }

      if (emailValidationOnSubmit) {
        const emailError = validateEmail(voter.email);
        if (emailError) {
          errors[`voter-${index}-email`] = emailError;
        }
      }
    });

    // Check for duplicate nominees
    const duplicateNominees = checkDuplicateNominees(nominees);
    duplicateNominees.forEach(index => {
      errors[`nominee-${index}`] = 'This nominee name already exists';
    });

    // Check for duplicate voter emails
    const duplicateVoterEmails = checkDuplicateVoterEmails(voters);
    duplicateVoterEmails.forEach(index => {
      errors[`voter-${index}-email`] = 'This email address is already in use';
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    setEmailValidationOnSubmit(true);

    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    nominees.forEach((_, index) => {
      allTouched[`nominee-${index}`] = true;
    });
    voters.forEach((_, index) => {
      allTouched[`voter-${index}-name`] = true;
      allTouched[`voter-${index}-email`] = true;
    });
    setTouchedFields(allTouched);

    if (!validateAllFields()) {
      setError('Please fix the validation errors before submitting.');
      setLoading(false);
      return;
    }

    const validNominees = nominees.filter(name => name.trim());
    const validVoters = voters.filter(voter => voter.name.trim() && voter.email.trim());

    if (validNominees.length < 2) {
      setError('Please add at least 2 nominees');
      setLoading(false);
      return;
    }

    if (validVoters.length < 1) {
      setError('Please add at least 1 voter');
      setLoading(false);
      return;
    }

    const invalidEmails = voters.filter(voter => {
      const emailError = validateEmail(voter.email);
      return emailError !== '';
    });

    if (invalidEmails.length > 0) {
      setError('Some email addresses are invalid. Please check and correct them.');
      setLoading(false);
      return;
    }

    try {
      const startDateTime = combineDateTime(formData.startDate, formData.startTime);
      const endDateTime = combineDateTime(formData.endDate, formData.endTime);

      const electionData = {
        title: formData.title,
        description: formData.description,
        nominees: validNominees,
        voters: validVoters,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      };

      const response = await electionAPI.createElection(electionData);
      setSuccess(`Election created successfully! Voting URL: ${response.data.election.votingUrl}`);
      
      setFormData({ 
        title: '', 
        description: '', 
        startDate: '', 
        startTime: '', 
        endDate: '', 
        endTime: '' 
      });
      setNominees(['']);
      setVoters([{ name: '', email: '' }]);
      setFieldErrors({});
      setTouchedFields({});
      setEmailValidationOnSubmit(false);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create election');
      setEmailValidationOnSubmit(false);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowEmailError = (index) => {
    return emailValidationOnSubmit && fieldErrors[`voter-${index}-email`];
  };

  // Helper function to format date/time for display
  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not set';
    const dateTime = combineDateTime(date, time);
    return dateTime ? dateTime.toLocaleString() : 'Invalid date/time';
  };

  // Inline styles
  const styles = {
    pageContainer: {
      padding: '2rem',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    pageTitle: {
      textAlign: 'center',
      color: '#2c3e50',
      fontWeight: '700',
      marginBottom: '2rem',
      fontSize: '2.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '3px solid #4361ee',
      display: 'inline-block'
    },
    card: {
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
      marginBottom: '1.5rem',
      overflow: 'hidden'
    },
    cardHeader: {
      background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
      color: 'white',
      border: 'none',
      padding: '1rem 1.5rem'
    },
    uploadButton: {
      borderRadius: '8px',
      fontWeight: '600',
      padding: '0.5rem 1rem',
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      border: 'none',
      color: 'white',
      transition: 'all 0.2s ease',
      marginLeft: '0.5rem'
    },
    errorText: {
      color: '#dc3545',
      fontSize: '0.875rem'
    },
    dateTimeSection: {
      backgroundColor: '#fff3cd',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #ffeaa7',
      marginBottom: '1rem'
    },
    summaryContainer: {
      position: 'sticky',
      top: '2rem',
      height: 'fit-content'
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <h2 style={styles.pageTitle}>Create New Election</h2>
      </div>
      
      {error && <Alert variant="danger" style={{borderRadius: '10px'}}>{error}</Alert>}
      {success && (
        <Alert variant="success" style={{borderRadius: '10px'}}>
          <div>{success}</div>
          <div className="mt-2">
            <small>Voter credentials have been sent to registered email addresses.</small>
          </div>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            {/* Election Details Card */}
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <h5 style={{margin: '0', fontSize: '1.25rem', fontWeight: '600'}}>Election Details</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>Election Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Student Council President Election 2024"
                    required
                    style={{
                      borderRadius: '8px',
                      border: fieldErrors.title ? '1px solid #dc3545' : '1px solid #dee2e6',
                      padding: '0.75rem 1rem'
                    }}
                  />
                  {fieldErrors.title && (
                    <Form.Text style={styles.errorText}>
                      {fieldErrors.title}
                    </Form.Text>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe the election purpose"
                    required
                    style={{borderRadius: '8px', padding: '0.75rem 1rem'}}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Election Schedule Card */}
            <Card style={styles.card}>
              <Card.Header style={styles.cardHeader}>
                <h5 style={{margin: '0', fontSize: '1.25rem', fontWeight: '600'}}>Election Schedule</h5>
              </Card.Header>
              <Card.Body>
                <div style={styles.dateTimeSection}>
                  <p style={{margin: '0', fontWeight: '600', color: '#856404'}}>
                    ⏰ Important: Voters can only access the election during the scheduled time period.
                  </p>
                </div>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        required
                        style={{
                          borderRadius: '8px',
                          border: fieldErrors.startDate ? '1px solid #dc3545' : '1px solid #dee2e6',
                          padding: '0.75rem 1rem'
                        }}
                      />
                      {fieldErrors.startDate && (
                        <Form.Text style={styles.errorText}>
                          {fieldErrors.startDate}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>Start Time *</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        required
                        style={{
                          borderRadius: '8px',
                          border: fieldErrors.startTime ? '1px solid #dc3545' : '1px solid #dee2e6',
                          padding: '0.75rem 1rem'
                        }}
                      />
                      {fieldErrors.startTime && (
                        <Form.Text style={styles.errorText}>
                          {fieldErrors.startTime}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>End Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        required
                        style={{
                          borderRadius: '8px',
                          border: fieldErrors.endDate ? '1px solid #dc3545' : '1px solid #dee2e6',
                          padding: '0.75rem 1rem'
                        }}
                      />
                      {fieldErrors.endDate && (
                        <Form.Text style={styles.errorText}>
                          {fieldErrors.endDate}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{fontWeight: '600', color: '#2c3e50'}}>End Time *</Form.Label>
                      <Form.Control
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        required
                        style={{
                          borderRadius: '8px',
                          border: fieldErrors.endTime ? '1px solid #dc3545' : '1px solid #dee2e6',
                          padding: '0.75rem 1rem'
                        }}
                      />
                      {fieldErrors.endTime && (
                        <Form.Text style={styles.errorText}>
                          {fieldErrors.endTime}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
                  <Alert variant="info" style={{borderRadius: '8px', marginTop: '1rem'}}>
                    <strong>Election Schedule Preview:</strong><br/>
                    <strong>Start:</strong> {formatDateTime(formData.startDate, formData.startTime)}<br/>
                    <strong>End:</strong> {formatDateTime(formData.endDate, formData.endTime)}
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Nominees Card */}
            <Card style={styles.card}>
              <Card.Header style={{...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h5 style={{margin: '0', fontSize: '1.25rem', fontWeight: '600'}}>Nominees</h5>
                <Button variant="outline-light" size="sm" onClick={addNominee}>
                  Add Nominee
                </Button>
              </Card.Header>
              <Card.Body>
                {nominees.map((nominee, index) => (
                  <Form.Group key={index} className="mb-2">
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder={`Nominee ${index + 1} name`}
                        value={nominee}
                        onChange={(e) => handleNomineeChange(index, e.target.value)}
                        onBlur={(e) => handleNomineeBlur(index, e.target.value)}
                        style={{
                          borderRadius: '8px',
                          border: fieldErrors[`nominee-${index}`] ? '1px solid #dc3545' : '1px solid #dee2e6',
                          padding: '0.75rem 1rem'
                        }}
                      />
                      {nominees.length > 1 && (
                        <Button variant="outline-danger" size="sm" onClick={() => removeNominee(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    {fieldErrors[`nominee-${index}`] && (
                      <Form.Text style={styles.errorText}>
                        {fieldErrors[`nominee-${index}`]}
                      </Form.Text>
                    )}
                  </Form.Group>
                ))}
                <small className="text-muted">Add at least 2 nominees</small>
              </Card.Body>
            </Card>

            {/* Voters Card */}
            <Card style={styles.card}>
              <Card.Header style={{...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h5 style={{margin: '0', fontSize: '1.25rem', fontWeight: '600'}}>Voters</h5>
                <div>
                  <Button variant="outline-light" size="sm" onClick={addVoter}>
                    Add Voter
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={handleShowUploadModal}
                    style={styles.uploadButton}
                  >
                    Upload Xlx/Excel
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {voters.map((voter, index) => (
                  <div key={index} className="mb-3">
                    <Row className="mb-2">
                      <Col md={5}>
                        <Form.Control
                          type="text"
                          placeholder="Voter name"
                          value={voter.name}
                          onChange={(e) => handleVoterChange(index, 'name', e.target.value)}
                          onBlur={(e) => handleVoterBlur(index, 'name', e.target.value)}
                          style={{
                            borderRadius: '8px',
                            border: fieldErrors[`voter-${index}-name`] ? '1px solid #dc3545' : '1px solid #dee2e6',
                            padding: '0.75rem 1rem'
                          }}
                        />
                        {fieldErrors[`voter-${index}-name`] && (
                          <Form.Text style={styles.errorText}>
                            {fieldErrors[`voter-${index}-name`]}
                          </Form.Text>
                        )}
                      </Col>
                      <Col md={5}>
                        <Form.Control
                          type="email"
                          placeholder="Voter email"
                          value={voter.email}
                          onChange={(e) => handleVoterChange(index, 'email', e.target.value)}
                          style={{
                            borderRadius: '8px',
                            border: shouldShowEmailError(index) ? '1px solid #dc3545' : '1px solid #dee2e6',
                            padding: '0.75rem 1rem'
                          }}
                        />
                        {shouldShowEmailError(index) && (
                          <Form.Text style={styles.errorText}>
                            {fieldErrors[`voter-${index}-email`]}
                          </Form.Text>
                        )}
                      </Col>
                      <Col md={2}>
                        {voters.length > 1 && (
                          <Button variant="outline-danger" size="sm" onClick={() => removeVoter(index)}>
                            Remove
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
                <small className="text-muted">
                  {voters.length} voter(s) added. Upload Xlx/Excel to add multiple voters at once.
                </small>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            {/* Summary Card - Fixed Position */}
            <div style={styles.summaryContainer}>
              <Card style={styles.card}>
                <Card.Header style={styles.cardHeader}>
                  <h5 style={{margin: '0', fontSize: '1.25rem', fontWeight: '600'}}>Summary</h5>
                </Card.Header>
                <Card.Body>
                  <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                  <p><strong>Start:</strong> {formatDateTime(formData.startDate, formData.startTime)}</p>
                  <p><strong>End:</strong> {formatDateTime(formData.endDate, formData.endTime)}</p>
                  <p><strong>Nominees:</strong> {nominees.filter(n => n.trim()).length}</p>
                  <p><strong>Voters:</strong> {voters.filter(v => v.name.trim() && v.email.trim()).length}</p>
                  
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading} 
                    style={{
                      borderRadius: '8px',
                      fontWeight: '600',
                      padding: '0.75rem',
                      width: '100%',
                      marginTop: '1rem'
                    }}
                  >
                    {loading ? 'Creating Election...' : 'Create Election'}
                  </Button>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Form>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Voters from Xlx/Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Email Pattern/Domain Restriction (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., kongu.edu or 23cse@kongu.edu"
                value={domainRestriction}
                onChange={(e) => setDomainRestriction(e.target.value.trim())}
              />
              <Form.Text className="text-muted">
                Enter either:<br/>
                1. Domain only (e.g., kongu.edu) to allow any email from that domain<br/>
                2. Pattern with department (e.g., 23cse@kongu.edu) to allow emails like kavin23cse@kongu.edu<br/>
                Leave empty to accept all domains.
              </Form.Text>
            </Form.Group>
          </div>
          <div className="mb-3">
            <Button variant="outline-primary" size="sm" onClick={downloadTemplate}>
              Download Template
            </Button>
            <small className="text-muted ms-2">
              Download template file with proper column headers (Name, Email)
            </small>
          </div>

          <Form.Group>
            <Form.Label>Select XLX or Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <Form.Text className="text-muted">
              Supported formats: .xlsx, .xls, File should have columns: "Name" and "Email"
            </Form.Text>
          </Form.Group>

          {isUploading && (
            <div className="text-center my-3">
              <Spinner animation="border" variant="primary" />
              <div>Processing file...</div>
            </div>
          )}

          {uploadedVoters.length > 0 && (
            <div className="mt-3">
              <Alert variant="success">
                <strong>Success!</strong> Found {uploadedVoters.length} valid voter(s) ready to add.
                {uploadErrors.length > 0 && (
                  <span> {uploadErrors.length} row(s) had errors and were skipped.</span>
                )}
              </Alert>
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                <ListGroup>
                  {uploadedVoters.slice(0, 10).map((voter, index) => (
                    <ListGroup.Item key={index} className="py-2">
                      <strong>{voter.name}</strong> - {voter.email}
                    </ListGroup.Item>
                  ))}
                  {uploadedVoters.length > 10 && (
                    <ListGroup.Item className="text-center text-muted">
                      ... and {uploadedVoters.length - 10} more
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </div>
            </div>
          )}

          {uploadErrors.length > 0 && (
            <div className="mt-3">
              <Alert variant="warning">
                <strong>Validation Issues:</strong> {uploadErrors.length} row(s) had errors and were skipped.
                Only valid rows will be added.
              </Alert>
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                <ListGroup>
                  {uploadErrors.slice(0, 10).map((error, index) => (
                    <ListGroup.Item key={index} className="py-2">
                      <div className="small">
                        <strong>Row {error.row}:</strong> {error.name} - {error.email}
                      </div>
                      <div className="text-danger">
                        {error.errors.map((err, errIndex) => (
                          <div key={errIndex}>• {err}</div>
                        ))}
                      </div>
                    </ListGroup.Item>
                  ))}
                  {uploadErrors.length > 10 && (
                    <ListGroup.Item className="text-center text-muted">
                      ... and {uploadErrors.length - 10} more errors
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseUploadModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddUploadedVoters}
            disabled={uploadedVoters.length === 0 || isUploading}
          >
            Add {uploadedVoters.length} Valid Voter(s)
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateElection;