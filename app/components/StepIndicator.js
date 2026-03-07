'use client';

export default function StepIndicator({ total, current }) {
    return (
        <div className="step-indicator">
            {Array.from({ length: total }, (_, i) => (
                <div
                    key={i}
                    className={`step-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}
                />
            ))}
        </div>
    );
}
