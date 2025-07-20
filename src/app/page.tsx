"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [activeTab, setActiveTab] = useState('writer');
  const [cv, setCv] = useState({
    name: '',
    email: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
  });
  const [jobUrl, setJobUrl] = useState('');
  const [tailoredCv, setTailoredCv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load CV from local storage on component mount
    const savedCv = localStorage.getItem('userCv');
    if (savedCv) {
      setCv(JSON.parse(savedCv));
    }
  }, []);

  useEffect(() => {
    // Save CV to local storage whenever it changes
    localStorage.setItem('userCv', JSON.stringify(cv));
  }, [cv]);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCv((prevCv) => ({
      ...prevCv,
      [name]: value,
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('cvFile', file);

    try {
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload and parse CV.');
      }

      const data = await response.json();
      setCv((prevCv) => ({
        ...prevCv,
        summary: data.text, // Assuming the parsed text can be set as summary or a new field
        // You might want to parse the uploaded CV more granularly here
      }));
      alert('CV uploaded and parsed successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTailoredCv('');

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cv, jobUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const data = await response.json();
      setTailoredCv(data.tailoredCv);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mt-5">
      <h1 className="mb-4 text-center">AI CV Builder</h1>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'writer' ? 'active' : ''}`}
            onClick={() => setActiveTab('writer')}
          >
            CV Writer
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tailor' ? 'active' : ''}`}
            onClick={() => setActiveTab('tailor')}
          >
            CV Tailor
          </button>
        </li>
      </ul>

      {activeTab === 'writer' && (
        <div>
          <h2>Your CV Content</h2>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input type="text" className="form-control" id="name" name="name" value={cv.name} onChange={handleCvChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="email" className="form-control" id="email" name="email" value={cv.email} onChange={handleCvChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="summary" className="form-label">Summary</label>
            <textarea className="form-control" id="summary" name="summary" rows={5} value={cv.summary} onChange={handleCvChange} required></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="experience" className="form-label">Work Experience</label>
            <textarea className="form-control" id="experience" name="experience" rows={7} value={cv.experience} onChange={handleCvChange} required></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="education" className="form-label">Education</label>
            <textarea className="form-control" id="education" name="education" rows={3} value={cv.education} onChange={handleCvChange} required></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="skills" className="form-label">Skills</label>
            <textarea className="form-control" id="skills" name="skills" rows={3} value={cv.skills} onChange={handleCvChange} required></textarea>
          </div>
        </div>
      )}

      {activeTab === 'tailor' && (
        <form onSubmit={handleSubmit}>
          <h2>Tailor Your CV</h2>
          <div className="mb-3">
            <label htmlFor="cvUpload" className="form-label">Upload CV (PDF/DOCX/MD)</label>
            <input
              type="file"
              className="form-control"
              id="cvUpload"
              accept=".pdf,.docx,.md"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <div className="text-info">Uploading and parsing...</div>}
          </div>
          <div className="mb-3">
              <label htmlFor="jobUrl" className="form-label">Indeed Job URL</label>
              <input
                  type="url"
                  className="form-control"
                  id="jobUrl"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://www.indeed.com/viewjob?jk=..."
                  required
              />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading || uploading}>
            {isLoading ? 'Tailoring...' : 'Tailor CV'}
          </button>

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          <h2 className="mt-4">Tailored CV Output</h2>
          <div className="card">
            <div className="card-body">
              {isLoading && (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <ReactMarkdown>{tailoredCv}</ReactMarkdown>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}