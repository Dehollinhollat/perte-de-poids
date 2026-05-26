import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: string;
  prefix?: string;
}

export default function Input({
  label,
  error,
  hint,
  suffix,
  prefix,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group${error ? ' input-group--error' : ''} ${className}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {prefix && <span className="input-addon">{prefix}</span>}
        <input id={inputId} className="input" {...props} />
        {suffix && <span className="input-addon input-addon--suffix">{suffix}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
}
