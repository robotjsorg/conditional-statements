import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import './HomePage.css';

interface Statements {
  original: string;
  converse: string;
  inverse: string;
  contrapositive: string;
}

const HomePage = () => {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [statements, setStatements] = useState<Statements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callAI = async (prompt: string, key: string) => {
    try {
      const genAI = new GoogleGenAI(key as any);
      const model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (e: any) {
      setError(`AI API Error: ${e.message}`);
      return null;
    }
  };

  const parseStatement = (statement: string): { p: string; q: string } | null => {
    const standardized = statement.toLowerCase().trim().replace(/\.$/, '');
    const match = standardized.match(/^if\s+(.*),\s*then\s+(.*)$/);
    if (match && match[1] && match[2]) {
      const p = match[1].trim();
      const q = match[2].trim();
      if (p && q) {
        return { p, q };
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatements(null);
    setLoading(true);

    if (!apiKey) {
      setError("Please enter your API key.");
      setLoading(false);
      return;
    }

    let p: string, q: string;

    const parsed = parseStatement(input);

    if (parsed) {
      p = parsed.p;
      q = parsed.q;
    } else {
      const reformatPrompt = `Reformat the following statement into a standard "If p, then q" structure. If the statement is nonsensical or cannot be reasonably reformatted, create a clear, simple "if-then" statement based on any discernible intent. Input: "${input}"`;
      const reformatted = await callAI(reformatPrompt, apiKey);

      if (reformatted) {
        const newParsed = parseStatement(reformatted);
        if (newParsed) {
          p = newParsed.p;
          q = newParsed.q;
        } else {
           const finalAttemptPrompt = `Extract the cause (p) and effect (q) from this statement and return it *only* as a JSON object like {"p": "...", "q": "..."}. Statement: "${reformatted}"`;
           const jsonResult = await callAI(finalAttemptPrompt, apiKey);
           try {
             const parsedJson = JSON.parse(jsonResult || '{}');
             if (parsedJson.p && parsedJson.q) {
               p = parsedJson.p;
               q = parsedJson.q;
             } else {
                throw new Error("AI response was not in the expected format.");
             }
           } catch {
              setError("The AI was unable to process the statement. Please try rephrasing your input.");
              setLoading(false);
              return;
           }
        }
      } else {
         setLoading(false);
         return;
      }
    }

    const negateP = callAI(`Provide the grammatically correct negation of the following phrase: "${p}"`, apiKey);
    const negateQ = callAI(`Provide the grammatically correct negation of the following phrase: "${q}"`, apiKey);

    const [notP, notQ] = await Promise.all([negateP, negateQ]);

    if (!notP || !notQ) {
        setLoading(false);
        return;
    }
    
    setStatements({
        original: `If ${p}, then ${q}.`,
        converse: `If ${q}, then ${p}.`,
        inverse: `If ${notP}, then ${notQ}.`,
        contrapositive: `If ${notQ}, then ${notP}.`,
    });

    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Generate Conditional Statements</h2>
      <p className="page-description">Enter a conditional statement, and the AI will attempt to format and process it.</p>
      <form onSubmit={handleSubmit} className={`statement-form ${loading ? 'loading' : ''}`}>
        <div className="input-container">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            disabled={loading}
          />
          </div>
          <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., if a humanoid robot is safe, then it cannot harm a human"
            disabled={loading}
          />
          {loading && <div className="loader"></div>}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Generate'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {statements && (
        <div className="results">
          <h3>Generated Statements</h3>
          <div className="statement-grid">
            <div className="statement-result-card">
              <h4>Original</h4>
              <p>{statements.original}</p>
            </div>
            <div className="statement-result-card">
              <h4>Converse</h4>
              <p>{statements.converse}</p>
            </div>
            <div className="statement-result-card">
              <h4>Inverse</h4>
              <p>{statements.inverse}</p>
            </div>
            <div className="statement-result-card">
              <h4>Contrapositive</h4>
              <p>{statements.contrapositive}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
