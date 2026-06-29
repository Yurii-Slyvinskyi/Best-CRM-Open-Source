import { financeCurrencyOptions, type FinanceCurrency } from '../../../entities/finance';
import { cn } from '../../../shared/lib/cn';
import { formInputClasses } from '../model/finance-helpers';

type CurrencyFieldProps = {
  value: FinanceCurrency;
  onChange: (value: FinanceCurrency) => void;
};

export function CurrencyField({ value, onChange }: CurrencyFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">Currency</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as FinanceCurrency)}
        className={cn(formInputClasses, 'bg-white')}
      >
        {financeCurrencyOptions.map((code) => (
          <option key={code} value={code}>{code}</option>
        ))}
      </select>
    </label>
  );
}
