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
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callAI = async (prompt: string, key: string, model: string) => {
    if (!key) throw new Error("Missing API key");
    try {
      const genAI = new GoogleGenAI({ apiKey: key });
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text?.trim() ?? null;
    } catch (e: any) {
      const message = e?.message || "Unknown API error";
      throw new Error(message);
    }
  };

  const normalizeModelName = (modelName: string) => {
    return modelName.replace(/^models\//, '');
  };

  const getModelCandidates = async (key: string): Promise<string[]> => {
    const fallback = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.0", "gemini-2.0", "gemini-alpha"];
    if (!key) return fallback;

    try {
      const genAI = new GoogleGenAI({ apiKey: key });
      const listResponse = await genAI.models.list();
      const available: string[] = [];
      for await (const model of listResponse) {
        const name = model?.name?.toString?.().trim();
        if (name && !available.includes(name)) {
          available.push(name);
        }
      }

      if (!available.length) return fallback;

      const bestFirst = ["gemini-2.5-flash", "gemini-2.1-flash", "gemini-1.5-flash", "gemini-1.0-flash"];
      const prioritized = Array.from(
        new Set([
          ...bestFirst.filter((name) => available.includes(name)),
          ...available,
          ...fallback,
        ])
      );
      return prioritized;
    } catch {
      return fallback;
    }
  };

  const safeCallAI = async (prompt: string, key: string): Promise<{ text: string; model: string }> => {
    const errorMessages: string[] = [];
    const models = await getModelCandidates(key);

    for (const model of models) {
      try {
        const normalizedModel = normalizeModelName(model);
        const result = await callAI(prompt, key, model);
        if (result) return { text: result, model: normalizedModel };
        errorMessages.push(`Empty response from ${model}`);
      } catch (e: any) {
        const errMsg = e?.message?.toString() || "Unknown AI error";
        errorMessages.push(`${model}: ${errMsg}`);
        continue;
      }
    }

    throw new Error(`All model attempts failed: ${errorMessages.join(" | ")}`);
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

    if (!input.trim()) {
      setError("Please enter a conditional statement.");
      setLoading(false);
      return;
    }

    try {
      let p: string, q: string;
      let effectiveModel: string | null = null;

      const parsed = parseStatement(input);

      if (parsed) {
        p = parsed.p;
        q = parsed.q;
      } else {
        const reformatPrompt = `Reformat the following statement into a standard "If p, then q" structure. Return only the reformatted statement, nothing else. Input: "${input}"`;
        const reformattedResponse = await safeCallAI(reformatPrompt, apiKey);
        effectiveModel = reformattedResponse.model;
        const reformatted = reformattedResponse.text;

      const newParsed = reformatted ? parseStatement(reformatted) : null;
      if (newParsed && newParsed.p && newParsed.q) {
        p = newParsed.p;
        q = newParsed.q;
      } else {
        const finalAttemptPrompt = `Extract the cause (p) and effect (q) from this statement and return it *only* as a JSON object like {"p": "...", "q": "..."}. Statement: "${reformatted}"`;
        const jsonResultResponse = await safeCallAI(finalAttemptPrompt, apiKey);
        effectiveModel = jsonResultResponse.model;
        const parsedJson = JSON.parse(jsonResultResponse.text || '{}');
          if (parsedJson.p && parsedJson.q) {
            p = parsedJson.p;
            q = parsedJson.q;
          } else {
            throw new Error("AI response was not in the expected format.");
          }
        }
      }

      const negatePResponse = await safeCallAI(`Provide only the grammatically correct negation of: "${p}". Do not include any additional text, explanations, or punctuation beyond the negation itself.`, apiKey);
      const negateQResponse = await safeCallAI(`Provide only the grammatically correct negation of: "${q}". Do not include any additional text, explanations, or punctuation beyond the negation itself.`, apiKey);

      const notP = negatePResponse.text;
      const notQ = negateQResponse.text;
      effectiveModel = normalizeModelName(negateQResponse.model || negatePResponse.model || effectiveModel || '');

      if (!notP || !notQ) {
        throw new Error("AI could not generate negations");
      }

      setUsedModel(effectiveModel);
      setStatements({
        original: `If ${p}, then ${q}.`,
        converse: `If ${q}, then ${p}.`,
        inverse: `If ${notP}, then ${notQ}.`,
        contrapositive: `If ${notQ}, then ${notP}.`,
      });
    } catch (e: any) {
      setError(`AI API Error: ${e?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Generate Conditional Statements</h2>
      <p className="page-description">
        Enter a conditional statement, and the AI will attempt to format and process it.
      </p>
      <p className="page-description">
        To use this app, create a Google Cloud API key and enable the AI APIs in your project.
      </p>
      <p className="page-description">
        Follow the docs: <a href="https://cloud.google.com/docs/authentication/api-keys" target="_blank" rel="noreferrer">Google Cloud API key docs</a>&nbsp;
        and manage credentials at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Google Cloud Console</a>.
      </p>
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
            placeholder="e.g., if it is raining, then the ground is wet"
            disabled={loading}
          />
        </div>
        <div className="input-container button-row">
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Generate'}
          </button>
          {loading && <div className="loader"></div>}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}

      {statements && (
        <div className="results">
          {usedModel && <p className="model-info">Generated by model: {usedModel}</p>}
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
