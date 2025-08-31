'use client';

import "./InputForm.css";
import React, { useState } from "react";
import jsPDF from "jspdf";
import { pdfToText } from "pdf-ts";
import { useAuth } from "../contexts/AuthContext";

export default function InputForm() {
  const { token, user, fetchUserProfile } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatedResponse, setGeneratedResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [showBuyKey, setShowBuyKey] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [byokError, setByokError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Handle resume upload and parsing
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setResumeFile(file);
    let extractedText = "";
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      extractedText = await pdfToText(buffer);
    } else {
      extractedText = await file.text();
    }
    setResumeText(extractedText);
  };

  // Submit cover letter generation
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setGeneratedResponse('')
    if (!jobDescription.trim())
      return setError("Please enter a job description.");
    if (!resumeText) return setError("No resume uploaded.");

    // Quota enforcement for STANDARD MODE only
    if (user.mode !== 'byok' && (user?.quota ?? 0) <= 0) {
      setShowPaymentPrompt(true);
      return;
    }
    try {
      const prompt = `Assume you are well-versed in job application processes and crafting professional cover letters. Given the attached job description and resume, generate a formal cover letter tailored for the specified position. The cover letter should follow a professional business letter format with the following structure: 1. **Introduction:** Include a formal greeting, state the position applied for, mention how the position was discovered, and briefly express enthusiasm for the opportunity. 2. **Body:** Highlight relevant skills, experiences, and qualifications that align with the job requirements. Focus on transferable skills if there is any gap between the resume and job requirements. 3. **Closing:** Express gratitude, indicate interest in discussing the role further, and include a professional sign-off. **Important Formatting Guidelines:** - Do not include placeholders, variable markers, or template references such as '[Job Listing Source]' or '[Company Name]'. - Do not include section headings like "Introduction," "Body," or "Closing." - Email and LinkedIn URLs should be presented as plain text without square brackets or hyperlink tags. - Exclude duplicate content such as the applicant's contact information, date. - Ensure the content is concise, aligned properly, and does not include analysis or commentary about the generated content. - Provide only the main content of the cover letter, formatted for direct insertion into a PDF, without introductory explanations or extra meta-information. - Donot include additional information in the closing part, except for greetings and candidate name`;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/coverletter/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt, resumeText, jobDescription }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Generation failed.");
      setGeneratedResponse(data);
      // Refresh quota or BYOK info from backend
      await fetchUserProfile();
      setJobDescription("");
    } catch (e) {
      setError("Error contacting server");
    }
  };

  // Handle Stripe payment redirect (upgrade standard)
  const handleUpgrade = () => {
    window.location.href = "https://buy.stripe.com/test_YOUR_PRODUCT_ID";
  };

  // Handle BYOK (Bring Your Own Key)
  const handleBYOK = async (e) => {
    e.preventDefault();
    setByokError("");
    if (!customKey.trim()) {
      setByokError("Please enter a valid API key.");
      return;
    }
    // You should charge here before enabling BYOK!
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/use-endpoint-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customApiKey: customKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setByokError(data.message || "Failed to enable BYOK.");
        return;
      }
      setShowBuyKey(false);
      setShowPaymentPrompt(false);
      setCustomKey("");
      setResumeFile(null)
      setJobDescription("")
      await fetchUserProfile();
    } catch {
      setByokError("Error updating your key.");
    }
  };

  // Generate and download PDF using jsPDF
  const handleDownloadPDF = () => {
    if (!generatedResponse) return;
    setDownloading(true);
    try {
      const userDetails = user || {};
      const filename =
        prompt("Enter filename for the cover letter (e.g., MyCoverLetter):") ||
        "MyCoverLetter";
      const doc = new jsPDF("p", "pt", "a4");
      doc.setFont("helvetica", "normal");
      const marginLeft = 50;
      const contentWidth = 500;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${userDetails.fullName || ""}`, marginLeft, 50);
      doc.setFont("helvetica", "normal");
      if (userDetails.address)
        doc.text(`${userDetails.address}`, marginLeft, 65);
      if (userDetails.phone) doc.text(`${userDetails.phone}`, marginLeft, 80);
      if (userDetails.email) doc.text(`${userDetails.email}`, marginLeft, 95);
      if (userDetails.linkedin)
        doc.text(`${userDetails.linkedin}`, marginLeft, 110);
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(today, marginLeft, 140);

      let coverLetterText =
        generatedResponse.coverLetter ||
        generatedResponse.choices?.[0]?.message?.content ||
        "";
      coverLetterText = coverLetterText.replace(
        /\*\*(.*?)\*\*/g,
        (m, p) => `@@${p}@@`
      );
      let yPosition = 195;
      const paragraphs = coverLetterText.split("\n\n");
      for (const paragraph of paragraphs) {
        const lines = doc.splitTextToSize(paragraph, contentWidth);
        for (const line of lines) {
          if (yPosition > 780) {
            doc.addPage();
            yPosition = 50;
          }
          const boldParts = line.split("@@");
          for (let i = 0; i < boldParts.length; i++) {
            if (i % 2 === 1) {
              doc.setFont("helvetica", "bold");
              doc.text(boldParts[i], marginLeft, yPosition, {
                align: "justify",
              });
              doc.setFont("helvetica", "normal");
            } else {
              doc.text(boldParts[i], marginLeft, yPosition, {
                align: "justify",
              });
            }
          }
          yPosition += 15;
        }
        yPosition += 10;
      }
      doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="input-form">
      {showPaymentPrompt ? (
        <div className="payment-prompt">
          <h2>You've used all your free cover letters</h2>
          <p className="disclaimer">Upgrade to generate unlimited cover letters.</p>
          <button onClick={handleUpgrade} className="upgrade-button">
            Buy More (Standard)
          </button>
          <button
            onClick={() => setShowBuyKey(true)}
            className="upgrade-button alt"
          >
            Enter Your Own Endpoint Key (BYOK)
          </button>
          <button
            onClick={() => setShowPaymentPrompt(false)}
            className="cancel-button"
          >
            Cancel
          </button>
          {showBuyKey && (
            <form className="byok-form" onSubmit={handleBYOK}>
              <input
                type="text"
                placeholder="Enter your AI API Key"
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                className="input"
                autoFocus
                required
              />
              <button>Activate BYOK</button>
              {byokError && <div className="error">{byokError}</div>}
            </form>
          )}
        </div>
      ) : (
        <>
          <div className="uses-counter">
            {user.mode === "byok" ? (
              <p>BYOK Mode: Using your own API key.</p>
            ) : (
              <p>
                Cover letters remaining: <span>{user?.quota ?? 0}</span>
              </p>
            )}
          </div>
          <form className="generator-form" onSubmit={handleSubmit}>
            <div className="resume-upload">
              <input
                type="file"
                id="resumeInput"
                onChange={handleFileChange}
                required
                style={{ display: "none" }}
                accept=".pdf"
              />
              <label htmlFor="resumeInput" className="resume-upload-btn">
                Choose Your Resume
              </label>
              {resumeFile && (
                <div className="resume-filename">{resumeFile.name}</div>
              )}
            </div>
            <textarea
              placeholder="Enter Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              required
            />
            <button type="submit">Generate Cover Letter</button>
          </form>
          {error && <p className="error">{error}</p>}
          {generatedResponse && (
            <div className="generated-response">
              <h2>Generated Cover Letter</h2>
              <button
                className="download-btn"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? "Preparing PDF..." : "Download as PDF"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
