import { useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = "https://ats-resume-analyzer-9gpy.onrender.com";

function App() {
  const fileInputRef = useRef(null);

  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function validateAndSetFile(selectedFile) {
    setError("");
    setResult(null);

    if (!selectedFile) {
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setResume(null);
      setError("Please select a PDF file only.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (selectedFile.size > maximumFileSize) {
      setResume(null);
      setError("The PDF file must be smaller than 5 MB.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setResume(selectedFile);
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0] || null;
    validateAndSetFile(droppedFile);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function removeResume() {
    setResume(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function analyzeResume() {
    setError("");
    setResult(null);

    if (!resume) {
      setError("Please select a PDF resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter the job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("job_description", jobDescription.trim());

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Unable to analyze the resume."
        );
      }

      setResult(data);

      window.setTimeout(() => {
        document
          .getElementById("analysis-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    const reportUrl =
      result?.report_url || result?.download_url || "/download-report";

    window.open(
      `${API_BASE_URL}${reportUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function resetForm() {
    setResume(null);
    setJobDescription("");
    setResult(null);
    setError("");
    setDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function scoreLabel(score) {
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Moderate Match";
    return "Low Match";
  }

  function scoreMessage(score) {
    if (score >= 80) {
      return "Your resume is strongly aligned with this job description.";
    }

    if (score >= 60) {
      return "Your resume has a good match with a few areas to improve.";
    }

    if (score >= 40) {
      return "Your resume has a moderate match and needs targeted improvements.";
    }

    return "Your resume needs more relevant skills and stronger evidence.";
  }

  function formatFileSize(bytes) {
    if (!bytes) return "0 KB";

    const sizeInKb = bytes / 1024;

    if (sizeInKb < 1024) {
      return `${sizeInKb.toFixed(1)} KB`;
    }

    return `${(sizeInKb / 1024).toFixed(1)} MB`;
  }

  const score = Number(result?.score || 0);
  const matchedSkills = result?.matched_skills || [];
  const missingSkills = result?.missing_skills || [];
  const suggestions = result?.suggestions || [];

  return (
    <main className="app">
      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />

      <section className="card">
        <header className="header">
          <div className="project-badge">
            <span className="project-badge-dot" />
            Full-Stack Project
          </div>

          <h1>ATS Resume Analyzer</h1>

          <p className="subtitle">
            Compare your PDF resume with a job description and receive an
            instant skill-match report.
          </p>
        </header>

        <div className="form-section">
          <div className="section-heading">
            <span className="section-icon">1</span>

            <div>
              <h2>Upload your resume</h2>
              <p>PDF format only, maximum file size 5 MB.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            id="resume-input"
            className="hidden-file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
          />

          <div
            className={`upload-zone ${dragging ? "dragging" : ""} ${
              resume ? "has-file" : ""
            }`}
            onClick={openFilePicker}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                openFilePicker();
              }
            }}
          >
            <div className="upload-icon">
              {resume ? "✓" : "↑"}
            </div>

            {resume ? (
              <>
                <h3>{resume.name}</h3>
                <p>{formatFileSize(resume.size)} · PDF document</p>

                <div className="upload-actions">
                  <button
                    type="button"
                    className="small-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openFilePicker();
                    }}
                  >
                    Replace file
                  </button>

                  <button
                    type="button"
                    className="small-button danger-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeResume();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Drag and drop your resume here</h3>
                <p>
                  or <span>browse your computer</span>
                </p>
              </>
            )}
          </div>

          <div className="section-heading job-heading">
            <span className="section-icon">2</span>

            <div>
              <h2>Paste the job description</h2>
              <p>Include skills, responsibilities and role requirements.</p>
            </div>
          </div>

          <div className="textarea-wrapper">
            <textarea
              id="job-description"
              rows="11"
              placeholder="Paste the complete job description here..."
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setResult(null);
                setError("");
              }}
            />

            <span className="character-count">
              {jobDescription.length} characters
            </span>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={analyzeResume}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <span className="button-icon">✦</span>
                  Analyze Resume
                </>
              )}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
              disabled={loading}
            >
              Reset
            </button>
          </div>

          {loading && (
            <div className="loading-panel">
              <div className="loading-content">
                <span className="loading-pulse" />

                <div>
                  <strong>Analyzing your resume</strong>
                  <p>
                    Extracting skills and comparing them with the job
                    description.
                  </p>
                </div>
              </div>

              <div className="loading-bar">
                <span />
              </div>
            </div>
          )}

          {error && (
            <div className="error" role="alert">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {result && (
          <section className="result" id="analysis-result">
            <div className="result-top">
              <div
                className="score-circle"
                style={{ "--score": `${score * 3.6}deg` }}
              >
                <div className="score-circle-inner">
                  <strong>{score}%</strong>
                  <span>Match</span>
                </div>
              </div>

              <div className="score-summary">
                <p className="score-label">{scoreLabel(score)}</p>

                <h2>Your ATS analysis is ready</h2>

                <p>{scoreMessage(score)}</p>

                <div className="score-stats">
                  <div>
                    <strong>{result.matched_count ?? matchedSkills.length}</strong>
                    <span>Matched</span>
                  </div>

                  <div>
                    <strong>{missingSkills.length}</strong>
                    <span>Missing</span>
                  </div>

                  <div>
                    <strong>
                      {result.total_keywords ??
                        matchedSkills.length + missingSkills.length}
                    </strong>
                    <span>Detected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-heading">
                <span>Overall match progress</span>
                <strong>{score}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-value"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <div className="result-grid">
              <article className="result-card matched-card">
                <div className="result-card-heading">
                  <span className="result-card-icon matched-icon">✓</span>

                  <div>
                    <h3>Matched Skills</h3>
                    <p>Skills found in both your resume and the job description.</p>
                  </div>
                </div>

                {matchedSkills.length ? (
                  <div className="tags">
                    {matchedSkills.map((skill) => (
                      <span className="tag matched" key={skill}>
                        <span>✓</span>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">
                    No matching skills were detected.
                  </p>
                )}
              </article>

              <article className="result-card missing-card">
                <div className="result-card-heading">
                  <span className="result-card-icon missing-icon">!</span>

                  <div>
                    <h3>Missing Skills</h3>
                    <p>Important job-description skills not found in the resume.</p>
                  </div>
                </div>

                {missingSkills.length ? (
                  <div className="tags">
                    {missingSkills.map((skill) => (
                      <span className="tag missing" key={skill}>
                        <span>+</span>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message success-message">
                    Excellent! No important detected skills are missing.
                  </p>
                )}
              </article>
            </div>

            <article className="recommendation-card">
              <div className="result-card-heading">
                <span className="result-card-icon recommendation-icon">✦</span>

                <div>
                  <h3>Personalized Recommendations</h3>
                  <p>Actionable improvements based on the analysis.</p>
                </div>
              </div>

              {suggestions.length ? (
                <div className="suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div
                      className="suggestion-item"
                      key={`${suggestion}-${index}`}
                    >
                      <span>{index + 1}</span>
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">
                  No additional recommendations are available.
                </p>
              )}
            </article>

            <div className="result-actions">
              <button
                type="button"
                className="download-button"
                onClick={downloadReport}
              >
                <span>↓</span>
                Download ATS Report
              </button>

              <button
                type="button"
                className="analyze-another-button"
                onClick={resetForm}
              >
                Analyze Another Resume
              </button>
            </div>

            <p className="disclaimer">
              This analysis is a skill-matching estimate and not an official
              employer ATS score.
            </p>
          </section>
        )}
      </section>

      <footer className="footer">
        Built with React, FastAPI and Python
      </footer>
    </main>
  );
}

export default App;
              
