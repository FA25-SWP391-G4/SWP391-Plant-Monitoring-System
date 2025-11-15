'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { countries } from '@/data/countries';

export default function PhoneInput({
  value = '',
  onChange,
  countryCode = '+84',
  onCountryChange,
  placeholder = 'Enter phone number',
  disabled = false,
  className = '',
  error = null,
}) {
  const { getThemeColor, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.dialCode === countryCode) || countries[0]
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    const country = countries.find((c) => c.dialCode === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [countryCode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);
    setSearchQuery('');
    if (onCountryChange) {
      onCountryChange(country.dialCode);
    }
  };

  const handlePhoneChange = (e) => {
    let phoneValue = e.target.value;
    phoneValue = phoneValue.replace(/\D/g, '');
    if (phoneValue.startsWith('0')) {
      phoneValue = phoneValue.substring(1);
    }
    if (onChange) {
      onChange(phoneValue);
    }
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(!open)}
            className="w-[140px] justify-between"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <span className={`fi fi-${selectedCountry.code.toLowerCase()}`}></span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>

          {open && (
            <div className="absolute z-50 mt-1 w-[320px] rounded-md border bg-card p-2 shadow-lg">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="max-h-[300px] overflow-auto">
                {filteredCountries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No country found.
                  </p>
                ) : (
                  filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-muted/50 transition-colors',
                        selectedCountry.code === country.code && 'bg-muted'
                      )}
                    >
                      {selectedCountry.code === country.code && (
                        <Check className="h-4 w-4" style={{ color: getThemeColor('#16a34a', '#22c55e') }} />
                      )}
                      {selectedCountry.code !== country.code && (
                        <div className="w-4" />
                      )}
                      <span className={`fi fi-${country.code.toLowerCase()}`}></span>
                      <span className="flex-1">{country.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {country.dialCode}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <Input
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(error && 'border-destructive focus:ring-destructive')}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!error && (
        <p className="text-xs text-muted-foreground">
          Full number: {selectedCountry.dialCode} {value || '...'}
        </p>
      )}
    </div>
  );
}
