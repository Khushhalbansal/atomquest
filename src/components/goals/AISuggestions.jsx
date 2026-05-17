import { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import './AISuggestions.css';

// Pre-built AI suggestions by category (no external API needed)
const SMART_SUGGESTIONS = {
  'Performance': [
    { title: 'Reduce API response time by 40%', description: 'Profile and optimize critical API endpoints to reduce p95 latency from 800ms to 480ms through caching, query optimization, and connection pooling.', weightage: 25 },
    { title: 'Achieve 99.9% uptime SLA', description: 'Implement automated failover, health checks, and circuit breaker patterns to maintain 99.9% service availability across all production endpoints.', weightage: 30 },
    { title: 'Improve page load speed to under 2s', description: 'Optimize frontend bundle size, implement lazy loading, CDN caching, and image optimization to achieve sub-2-second initial page load times.', weightage: 20 },
  ],
  'Innovation': [
    { title: 'Build ML-powered recommendation engine', description: 'Design and deploy a machine learning recommendation system using collaborative filtering to increase user engagement by 25%.', weightage: 30 },
    { title: 'Implement real-time collaboration features', description: 'Add WebSocket-based real-time editing and commenting capabilities to enable simultaneous multi-user document collaboration.', weightage: 25 },
    { title: 'Create automated testing framework', description: 'Develop an AI-assisted test generation framework that automatically creates unit and integration tests from user stories.', weightage: 20 },
  ],
  'Learning & Development': [
    { title: 'Complete cloud architecture certification', description: 'Achieve AWS/GCP/Azure professional certification covering distributed systems, security, migration strategies, and cost optimization.', weightage: 20 },
    { title: 'Lead 4 technical knowledge-sharing sessions', description: 'Organize and present monthly tech talks on emerging technologies, architectural patterns, and lessons learned from production incidents.', weightage: 15 },
    { title: 'Master a new programming language', description: 'Achieve intermediate proficiency in Rust/Go/Kotlin through building a production-ready side project and contributing to open source.', weightage: 15 },
  ],
  'Process Improvement': [
    { title: 'Increase test coverage to 90%', description: 'Raise unit and integration test coverage from current baseline to 90% across all critical business logic paths and user interaction flows.', weightage: 20 },
    { title: 'Reduce deployment cycle time by 50%', description: 'Streamline CI/CD pipeline with parallel testing, caching layers, and automated rollback to cut deployment time from 30 to 15 minutes.', weightage: 25 },
    { title: 'Implement automated code review standards', description: 'Set up linting, static analysis, and automated PR templates to ensure consistent code quality and reduce review turnaround time.', weightage: 15 },
  ],
  'Revenue': [
    { title: 'Increase conversion rate by 15%', description: 'Optimize landing pages, implement A/B testing framework, and improve checkout flow to increase customer conversion rate by 15%.', weightage: 30 },
    { title: 'Launch customer referral program', description: 'Design and implement a multi-tier referral program with tracking, rewards, and analytics to drive organic customer acquisition.', weightage: 25 },
    { title: 'Reduce customer churn by 20%', description: 'Implement predictive churn models, automated engagement campaigns, and improved onboarding to reduce monthly churn by 20%.', weightage: 25 },
  ],
  'Leadership': [
    { title: 'Mentor 3 junior developers', description: 'Provide structured mentorship covering code reviews, architecture decisions, career development, and technical problem-solving skills.', weightage: 15 },
    { title: 'Lead cross-functional initiative', description: 'Drive a cross-team project involving engineering, design, and product to deliver a strategic company initiative within the quarter.', weightage: 25 },
    { title: 'Improve team sprint velocity by 20%', description: 'Identify and remove blockers, optimize sprint planning, and implement better estimation practices to increase team velocity.', weightage: 20 },
  ],
  'Customer Success': [
    { title: 'Reduce time-to-value by 50%', description: 'Redesign customer onboarding with guided tours, smart defaults, and progressive disclosure to halve the time from signup to first value realization.', weightage: 25 },
    { title: 'Achieve NPS score of 60+', description: 'Implement systematic feedback collection, rapid issue resolution, and proactive customer outreach to achieve an NPS score above 60.', weightage: 20 },
  ],
};

export default function AISuggestions({ category, onApply }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    setApplied(null);
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 1200));

    const cats = category ? [category] : Object.keys(SMART_SUGGESTIONS);
    const pool = cats.flatMap(c => SMART_SUGGESTIONS[c] || []);
    // Pick 3 random suggestions
    const shuffled = pool.sort(() => Math.random() - 0.5);
    setSuggestions(shuffled.slice(0, 3));
    setLoading(false);
  };

  const handleApply = (suggestion, index) => {
    setApplied(index);
    onApply(suggestion);
  };

  return (
    <div className="ai-suggestions">
      <button
        type="button"
        className="btn btn-ai"
        onClick={generateSuggestions}
        disabled={loading}
      >
        {loading ? (
          <>
            <RefreshCw size={14} className="ai-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={14} />
            GET AI SUGGESTIONS
          </>
        )}
      </button>

      {suggestions.length > 0 && (
        <div className="ai-results">
          {suggestions.map((s, i) => (
            <div key={i} className="ai-card">
              <h4 className="ai-card-title">{s.title}</h4>
              <p className="ai-card-desc">{s.description}</p>
              <div className="ai-card-footer">
                <span className="ai-card-weight">Suggested: {s.weightage}%</span>
                <button
                  type="button"
                  className={`btn btn-sm ${applied === i ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => handleApply(s, i)}
                  disabled={applied === i}
                >
                  {applied === i ? <><Check size={12} /> Applied</> : <><Copy size={12} /> Use This</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
