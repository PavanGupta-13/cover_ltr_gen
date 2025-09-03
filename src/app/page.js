"use client";

import "./globals.css";
import React from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import InputForm from "./components/InputForm";

function AppContent() {
  const { data: session, status } = useSession();

  // Professional colors and effects
  // const background = "linear-gradient(120deg, #eef3fa 0%, #f9fafe 100%)";
  const cardBg = "#fff";
  const accent = "#0d72ec";

  if (status === "loading")
    return (
      <div
        style={{
          // minHeight: "100vh",
          // background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
        {/* <div
          style={{
            fontWeight: 600,
            fontSize: "1.5rem",
            color: accent,
          }}
        >
          Loading...
        </div> */}
      </div>
    );

  if (!session) {
    return (
      <main
        style={{
          // background,
          // minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            boxShadow: "0 8px 40px rgba(10,38,65,0.10)",
            borderRadius: "1.4rem",
            padding: "2.8rem 2.4rem 2.6rem 2.4rem",
            maxWidth: "355px",
            background: cardBg,
            width: "100%",
            textAlign: "center",
            border: "1px solid #ebeff4",
          }}
        >
          <img
            src="/signinpageimage.jpeg"
            alt="Sign up illustration"
            style={{
              width: "112px",
              borderRadius: "12px",
              marginBottom: "1.6rem",
              boxShadow: "0 2px 14px #b0d0fa33",
            }}
          />
          <h1
            style={{
              color: "#191f33",
              fontSize: "1.30rem",
              letterSpacing: "-0.03em",
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: "0.6rem",
            }}
          >
            Effortless Cover Letters
          </h1>
          <div
            style={{
              color: "#4a607a",
              fontSize: "1.025rem",
              fontWeight: 500,
              marginBottom: "1.8rem",
              lineHeight: 1.6,
              opacity: 0.88,
            }}
          >
            Generate personalised, professional cover letters in seconds.
            <br /> Just upload your resume and job description.
          </div>
          <button
            onClick={() => signIn("google")}
            style={{
              background: "#fff",
              color: "#232a3e",
              border: "1.5px solid #e3e9f3",
              fontWeight: 600,
              boxShadow: "0 2px 8px #4285f440",
              fontSize: "1.06rem",
              borderRadius: "8px",
              padding: "0.77rem 1.2rem",
              cursor: "pointer",
              margin: "0 auto 0 auto",
              display: "flex",
              alignItems: "center",
              gap: "0.67em",
              outline: "none",
              transition: "border 0.19s, box-shadow 0.16s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.border = `1.5px solid ${accent}`)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.border = "1.5px solid #e3e9f3")
            }
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              style={{ width: "1.35em", height: "1.35em" }}
            />
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  // Authenticated
  return (
    <div
      style={{
        // minHeight: "100vh",
        // background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "3.7rem auto 0 auto",
          background: cardBg,
          borderRadius: "1.1rem",
          boxShadow: "0 4px 40px rgba(10,28,77,0.13)",
          padding: "2.4rem 2.2rem 2rem 2.2rem",
          border: "1.5px solid #e6eefa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.2rem",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "1.13rem",
              color: accent,
              opacity: 0.95,
            }}
          >
            Welcome, {session.user.name || session.user.email}
          </span>
          <button
            style={{
              border: "none",
              background: "#f0f2f9",
              color: accent,
              fontWeight: 600,
              borderRadius: "7px",
              padding: "0.47rem 1.5rem",
              fontSize: "0.98rem",
              cursor: "pointer",
              outline: "none",
              transition: "background 0.18s",
            }}
            onClick={() => signOut()}
          >
            Log out
          </button>
        </div>
        <InputForm />
      </div>
    </div>
  );
}

export default function Home({ session }) {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
