import React, { useState, useRef } from 'react';
import {
  Form,
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
  const [currentStep, setCurrentStep] = useState(1);

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

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Styles ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  const S = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'var(--surface-bg, #f4f6fb)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      paddingBottom: '3rem',
    },
    // Page banner
    banner: {
      background: 'rgba(17, 52, 149, 1)',
      padding: '1.25rem 2rem',
      margin: '1rem 2rem 2rem',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 20px rgba(17, 52, 149, 0.3)',
    },
    bannerInner: { maxWidth: 1100, margin: '0 auto' },
    bannerBadge: {
      display: 'inline-block',
      background: 'rgba(255,255,255,0.18)',
      color: 'white',
      borderRadius: 50,
      padding: '4px 14px',
      fontSize: '0.78rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      marginBottom: '0.75rem',
    },
    bannerTitle: {
      color: '#fff',
      fontWeight: 800,
      fontSize: '2rem',
      margin: '0 0 0.4rem',
    },
    bannerSub: {
      color: 'rgba(255,255,255,0.78)',
      fontSize: '0.97rem',
      margin: 0,
    },
    // Step indicator
    stepRow: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      maxWidth: 1100,
      margin: '0 auto',
      padding: '1.5rem 2rem 0',
      flexWrap: 'wrap',
    },
    stepItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 50,
      background: active ? 'var(--brand-primary,#4361ee)' : '#e8ecf4',
      color: active ? '#fff' : '#9aa3b5',
      fontWeight: 600,
      fontSize: '0.82rem',
      transition: '0.2s',
    }),
    stepDot: (active) => ({
      width: 20, height: 20,
      borderRadius: '50%',
      background: active ? 'rgba(255,255,255,0.3)' : '#c5cde8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 800, color: active ? '#fff' : '#9aa3b5',
    }),
    stepDivider: { flex: 1, height: 2, background: '#e8ecf4', borderRadius: 2, minWidth: 20 },
    // Content area
    content: { maxWidth: 1100, margin: '0 auto', padding: '0 2rem' },
    // Cards
    card: {
      background: '#fff',
      border: '1px solid #e8ecf4',
      borderRadius: 16,
      boxShadow: '0 4px 20px rgba(67,97,238,0.07)',
      marginBottom: '1.5rem',
      overflow: 'hidden',
    },
    cardHeader: {
      background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      padding: '0.75rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardHeaderTitle: { color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 },
    cardBody: { padding: '1.25rem' },
    // Form inputs
    label: { fontWeight: 600, color: '#1a1d2e', fontSize: '0.88rem', marginBottom: 6, display: 'block' },
    input: (hasError) => ({
      borderRadius: 10,
      border: `1.5px solid ${hasError ? '#dc3545' : '#e8ecf4'}`,
      padding: '0.7rem 1rem',
      fontSize: '0.93rem',
      width: '100%',
      outline: 'none',
      transition: '0.2s',
      background: '#fff',
      color: '#1a1d2e',
    }),
    errorText: { color: '#dc3545', fontSize: '0.8rem', marginTop: 4 },
    // Schedule info box
    infoBanner: {
      background: 'linear-gradient(135deg, #eff6ff, #f0f4ff)',
      border: '1px solid #c7d7fd',
      borderRadius: 10,
      padding: '0.75rem 1rem',
      marginBottom: '1.25rem',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    },
    // Nominee row
    nomineeRow: {
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
    },
    nomineeNumber: {
      width: 32, height: 32, minWidth: 32,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4361ee, #3a0ca3)',
      color: '#fff',
      fontWeight: 700, fontSize: '0.82rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    // Voter row
    voterRow: {
      background: '#f8faff',
      border: '1.5px solid #e8ecf4',
      borderRadius: 12,
      padding: '0.85rem 1rem',
      marginBottom: 10,
      transition: '0.2s',
    },
    // Dashed add button
    dashedAdd: {
      width: '100%',
      border: '2px dashed #c5cde8',
      borderRadius: 10,
      background: 'transparent',
      color: '#4361ee',
      fontWeight: 600,
      padding: '0.65rem',
      fontSize: '0.88rem',
      cursor: 'pointer',
      transition: '0.2s',
      marginTop: 8,
    },
    // Upload btn
    uploadBtn: {
      borderRadius: 50,
      fontWeight: 600,
      padding: '0.35rem 1rem',
      background: 'linear-gradient(135deg,#28a745,#20c997)',
      border: 'none',
      color: 'white',
      fontSize: '0.8rem',
      cursor: 'pointer',
    },
    addVoterBtn: {
      borderRadius: 50,
      fontWeight: 600,
      padding: '0.35rem 1rem',
      background: 'rgba(255,255,255,0.2)',
      border: '1.5px solid rgba(255,255,255,0.5)',
      color: 'white',
      fontSize: '0.8rem',
      cursor: 'pointer',
    },
    addNomineeBtn: {
      borderRadius: 50,
      fontWeight: 600,
      padding: '0.35rem 1rem',
      background: 'rgba(255,255,255,0.2)',
      border: '1.5px solid rgba(255,255,255,0.5)',
      color: 'white',
      fontSize: '0.8rem',
      cursor: 'pointer',
    },
    removeBtn: {
      background: 'none',
      border: '1.5px solid #fca5a5',
      color: '#ef4444',
      borderRadius: 8,
      padding: '0.35rem 0.7rem',
      fontSize: '0.78rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: '0.2s',
      whiteSpace: 'nowrap',
    },
    // Summary sidebar
    summaryCard: {
      background: '#fff',
      border: '1px solid #e8ecf4',
      borderRadius: 16,
      boxShadow: '0 4px 20px rgba(67,97,238,0.07)',
      overflow: 'hidden',
      position: 'sticky',
      top: 80,
    },
    summaryHeader: {
      background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      padding: '1.1rem 1.5rem',
    },
    summaryRow: {
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '0.7rem 0',
      borderBottom: '1px solid #f0f4ff',
    },
    summaryIcon: { fontSize: '1.1rem', lineHeight: 1, paddingTop: 2 },
    summaryLabel: { fontSize: '0.78rem', color: '#9aa3b5', fontWeight: 600, marginBottom: 1 },
    summaryValue: { fontSize: '0.91rem', color: '#1a1d2e', fontWeight: 600 },
    submitBtn: {
      width: '100%',
      padding: '0.85rem',
      borderRadius: 12,
      background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      border: 'none',
      color: '#fff',
      fontWeight: 700,
      fontSize: '1rem',
      marginTop: '1.25rem',
      cursor: 'pointer',
      boxShadow: '0 6px 20px rgba(67,97,238,0.35)',
      transition: '0.2s',
    },
    // Alert
    alertSuccess: {
      background: 'linear-gradient(135deg,#d1fae5,#ecfdf5)',
      border: '1px solid #6ee7b7',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
      color: '#065f46',
    },
    alertError: {
      background: 'linear-gradient(135deg,#fee2e2,#fff1f2)',
      border: '1px solid #fca5a5',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
      color: '#991b1b',
    },
    // Schedule preview badge
    scheduleBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'linear-gradient(135deg,#eff6ff,#f0f4ff)',
      border: '1px solid #c7d7fd',
      borderRadius: 8,
      padding: '0.5rem 0.9rem',
      fontSize: '0.84rem',
      color: '#3a5bd9',
      fontWeight: 600,
      marginTop: '0.75rem',
    },
    // Modal
    modalHeader: {
      background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
      padding: '1.1rem 1.5rem',
      borderRadius: '12px 12px 0 0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
  };
  // â”€â”€â”€ Step navigation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const validateStep1 = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Election title is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    setFieldErrors(prev => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.startDate) errs.startDate = 'Start date is required';
    if (!formData.startTime) errs.startTime = 'Start time is required';
    if (!formData.endDate) errs.endDate = 'End date is required';
    if (!formData.endTime) errs.endTime = 'End time is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate)
      errs.endDate = 'End date must be after start date';
    setFieldErrors(prev => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const valid = nominees.filter(n => n.trim()).length >= 2;
    const voterOk = voters.filter(v => v.name.trim() && v.email.trim()).length >= 1;
    if (!valid) {
      setError('Please add at least 2 nominees before proceeding.');
      return false;
    }
    if (!voterOk) {
      setError('Please add at least 1 voter before proceeding.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // ─── Inline styles for wizard nav ──────────────────────────────────────
  const stepLabels = ['Election Details', 'Schedule', 'Nominees & Voters', 'Review & Submit'];

  const wizardStyles = {
    stepBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: '1.25rem 2rem',
      background: '#fff', borderBottom: '1px solid #e8ecf4', marginBottom: 0,
    },
    stepWrap: (active, done) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      cursor: done ? 'pointer' : 'default',
      minWidth: 110,
    }),
    stepCircle: (active, done) => ({
      width: 38, height: 38, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.9rem',
      background: done ? '#4361ee' : active ? 'linear-gradient(135deg,#4361ee,#3a0ca3)' : '#f0f4ff',
      color: (done || active) ? '#fff' : '#9aa3b5',
      border: active ? '2.5px solid #4361ee' : done ? '2.5px solid #4361ee' : '2px solid #e8ecf4',
      boxShadow: active ? '0 4px 14px rgba(67,97,238,0.3)' : 'none',
      transition: 'all 0.3s',
      flexShrink: 0,
    }),
    stepLabel: (active, done) => ({
      fontSize: '0.75rem', fontWeight: active ? 700 : 500,
      color: (active || done) ? '#4361ee' : '#9aa3b5',
      textAlign: 'center', lineHeight: 1.3,
    }),
    stepLine: { flex: 1, height: 2, background: '#e8ecf4', margin: '0 4px', marginBottom: 20, minWidth: 30 },
    stepLineDone: { flex: 1, height: 2, background: '#4361ee', margin: '0 4px', marginBottom: 20, minWidth: 30 },
    navRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e8ecf4',
    },
    backBtn: {
      background: '#f0f4ff', border: '1.5px solid #e8ecf4',
      borderRadius: 10, padding: '0.6rem 1.6rem',
      fontWeight: 600, color: '#5a6478', fontSize: '0.92rem', cursor: 'pointer',
    },
    nextBtn: {
      background: 'linear-gradient(135deg,#4361ee,#3a0ca3)',
      border: 'none', borderRadius: 10, padding: '0.6rem 2rem',
      fontWeight: 700, color: '#fff', fontSize: '0.92rem', cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(67,97,238,0.3)',
    },
    submitBtn: {
      background: 'linear-gradient(135deg,#4361ee,#3a0ca3)',
      border: 'none', borderRadius: 10, padding: '0.75rem 2.5rem',
      fontWeight: 700, color: '#fff', fontSize: '1rem', cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(67,97,238,0.3)', width: '100%', marginTop: '1rem',
    },
    summaryBox: {
      background: '#fff', borderRadius: 16, border: '1px solid #e8ecf4',
      boxShadow: '0 4px 24px rgba(67,97,238,0.08)', overflow: 'hidden',
    },
    summarySection: {
      padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f4ff',
    },
    sectionTitle: {
      fontSize: '0.7rem', fontWeight: 700, color: '#9aa3b5',
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
    },
    summaryItem: {
      display: 'flex', gap: 12, padding: '0.5rem 0',
      borderBottom: '1px solid #f8faff', alignItems: 'flex-start',
    },
    summaryKey: { fontSize: '0.8rem', color: '#9aa3b5', fontWeight: 500, minWidth: 70 },
    summaryVal: { fontSize: '0.88rem', color: '#1a1d2e', fontWeight: 600, flex: 1 },
    pillChip: {
      display: 'inline-block', background: '#f0f4ff', color: '#4361ee',
      borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem',
      fontWeight: 600, marginRight: 4, marginBottom: 4,
    },
  };

  return (
    <div style={S.page}>
      
      {/* Responsive Wizard Styles */}
      <style>{`
        .dv-step-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem 1rem !important;
          background: #fff;
          border-bottom: 1px solid #e8ecf4;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 0;
        }
        .dv-step-bar::-webkit-scrollbar { display: none; }
        
        .dv-step-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 110px;
          flex: 1;
          position: relative;
        }
        
        @media (max-width: 576px) {
          .dv-step-wrap { min-width: 60px !important; }
          .dv-step-label { display: none !important; }
          .dv-step-circle { width: 32px !important; height: 32px !important; font-size: 0.8rem !important; }
          .dv-step-line { min-width: 15px !important; margin-bottom: 0 !important; margin-top: 16px; }
        }
        
        .dv-step-circle {
          transition: all 0.3s;
          flex-shrink: 0;
          z-index: 2;
        }
        
        .dv-step-line {
          flex: 1;
          height: 2px;
          background: #e8ecf4;
          margin: 0 4px;
          margin-bottom: 20px;
          min-width: 30px;
          z-index: 1;
        }
        
        .dv-step-line-done {
          background: #4361ee !important;
        }
      `}</style>

      {/* Page Banner */}
      <div style={S.banner}>
        <div style={S.bannerInner}>
          <div style={S.bannerBadge}>Election Management</div>
          <h1 style={S.bannerTitle}>Create New Election</h1>
          <p style={S.bannerSub}>Complete each step to set up your election.</p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="dv-step-bar">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;
          return (
            <React.Fragment key={stepNum}>
              {i > 0 && (
                <div 
                  className={`dv-step-line ${isDone ? 'dv-step-line-done' : ''}`}
                />
              )}
              <div 
                className="dv-step-wrap" 
                style={{ cursor: isDone ? 'pointer' : 'default' }}
                onClick={() => isDone && setCurrentStep(stepNum)}
              >
                <div 
                  className="dv-step-circle"
                  style={wizardStyles.stepCircle(isActive, isDone)}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span 
                  className="dv-step-label"
                  style={wizardStyles.stepLabel(isActive, isDone)}
                >
                  {label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div style={S.content}>
        <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: '1.75rem' }}>

          {/* Global Alerts */}
          {error && (
            <div style={S.alertError}><strong>Error:</strong> {error}</div>
          )}
          {success && (
            <div style={S.alertSuccess}>
              <strong>Election Created Successfully!</strong>
              <div style={{ fontSize: '0.9rem', marginTop: 4 }}>{success}</div>
              <div style={{ fontSize: '0.82rem', marginTop: 4, opacity: 0.85 }}>
                Voter credentials have been sent to registered email addresses.
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* STEP 1: Election Details                                  */}
          {/* ───────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderTitle}>Step 1 — Election Details</span>
              </div>
              <div style={S.cardBody}>
                <Form.Group className="mb-4">
                  <label style={S.label}>Election Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Student Council President Election 2024"
                    required
                    style={S.input(!!fieldErrors.title)}
                  />
                  {fieldErrors.title && <div style={S.errorText}>{fieldErrors.title}</div>}
                </Form.Group>

                <Form.Group>
                  <label style={S.label}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe the purpose and scope of this election..."
                    required
                    style={{ ...S.input(!!fieldErrors.description), resize: 'vertical', minHeight: 110 }}
                  />
                  {fieldErrors.description && <div style={S.errorText}>{fieldErrors.description}</div>}
                </Form.Group>

                <div style={wizardStyles.navRow}>
                  <div />
                  <button type="button" style={wizardStyles.nextBtn} onClick={handleNext}>
                    Next: Schedule &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* STEP 2: Schedule                                          */}
          {/* ───────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderTitle}>Step 2 — Election Schedule</span>
              </div>
              <div style={S.cardBody}>
                <div style={S.infoBanner}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#3a5bd9' }}>Note:</span>
                  <span style={{ fontSize: '0.88rem', color: '#3a5bd9', fontWeight: 500 }}>
                    &nbsp;Voters can only cast their vote during the scheduled time window.
                  </span>
                </div>

                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <label style={S.label}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <Form.Control type="date" name="startDate" value={formData.startDate}
                        onChange={handleFormChange} onBlur={handleBlur} required
                        style={S.input(!!fieldErrors.startDate)} />
                      {fieldErrors.startDate && <div style={S.errorText}>{fieldErrors.startDate}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <label style={S.label}>Start Time <span style={{ color: '#ef4444' }}>*</span></label>
                      <Form.Control type="time" name="startTime" value={formData.startTime}
                        onChange={handleFormChange} onBlur={handleBlur} required
                        style={S.input(!!fieldErrors.startTime)} />
                      {fieldErrors.startTime && <div style={S.errorText}>{fieldErrors.startTime}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <label style={S.label}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <Form.Control type="date" name="endDate" value={formData.endDate}
                        onChange={handleFormChange} onBlur={handleBlur} required
                        style={S.input(!!fieldErrors.endDate)} />
                      {fieldErrors.endDate && <div style={S.errorText}>{fieldErrors.endDate}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <label style={S.label}>End Time <span style={{ color: '#ef4444' }}>*</span></label>
                      <Form.Control type="time" name="endTime" value={formData.endTime}
                        onChange={handleFormChange} onBlur={handleBlur} required
                        style={S.input(!!fieldErrors.endTime)} />
                      {fieldErrors.endTime && <div style={S.errorText}>{fieldErrors.endTime}</div>}
                    </Form.Group>
                  </Col>
                </Row>

                {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    <div style={S.scheduleBadge}>Start: {formatDateTime(formData.startDate, formData.startTime)}</div>
                    <div style={S.scheduleBadge}>End: {formatDateTime(formData.endDate, formData.endTime)}</div>
                  </div>
                )}

                <div style={wizardStyles.navRow}>
                  <button type="button" style={wizardStyles.backBtn} onClick={handleBack}>
                    &larr; Back
                  </button>
                  <button type="button" style={wizardStyles.nextBtn} onClick={handleNext}>
                    Next: Nominees & Voters &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* STEP 3: Nominees & Voters                                 */}
          {/* ───────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <>
              {/* Nominees */}
              <div style={{ ...S.card, marginBottom: '1.5rem' }}>
                <div style={S.cardHeader}>
                  <span style={S.cardHeaderTitle}>
                    Nominees
                    <span style={{ marginLeft: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem' }}>
                      {nominees.filter(n => n.trim()).length} added
                    </span>
                  </span>
                  <button type="button" style={S.addNomineeBtn} onClick={addNominee}>+ Add</button>
                </div>
                <div style={S.cardBody}>
                  {nominees.map((nominee, index) => (
                    <div key={index}>
                      <div style={S.nomineeRow}>
                        <div style={S.nomineeNumber}>{index + 1}</div>
                        <div style={{ flex: 1 }}>
                          <Form.Control
                            type="text"
                            placeholder={`Nominee ${index + 1} full name`}
                            value={nominee}
                            onChange={(e) => handleNomineeChange(index, e.target.value)}
                            onBlur={(e) => handleNomineeBlur(index, e.target.value)}
                            style={S.input(!!fieldErrors[`nominee-${index}`])}
                          />
                        </div>
                        {nominees.length > 1 && (
                          <button type="button" style={S.removeBtn} onClick={() => removeNominee(index)}>Remove</button>
                        )}
                      </div>
                      {fieldErrors[`nominee-${index}`] && (
                        <div style={{ ...S.errorText, marginLeft: 42, marginTop: -6, marginBottom: 6 }}>
                          {fieldErrors[`nominee-${index}`]}
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" style={S.dashedAdd} onClick={addNominee}>+ Add Another Nominee</button>
                  <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#9aa3b5', fontWeight: 500 }}>
                    Minimum 2 nominees required.
                  </div>
                </div>
              </div>

              {/* Voters */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardHeaderTitle}>
                    Voters
                    <span style={{ marginLeft: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 50, padding: '2px 10px', fontSize: '0.75rem' }}>
                      {voters.filter(v => v.name.trim() && v.email.trim()).length} registered
                    </span>
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={S.addVoterBtn} onClick={addVoter}>+ Add Voter</button>
                    <button type="button" style={S.uploadBtn} onClick={handleShowUploadModal}>Upload CSV / Excel</button>
                  </div>
                </div>
                <div style={S.cardBody}>
                  {voters.map((voter, index) => (
                    <div key={index} style={S.voterRow}>
                      <Row>
                        <Col md={5}>
                          <label style={{ ...S.label, fontSize: '0.76rem', color: '#9aa3b5' }}>Full Name</label>
                          <Form.Control
                            type="text" placeholder="Voter full name" value={voter.name}
                            onChange={(e) => handleVoterChange(index, 'name', e.target.value)}
                            onBlur={(e) => handleVoterBlur(index, 'name', e.target.value)}
                            style={S.input(!!fieldErrors[`voter-${index}-name`])}
                          />
                          {fieldErrors[`voter-${index}-name`] && (
                            <div style={S.errorText}>{fieldErrors[`voter-${index}-name`]}</div>
                          )}
                        </Col>
                        <Col md={5}>
                          <label style={{ ...S.label, fontSize: '0.76rem', color: '#9aa3b5' }}>Email Address</label>
                          <Form.Control
                            type="email" placeholder="voter@example.com" value={voter.email}
                            onChange={(e) => handleVoterChange(index, 'email', e.target.value)}
                            style={S.input(shouldShowEmailError(index))}
                          />
                          {shouldShowEmailError(index) && (
                            <div style={S.errorText}>{fieldErrors[`voter-${index}-email`]}</div>
                          )}
                        </Col>
                        <Col md={2} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                          {voters.length > 1 && (
                            <button type="button" style={S.removeBtn} onClick={() => removeVoter(index)}>X</button>
                          )}
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <button type="button" style={S.dashedAdd} onClick={addVoter}>+ Add Another Voter</button>
                  <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#9aa3b5', fontWeight: 500 }}>
                    {voters.length} voter(s) added. Use CSV/Excel upload to add multiple voters at once.
                  </div>
                </div>
              </div>

              <div style={wizardStyles.navRow}>
                <button type="button" style={wizardStyles.backBtn} onClick={handleBack}>&larr; Back</button>
                <button type="button" style={wizardStyles.nextBtn} onClick={handleNext}>Review & Submit &rarr;</button>
              </div>
            </>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* STEP 4: Review & Submit                                   */}
          {/* ───────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div style={wizardStyles.summaryBox}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg,#4361ee,#3a0ca3)',
                padding: '1.5rem 2rem', color: '#fff'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Review Your Election</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 4 }}>
                  Please confirm all details before creating the election.
                </div>
              </div>

              {/* Section 1: Election Details */}
              <div style={wizardStyles.summarySection}>
                <div style={wizardStyles.sectionTitle}>Election Details</div>
                <div style={wizardStyles.summaryItem}>
                  <span style={wizardStyles.summaryKey}>Title</span>
                  <span style={wizardStyles.summaryVal}>{formData.title || '—'}</span>
                </div>
                <div style={{ ...wizardStyles.summaryItem, borderBottom: 'none' }}>
                  <span style={wizardStyles.summaryKey}>Description</span>
                  <span style={{ ...wizardStyles.summaryVal, fontWeight: 400, color: '#5a6478' }}>{formData.description || '—'}</span>
                </div>
              </div>

              {/* Section 2: Schedule */}
              <div style={wizardStyles.summarySection}>
                <div style={wizardStyles.sectionTitle}>Schedule</div>
                <div style={wizardStyles.summaryItem}>
                  <span style={wizardStyles.summaryKey}>Start</span>
                  <span style={wizardStyles.summaryVal}>{formatDateTime(formData.startDate, formData.startTime)}</span>
                </div>
                <div style={{ ...wizardStyles.summaryItem, borderBottom: 'none' }}>
                  <span style={wizardStyles.summaryKey}>End</span>
                  <span style={wizardStyles.summaryVal}>{formatDateTime(formData.endDate, formData.endTime)}</span>
                </div>
              </div>

              {/* Section 3: Nominees */}
              <div style={wizardStyles.summarySection}>
                <div style={wizardStyles.sectionTitle}>Nominees ({nominees.filter(n => n.trim()).length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {nominees.filter(n => n.trim()).map((n, i) => (
                    <span key={i} style={wizardStyles.pillChip}>{n}</span>
                  ))}
                </div>
              </div>

              {/* Section 4: Voters */}
              <div style={{ ...wizardStyles.summarySection, borderBottom: 'none' }}>
                <div style={wizardStyles.sectionTitle}>Voters ({voters.filter(v => v.name.trim() && v.email.trim()).length})</div>
                <div style={{ marginTop: 4 }}>
                  {voters.filter(v => v.name.trim() && v.email.trim()).slice(0, 5).map((v, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#5a6478', padding: '3px 0' }}>
                      <strong style={{ color: '#1a1d2e' }}>{v.name}</strong> — {v.email}
                    </div>
                  ))}
                  {voters.filter(v => v.name.trim() && v.email.trim()).length > 5 && (
                    <div style={{ fontSize: '0.82rem', color: '#9aa3b5', marginTop: 4 }}>
                      ... and {voters.filter(v => v.name.trim() && v.email.trim()).length - 5} more voter(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #e8ecf4' }}>
                <Form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ ...wizardStyles.submitBtn, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {loading ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Creating Election...
                      </span>
                    ) : 'Create Election'}
                  </button>
                </Form>
                <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#9aa3b5', textAlign: 'center', lineHeight: 1.5 }}>
                  Voters will receive their credentials via email after creation.
                </div>
                <div style={{ ...wizardStyles.navRow, borderTop: 'none', paddingTop: '0.75rem' }}>
                  <button type="button" style={wizardStyles.backBtn} onClick={handleBack}>&larr; Back to edit</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="lg" centered>
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={S.modalHeader}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Upload Voters from File</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: 2 }}>
                Import multiple voters from a CSV or Excel file
              </div>
            </div>
            <button type="button" onClick={handleCloseUploadModal}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>
              X
            </button>
          </div>

          <Modal.Body style={{ padding: '1.5rem' }}>
            <div style={{ background: '#f8faff', border: '1px solid #e8ecf4', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <Form.Group>
                <label style={S.label}>
                  Email Domain / Pattern Restriction
                  <span style={{ fontWeight: 400, color: '#9aa3b5', marginLeft: 6, fontSize: '0.78rem' }}>(Optional)</span>
                </label>
                <Form.Control
                  type="text" placeholder="e.g., kongu.edu  or  23cse@kongu.edu"
                  value={domainRestriction}
                  onChange={(e) => setDomainRestriction(e.target.value.trim())}
                  style={S.input(false)}
                />
                <div style={{ fontSize: '0.79rem', color: '#9aa3b5', marginTop: 6, lineHeight: 1.6 }}>
                  - Domain only (e.g., <strong>kongu.edu</strong>) allows any email from that domain<br />
                  - Pattern (e.g., <strong>23cse@kongu.edu</strong>) allows emails like <em>kavin23cse@kongu.edu</em><br />
                  - Leave empty to accept all domains
                </div>
              </Form.Group>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <button type="button" onClick={downloadTemplate}
                style={{ borderRadius: 8, fontWeight: 600, padding: '0.4rem 1rem', border: '1.5px solid #4361ee', color: '#4361ee', background: 'transparent', fontSize: '0.85rem', cursor: 'pointer' }}>
                Download Template
              </button>
              <span style={{ fontSize: '0.8rem', color: '#9aa3b5' }}>
                Use this template with columns: <strong>Name</strong>, <strong>Email</strong>
              </span>
            </div>

            <Form.Group>
              <label style={S.label}>Select CSV or Excel File</label>
              <Form.Control type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} ref={fileInputRef}
                style={{ borderRadius: 10, border: '1.5px solid #e8ecf4', padding: '0.6rem' }} />
              <div style={{ fontSize: '0.79rem', color: '#9aa3b5', marginTop: 5 }}>Supported: .xlsx, .xls, .csv</div>
            </Form.Group>

            {isUploading && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Spinner animation="border" style={{ color: '#4361ee' }} />
                <div style={{ marginTop: 8, color: '#5a6478', fontSize: '0.88rem', fontWeight: 500 }}>Processing your file...</div>
              </div>
            )}

            {uploadedVoters.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ background: 'linear-gradient(135deg,#d1fae5,#ecfdf5)', border: '1px solid #6ee7b7', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#065f46', fontSize: '0.88rem', fontWeight: 600 }}>
                  {uploadedVoters.length} valid voter(s) ready to import.
                  {uploadErrors.length > 0 && <span style={{ fontWeight: 400 }}> ({uploadErrors.length} row(s) skipped)</span>}
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: '1px solid #e8ecf4' }}>
                  <ListGroup variant="flush">
                    {uploadedVoters.slice(0, 10).map((voter, index) => (
                      <ListGroup.Item key={index} style={{ padding: '0.55rem 1rem', fontSize: '0.87rem', borderColor: '#f0f4ff' }}>
                        <strong style={{ color: '#1a1d2e' }}>{voter.name}</strong>
                        <span style={{ color: '#9aa3b5', margin: '0 6px' }}>·</span>
                        <span style={{ color: '#5a6478' }}>{voter.email}</span>
                      </ListGroup.Item>
                    ))}
                    {uploadedVoters.length > 10 && (
                      <ListGroup.Item style={{ textAlign: 'center', color: '#9aa3b5', fontSize: '0.82rem', padding: '0.5rem' }}>
                        ... and {uploadedVoters.length - 10} more
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </div>
            )}

            {uploadErrors.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fff1f2)', border: '1px solid #fdba74', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#9a3412', fontSize: '0.88rem', fontWeight: 600 }}>
                  {uploadErrors.length} row(s) had issues and were skipped.
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: '1px solid #e8ecf4' }}>
                  <ListGroup variant="flush">
                    {uploadErrors.slice(0, 10).map((error, index) => (
                      <ListGroup.Item key={index} style={{ padding: '0.6rem 1rem', borderColor: '#f0f4ff' }}>
                        <div style={{ fontSize: '0.82rem', color: '#5a6478', fontWeight: 600 }}>Row {error.row}: {error.name} - {error.email}</div>
                        <div style={{ fontSize: '0.79rem', color: '#ef4444' }}>
                          {error.errors.map((err, i) => <div key={i}>- {err}</div>)}
                        </div>
                      </ListGroup.Item>
                    ))}
                    {uploadErrors.length > 10 && (
                      <ListGroup.Item style={{ textAlign: 'center', color: '#9aa3b5', fontSize: '0.82rem', padding: '0.5rem' }}>
                        ... and {uploadErrors.length - 10} more errors
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer style={{ borderTop: '1px solid #e8ecf4', padding: '1rem 1.5rem', gap: 10 }}>
            <button type="button" onClick={handleCloseUploadModal}
              style={{ borderRadius: 10, fontWeight: 600, padding: '0.55rem 1.2rem', border: '1.5px solid #e8ecf4', color: '#5a6478', background: '#f8faff', fontSize: '0.88rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={handleAddUploadedVoters}
              disabled={uploadedVoters.length === 0 || isUploading}
              style={{ borderRadius: 10, fontWeight: 700, padding: '0.55rem 1.5rem', background: uploadedVoters.length === 0 ? '#c5cde8' : 'linear-gradient(135deg, #4361ee, #3a0ca3)', border: 'none', color: '#fff', fontSize: '0.88rem', cursor: uploadedVoters.length === 0 ? 'not-allowed' : 'pointer', boxShadow: uploadedVoters.length > 0 ? '0 4px 14px rgba(67,97,238,0.3)' : 'none' }}>
              Add {uploadedVoters.length} Valid Voter(s)
            </button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default CreateElection;