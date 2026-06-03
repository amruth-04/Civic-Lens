import React, { useState } from 'react';
import './App.css';

export default function App() {
    const [income, setIncome] = useState('');
    const [taxPaid, setTaxPaid] = useState('');
    const [regime, setRegime] = useState('new');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const formatRupees = (num) => "₹" + num.toLocaleString('en-IN');
    const formatCurrencyShort = (num) => {
        if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + " Cr";
        if (num >= 100000) return "₹" + (num / 100000).toFixed(2) + " L";
        return formatRupees(num);
    };

    const handleCalculate = async () => {
        setError('');
        if (!income && !taxPaid) {
            setError("Please enter your annual income or tax paid.");
            return;
        }

        setLoading(true);
        try {
            // This is where React talks to your Python backend!
            const response = await fetch('http://localhost:8000/api/v1/tax-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    income: parseFloat(income) || 0,
                    tax_paid: parseFloat(taxPaid) || 0,
                    regime: regime
                })
            });

            if (!response.ok) throw new Error('Failed to connect to the backend server. Make sure Python is running!');
            const data = await response.json();
            
            if (data.total_tax === 0) {
                setError("Based on this income/regime, your tax liability is ₹0.");
                setResults(null);
            } else {
                setResults(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderDonutChart = () => {
        if (!results) return null;
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        let cumulativePercent = 0;

        return (
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="28" />
                {results.breakdown.map((item, i) => {
                    const dashArray = (item.percent / 100) * circumference;
                    const dashOffset = -(cumulativePercent / 100) * circumference;
                    cumulativePercent += item.percent;
                    return (
                        <circle
                            key={i} cx="110" cy="110" r={radius}
                            fill="none" stroke={item.color} strokeWidth="28"
                            strokeDasharray={`${dashArray} ${circumference}`}
                            strokeDashoffset={dashOffset} strokeLinecap="butt"
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <div className="container">
            <header>
                <div className="flag-stripe"><span></span><span></span><span></span></div>
                <h1>Civic Lens</h1>
                <p>See exactly where your tax money goes</p>
            </header>

            {!results ? (
                <div className="card" id="inputSection">
                    {error && <div className="error-msg">{error}</div>}
                    <div className="input-row">
                        <div className="input-group">
                            <label>Annual Income (₹)</label>
                            <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 1200000" />
                        </div>
                        <div className="input-group">
                            <label>Tax Regime</label>
                            <select value={regime} onChange={e => setRegime(e.target.value)}>
                                <option value="new">New Regime (Default)</option>
                                <option value="old">Old Regime</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <label>Tax Paid (₹) — or leave blank to auto-calculate</label>
                        <input type="number" value={taxPaid} onChange={e => setTaxPaid(e.target.value)} placeholder="e.g. 85000" />
                    </div>

                    <button className="btn" onClick={handleCalculate} disabled={loading}>
                        {loading ? 'Calculating...' : 'Show Me Where My Tax Goes'}
                    </button>
                </div>
            ) : (
                <div className="card" id="resultsSection">
                    <div className="results-header">
                        <h2>Your Tax Breakdown</h2>
                        <div className="tax-badge">{formatRupees(results.total_tax)}</div>
                    </div>

                    <div className="chart-container">
                        <div className="donut-chart">
                            {renderDonutChart()}
                            <div className="donut-center">
                                <div className="label">Tax Paid</div>
                                <div className="value">{formatCurrencyShort(results.total_tax)}</div>
                            </div>
                        </div>
                        <div className="legend">
                            {results.breakdown.map((item, i) => (
                                <div key={i} className="legend-item">
                                    <div className="legend-color" style={{ background: item.color }}></div>
                                    <span className="legend-text">{item.name}</span>
                                    <span className="legend-amount">{formatCurrencyShort(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="breakdown-list">
                        {results.breakdown.map((item, i) => (
                            <div key={i} className="breakdown-item" style={{ borderLeftColor: item.color }}>
                                <div className="breakdown-top">
                                    <span className="breakdown-name">{item.name}</span>
                                    <span className="breakdown-amount" style={{ color: item.color }}>{formatRupees(item.amount)}</span>
                                </div>
                                <p className="breakdown-desc">{item.desc}</p>
                                <div className="progress-bg" style={{ marginTop: '10px' }}>
                                    <div className="progress-fill" style={{ background: item.color, width: `${item.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn reset-btn" onClick={() => { setResults(null); setError(''); }}>
                        ← Calculate Again
                    </button>
                </div>
            )}
        </div>
    );
}