import React, { useState } from 'react';

const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        // Simulate API call
        setSubmitted(true);
        // TODO: Replace with actual API call
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
            <h2>Forgot Password</h2>
            {submitted ? (
                <p>
                    If an account with that email exists, you will receive password reset instructions.
                </p>
            ) : (
                <>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', margin: '8px 0' }}
                    />
                    {error && <div style={{ color: 'red' }}>{error}</div>}
                    <button type="submit" style={{ width: '100%', padding: '8px' }}>
                        Send Reset Link
                    </button>
                </>
            )}
        </form>
    );
};

export default ForgotPasswordForm;