"use client";

import { useState } from 'react';

export default function Home() {
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

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCv((prevCv) => ({
      ...prevCv,
      [name]: value,
    }));
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

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <h2>Your CV</h2>
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

          <div className="col-md-6">
            <h2>Job Link</h2>
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
            <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
              {isLoading ? 'Tailoring...' : 'Tailor CV'}
            </button>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            <h2 className="mt-4">Tailored CV</h2>
            <div className="card">
              <div className="card-body">
                {isLoading && (
                  <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{tailoredCv}</pre>
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}