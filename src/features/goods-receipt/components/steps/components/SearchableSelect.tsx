import { type ReactElement, useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchableSelectProps<T> {
  value?: string;
  onValueChange: (value: string) => void;
  options: T[];
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  itemLimit?: number;
}

export function SearchableSelect<T>({
  value,
  onValueChange,
  options,
  getOptionValue,
  getOptionLabel,
  placeholder = 'Seçiniz...',
  searchPlaceholder = 'Ara...',
  emptyText = 'Sonuç bulunamadı.',
  isLoading = false,
  disabled = false,
  className,
  maxHeight = '300px',
  itemLimit = 100,
}: SearchableSelectProps<T>): ReactElement {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options.slice(0, itemLimit);
    }
    const query = searchQuery.toLowerCase();
    return options
      .filter((option) => {
        const label = getOptionLabel(option).toLowerCase();
        const value = getOptionValue(option).toLowerCase();
        return label.includes(query) || value.includes(query);
      })
      .slice(0, itemLimit);
  }, [options, searchQuery, itemLimit, getOptionLabel, getOptionValue]);

  const selectedOption = useMemo(
    () => options.find((opt) => getOptionValue(opt) === value),
    [options, value, getOptionValue]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Yükleniyor...</span>
            </span>
          ) : selectedOption ? (
            <span className="truncate">{getOptionLabel(selectedOption)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <div className="relative [&_[data-slot=command-input-wrapper]]:pr-10">
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
              <VoiceSearchButton
                onResult={(text) => setSearchQuery(text)}
                size="sm"
                variant="ghost"
                className="h-5 w-5"
              />
            </div>
          </div>
          <CommandList style={{ maxHeight }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const optionValue = getOptionValue(option);
                    const optionLabel = getOptionLabel(option);
                    const isSelected = value === optionValue;
                    return (
                      <CommandItem
                        key={optionValue}
                        value={optionValue}
                        onSelect={() => {
                          onValueChange(optionValue);
                          setOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{optionLabel}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}