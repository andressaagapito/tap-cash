import { useEffect, useState } from 'react';
import Input from './Input';
import { formatMoneyInput, parseMoneyInput } from '../../utils/format';

function toEditableDisplay(value) {
  const parsed = parseMoneyInput(value);
  if (!parsed) return '';
  return parsed.replace('.', ',');
}

export default function CurrencyInput({
  label,
  error,
  value,
  onChange,
  onBlur,
  readOnly = false,
  className = '',
}) {
  const [display, setDisplay] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;

    if (value === '' || value === null || value === undefined) {
      setDisplay('');
      return;
    }
    setDisplay(formatMoneyInput(value));
  }, [value, focused]);

  const handleFocus = (event) => {
    setFocused(true);
    if (readOnly) return;

    const editable = toEditableDisplay(value ?? display);
    setDisplay(editable);
    requestAnimationFrame(() => event.target.select());
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setDisplay(next);
    onChange?.(parseMoneyInput(next));
  };

  const handleBlur = (event) => {
    setFocused(false);
    const parsed = parseMoneyInput(display);
    if (parsed) {
      setDisplay(formatMoneyInput(parsed));
      onChange?.(parsed);
    } else {
      setDisplay('');
      onChange?.('');
    }
    onBlur?.(event);
  };

  return (
    <Input
      label={label}
      error={error}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      readOnly={readOnly}
      className={className}
    />
  );
}
