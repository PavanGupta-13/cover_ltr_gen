'use client';

import React, { useState, useEffect } from 'react';
import './InputForm.css';
import jsPDF from 'jspdf';
import { pdfToText } from 'pdf-ts';

const InputForm = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState(null);
  const [error, setError] = useState(null);
  const [usesRemaining, setUsesRemaining] = useState(1);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  useEffect(() => {
    // Get remaining uses from localStorage
    const storedUses = localStorage.getItem('usesRemaining');
    if (storedUses) {
      setUsesRemaining(parseInt(storedUses));
    }
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setResumeFile(file);
    setResumeUploaded(true);
    handleResumeUpload(file);
  };

  const handleJobDescriptionChange = (event) => {
    setJobDescription(event.target.value);
  };

  const handleResumeUpload = async (file) => {
    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedText = await pdfToText(buffer);
      } else {
        const fileReader = new FileReader();
        fileReader.readAsText(file);
        await new Promise((resolve) => {
          fileReader.onload = () => {
            extractedText = fileReader.result;
            resolve();
          };
        });
      }
      setResumeText(extractedText);
      localStorage.setItem('resumeText', extractedText);
    } catch (error) {
      setError('Failed to read resume file.');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if user has uses remaining
    if (usesRemaining <= 0) {
      setShowPaymentPrompt(true);
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description.');
      return;
    }

    const storedResumeText = localStorage.getItem('resumeText');
    if (!storedResumeText || storedResumeText.trim() === '') {
      setError('No resume uploaded. Please upload a resume first.');
      return;
    }

    try {
      const prompt = `Assume you are well-versed in job application processes and crafting professional cover letters. Given the attached job description and resume, generate a formal cover letter tailored for the specified position. The cover letter should follow a professional business letter format with the following structure: 1. **Introduction:** Include a formal greeting, state the position applied for, mention how the position was discovered, and briefly express enthusiasm for the opportunity. 2. **Body:** Highlight relevant skills, experiences, and qualifications that align with the job requirements. Focus on transferable skills if there is any gap between the resume and job requirements. 3. **Closing:** Express gratitude, indicate interest in discussing the role further, and include a professional sign-off. **Important Formatting Guidelines:** - Do not include placeholders, variable markers, or template references such as '[Job Listing Source]' or '[Company Name]'. - Do not include section headings like "Introduction," "Body," or "Closing." - Email and LinkedIn URLs should be presented as plain text without square brackets or hyperlink tags. - Exclude duplicate content such as the applicant's contact information, date. - Ensure the content is concise, aligned properly, and does not include analysis or commentary about the generated content. - Provide only the main content of the cover letter, formatted for direct insertion into a PDF, without introductory explanations or extra meta-information. - Donot include additional information in the closing part, except for greetings and candidate name`;

      // Use the API route to keep API key secure server-side
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          resumeText: storedResumeText,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`HTTP error! Status: ${response.status}. Error details: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      setGeneratedResponse(data);
      generatePDF(data);
      
      // Decrement and update uses remaining
      const newUsesRemaining = usesRemaining - 1;
      setUsesRemaining(newUsesRemaining);
      localStorage.setItem('usesRemaining', newUsesRemaining);
      
      setJobDescription(''); // Clear the job description text box
      setError(null);
    } catch (error) {
      setError('Failed to generate response.');
      console.error('Error:', error);
    }
  };

  const handleUpgrade = () => {
    // Redirect to Stripe checkout
    window.location.href = 'https://buy.stripe.com/test_YOUR_PRODUCT_ID';
  };

  const generatePDF = (data) => {
    const userDetails = JSON.parse(localStorage.getItem('userData'))
    const filename = prompt('Enter a filename for the cover letter (e.g., MyCoverLetter):');
    if (!filename) return; // Exit if no filename is provided

    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont('helvetica', 'normal');

    // Set margins and content width
    const marginLeft = 50;
    const contentWidth = 500;

    // Add contact information only once
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Use stored user email or default name
    const userEmail = localStorage.getItem('userEmail') || 'User';
    doc.text(`${userDetails.fullName}`, marginLeft, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${userDetails.address}`, marginLeft, 65);
    doc.text(`${userDetails.phone}`, marginLeft, 80);
    doc.text(`${userEmail}`, marginLeft, 95);
    doc.text(`${userDetails.linkedin}`, marginLeft, 110);

    // Add date dynamically (once)
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(today, marginLeft, 140);

    // Extract and format cover letter content
    let coverLetterText = data.choices[0].message.content;

    // Handle bold formatting by replacing ** with markers
    coverLetterText = coverLetterText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
      return `@@${p1}@@`; // Mark bold sections temporarily
    });

    let yPosition = 195;

    // Split content into paragraphs for proper formatting
    const paragraphs = coverLetterText.split('\n\n');
    for (const paragraph of paragraphs) {
      const lines = doc.splitTextToSize(paragraph, contentWidth);
      for (const line of lines) {
        if (yPosition > 780) {
          // Add new page if content exceeds page limit
          doc.addPage();
          yPosition = 50;
        }

        // Apply bold formatting to marked text
        const boldParts = line.split('@@');
        for (let i = 0; i < boldParts.length; i++) {
          if (i % 2 === 1) {
            doc.setFont('helvetica', 'bold');
            doc.text(boldParts[i], marginLeft, yPosition, { align: 'justify' });
            doc.setFont('helvetica', 'normal');
          } else {
            doc.text(boldParts[i], marginLeft, yPosition, { align: 'justify' });
          }
        }
        yPosition += 15;
      }
      yPosition += 10; // Add spacing between paragraphs
    }

    // Save the final PDF with the user-provided filename
    if (filename.includes('.pdf')) {
      doc.save(filename);
    } else {
      doc.save(`${filename}.pdf`);
    }
  };

  return (
    <div className="input-form">
      {showPaymentPrompt ? (
        <div className="payment-prompt">
          <h2>You've used all your free cover letters</h2>
          <p>Upgrade now to generate unlimited cover letters for just $5/month.</p>
          <button onClick={handleUpgrade} className="upgrade-button">
            Upgrade Now
          </button>
          <button 
            onClick={() => setShowPaymentPrompt(false)} 
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="uses-counter">
            <p>Cover letters remaining: <span>{usesRemaining}</span></p>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={resumeUploaded}
              required
            />
            <textarea
              placeholder="Enter Job Description"
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              required
              rows={10}
              cols={50}
            />
            <button type="submit">Generate Cover Letter</button>
          </form>
          {error && <p className="error">{error}</p>}
          {generatedResponse && (
            <div className="generated-response">
              <h2>Generated Response:</h2>
              <p>Cover Letter: {generatedResponse.choices[0].message.content}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InputForm;
