"use client";

import "./InputForm.css";
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { pdfToText } from "pdf-ts";
import { useSession, signIn } from "next-auth/react";

export default function InputForm() {
  const { data: session, status } = useSession();

  // Profile creation state
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
  });
  const [profileFormError, setProfileFormError] = useState(null);

  // User info from backend
  const [userProfile, setUserProfile] = useState(undefined);
  const [profileLoading, setProfileLoading] = useState(false);

  // Resume/Cover Letter states
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

  // Example for /payment-status page/component
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referenceId = params.get("reference_id");

    if (!referenceId) return;

    const checkAndCompleteBYOK = async () => {
      // 1. Query payment status from your backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-payment-status?reference_id=${referenceId}`
      );
      const data = await res.json();

      if (data.link_status === "PAID") {
        // 2. If user had pending BYOK flow
        const pendingMode = window.localStorage.getItem("pending_payment_mode");
        const pendingKey = window.localStorage.getItem("pending_byok_api_key");
        if (pendingMode === "byok" && pendingKey) {
          // 3. Submit BYOK key!
          const keyRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/use-endpoint-key`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customApiKey: pendingKey,
                email: session.user.email,
              }),
            }
          );
          // 4. Clear stored values regardless of success/failure
          window.localStorage.removeItem("pending_byok_api_key");
          window.localStorage.removeItem("pending_payment_mode");
          // Show success, update UI/profile, etc.
        }
      }
    };

    checkAndCompleteBYOK();
  }, []);

  // 1. After Google sign-in, try to fetch profile info
  useEffect(() => {
    if (!session?.user?.email) {
      setUserProfile(undefined);
      return;
    }
    setProfileLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((profile) => {
        // Check if meaningful profile fields exist, else treat as not created
        if (profile.fullName && profile.phone) {
          setUserProfile(profile);
        } else {
          setUserProfile(null); // Profile missing info, must fill form
        }
        setProfileLoading(false);
      })
      .catch(() => {
        setUserProfile(null); // Profile not found
        setProfileLoading(false);
      });
  }, [session?.user?.email]);

  // 2. Profile form handlers
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      setProfileFormError("Please fill all fields.");
      return;
    }
    setProfileFormError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            fullName: form.fullName,
            phone: form.phone,
          }),
        }
      );
      if (!res.ok) throw new Error("Could not create profile.");
      const profile = await res.json();
      setUserProfile(profile);
    } catch {
      setProfileFormError("Could not create profile.");
    }
  };

  // 3. Profile UI logic
  if (status === "loading" || profileLoading)
    return (
      <div>
        {" "}
        <img
          src="/loadingimage.jpeg"
          alt="Sign up illustration"
          style={{
            width: "180px",
            maxWidth: "90vw",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            marginBottom: "2rem",
          }}
        />
      </div>
    );
  if (!session) {
    // Not signed in, show Google login only
    return (
      <div className="profile-form">
        <h2>Sign in to Continue</h2>
        <img
          src="/signinpageimage.jpeg"
          alt="Sign up illustration"
          style={{
            width: "180px",
            maxWidth: "90vw",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            marginBottom: "2rem",
          }}
        />
        <button onClick={() => signIn("google")}>Sign in with Google</button>
      </div>
    );
  }
  if (userProfile === null) {
    // Signed in with Google, but no profile exists, show form
    return (
      <form className="profile-form" onSubmit={handleCreateProfile}>
        <h2>Create Your Profile to Continue</h2>
        <img
          src="/signinpageimage.jpeg"
          alt="Sign up illustration"
          style={{
            width: "180px",
            maxWidth: "90vw",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            marginBottom: "2rem",
          }}
        />
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleFormChange}
          placeholder="Full Name"
          required
        />
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleFormChange}
          placeholder="Phone"
          required
        />
        {profileFormError && <div className="error">{profileFormError}</div>}
        <button type="submit">Create Profile</button>
      </form>
    );
  }

  // ===== MAIN APP: resume upload, cover letter generation =====

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
    setGeneratedResponse("");
    if (!jobDescription.trim())
      return setError("Please enter a job description.");
    if (!resumeText) return setError("No resume uploaded.");
    if (
      userProfile &&
      userProfile.mode !== "byok" &&
      (userProfile?.quota ?? 0) <= 0
    ) {
      setShowPaymentPrompt(true);
      return;
    }
    try {
      const prompt = `Assume you are well-versed in job application processes and crafting professional cover letters. Given the attached job description and resume, generate a formal cover letter tailored for the specified position. The cover letter should follow a professional business letter format with the following structure: 1. **Introduction:** Include a formal greeting, state the position applied for, mention how the position was discovered, and briefly express enthusiasm for the opportunity. 2. **Body:** Highlight relevant skills, experiences, and qualifications that align with the job requirements. Focus on transferable skills if there is any gap between the resume and job requirements. 3. **Closing:** Express gratitude, indicate interest in discussing the role further, and include a professional sign-off. **Important Formatting Guidelines:** - Do not include placeholders, variable markers, or template references such as '[Job Listing Source]' or '[Company Name]'. - Do not include section headings like "Introduction," "Body," or "Closing." - Email and LinkedIn URLs should be presented as plain text without square brackets or hyperlink tags. - Exclude duplicate content such as the applicant's contact information, date. - Ensure the content is concise, aligned properly, and does not include analysis or commentary about the generated content. - Provide only the main content of the cover letter, formatted for direct insertion into a PDF, without introductory explanations or extra meta-information. - Donot include additional information in the closing part, except for greetings and candidate name`;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/coverletter/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            resumeText,
            jobDescription,
            email: session.user.email,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Generation failed.");
      setGeneratedResponse(data);
      // Refresh quota info
      if (session?.user?.email) {
        const profileRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
          }
        );
        setUserProfile(await profileRes.json());
      }
      setJobDescription("");
    } catch (e) {
      setError("Error contacting server");
    }
  };

  // Stripe payment redirect (upgrade standard)
  const handleUpgrade = async (amount = 275, mode = "regular") => {
    // You could store `mode` in localStorage too if needed for tracking
    window.localStorage.setItem("pending_payment_mode", mode);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/create-payment-link`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          amount,
        }),
      }
    );
    const data = await res.json();
    if (data.success) {
      window.location.href = data.paymentLink;
    } else {
      alert("Payment initiation failed: " + (data.error || ""));
    }
  };

  // Handle BYOK (Bring Your Own Key)
  const handleBYOK = async (e) => {
    e.preventDefault();
    setByokError("");
    if (!customKey.trim()) {
      setByokError("Please enter a valid API key.");
      return;
    }
    // Save key in localStorage/sessionStorage or global state for post-payment
    window.localStorage.setItem("pending_byok_api_key", customKey);
    // Trigger payment of 500
    await handleUpgrade(500, "byok"); // pass extra param as marker
  };

  // Generate and download PDF
  const handleDownloadPDF = () => {
    if (!generatedResponse) return;
    setDownloading(true);
    try {
      const userDetails = userProfile || {};
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

  // MAIN APP RENDER
  return (
    <div className="input-form">
      {showPaymentPrompt ? (
        <div className="payment-prompt">
          <h2>You've used all your free cover letters</h2>
          <p className="disclaimer">
            Upgrade to generate more cover letters.
          </p>
          <div className="button-group">
            <button onClick={handleUpgrade} className="upgrade-button">
              Buy More at&nbsp; <span style={{ fontWeight: 700 }}>₹275</span>{" "}
              <span style={{ color: "rgb(47 53 59)" }}>/ 10 Cover Letters</span>
            </button>
            <button
              onClick={() => setShowBuyKey(true)}
              className="upgrade-button alt"
              type="button"
            >
              <span role="img" aria-label="key" style={{ marginRight: 8 }}>
                🔑
              </span>{" "}
              Use your own AI API Key (BYOK)
            </button>
            <button
              onClick={() => setShowPaymentPrompt(false)}
              className="cancel-button"
              type="button"
            >
              Cancel
            </button>
          </div>

          {showBuyKey && (
            <form className="byok-form" onSubmit={handleBYOK} style={{paddingTop: '10px'}}>
              <input
                type="text"
                placeholder="Enter your AI API Key"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
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
            {userProfile?.mode === "byok" ? (
              <p>BYOK Mode: Using your own API key.</p>
            ) : (
              <p>
                Cover letters remaining: <span>{userProfile?.quota ?? 0}</span>
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
