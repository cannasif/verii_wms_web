import { type ReactElement, type ReactNode, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2, UserRound, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  getOperationUserDisplayName,
  getOperationUserInitials,
  getOperationUserSubtitle,
  type OperationUserLike,
} from '../utils/operation-user-display';

interface SearchableMultiSelectProps<T> {
  value?: string[];
  onValueChange: (value: string[]) => void;
  options: T[];
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  getOptionSubtitle?: (option: T) => string | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
  maxHeight?: string;
  itemLimit?: number;
  variant?: 'default' | 'ops';
  optionLayout?: 'default' | 'user';
  renderOption?: (option: T, isSelected: boolean) => ReactNode;
}

function isUserLikeOption(option: unknown): option is OperationUserLike {
  return typeof option === 'object' && option !== null && ('fullName' in option || 'username' in option);
}

export function SearchableMultiSelect<T>({
  value = [],
  onValueChange,
  options,
  getOptionValue,
  getOptionLabel,
  getOptionSubtitle,
  placeholder,
  searchPlaceholder,
  emptyText,
  isLoading = false,
  disabled = false,
  className,
  popoverClassName,
  maxHeight = '280px',
  itemLimit = 100,
  variant = 'default',
  optionLayout = 'default',
  renderOption,
}: SearchableMultiSelectProps<T>): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isOps = variant === 'ops';
  const resolvedPlaceholder = placeholder ?? t('common.select');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.search');
  const resolvedEmptyText = emptyText ?? t('common.noResults');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options.slice(0, itemLimit);
    }
    const query = searchQuery.toLowerCase();
    return options
      .filter((option) => {
        const label = getOptionLabel(option).toLowerCase();
        const optionValue = getOptionValue(option).toLowerCase();
        const subtitle = getOptionSubtitle?.(option)?.toLowerCase() ?? '';
        return label.includes(query) || optionValue.includes(query) || subtitle.includes(query);
      })
      .slice(0, itemLimit);
  }, [options, searchQuery, itemLimit, getOptionLabel, getOptionValue, getOptionSubtitle]);

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(getOptionValue(opt))),
    [options, value, getOptionValue],
  );

  const handleToggle = (optionValue: string): void => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent | React.KeyboardEvent): void => {
    e.stopPropagation();
    onValueChange(value.filter((v) => v !== optionValue));
  };

  const renderUserAvatar = (option: T, compact = false): ReactElement => {
    const user = isUserLikeOption(option) ? option : null;
    const initials = user ? getOperationUserInitials(user) : getOptionLabel(option).slice(0, 2).toUpperCase();
    return (
      <span className={cn('wms-ops-user-select__avatar', compact && 'wms-ops-user-select__avatar--sm')}>
        {compact ? <span className="wms-ops-user-select__initials">{initials}</span> : <UserRound className="size-3.5" aria-hidden />}
      </span>
    );
  };

  const renderDefaultOptionContent = (option: T, isSelected: boolean): ReactElement => {
    if (renderOption) {
      return <>{renderOption(option, isSelected)}</>;
    }

    if (optionLayout === 'user') {
      const name = getOptionLabel(option);
      const subtitle = getOptionSubtitle?.(option);
      return (
        <div className="wms-ops-user-select__option min-w-0 flex-1">
          {renderUserAvatar(option)}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{name}</span>
            {subtitle ? <span className="block truncate text-xs opacity-70">{subtitle}</span> : null}
          </span>
        </div>
      );
    }

    return <span className="truncate">{getOptionLabel(option)}</span>;
  };

  const renderSelectedChip = (option: T, optionValue: string): ReactElement => {
    const label = getOptionLabel(option);

    if (isOps && optionLayout === 'user') {
      return (
        <span key={optionValue} className="wms-ops-user-chip">
          {renderUserAvatar(option, true)}
          <span className="max-w-[9rem] truncate">{label}</span>
          <span
            role="button"
            tabIndex={0}
            className="wms-ops-user-chip__remove"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRemove(optionValue, e);
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => handleRemove(optionValue, e)}
          >
            <X className="size-3" aria-hidden />
          </span>
        </span>
      );
    }

    return (
      <Badge key={optionValue} variant="secondary" className="mr-1 mb-1">
        {label}
        <span
          role="button"
          tabIndex={0}
          className="ml-1 cursor-pointer rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRemove(optionValue, e as unknown as React.MouseEvent);
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => handleRemove(optionValue, e)}
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </span>
      </Badge>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            isOps ? 'wms-ops-lookup-trigger wms-ops-lookup-trigger--multi h-auto min-h-10 font-normal' : 'min-h-10 h-auto',
            className,
          )}
          disabled={disabled}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-1 flex-wrap gap-1 py-0.5">
              {selectedOptions.map((option) => renderSelectedChip(option, getOptionValue(option)))}
            </div>
          ) : (
            <span className={cn('text-muted-foreground', isOps && 'wms-ops-field--placeholder')}>
              {resolvedPlaceholder}
            </span>
          )}
          <span className="ml-2 inline-flex shrink-0 items-center gap-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin opacity-70" aria-hidden /> : null}
            <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0', isOps && 'wms-ops-lookup-popover', popoverClassName)}
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <Command shouldFilter={false}>
          <div className="relative [&_[data-slot=command-input-wrapper]]:pr-10">
            <CommandInput
              placeholder={resolvedSearchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 transform">
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
                <CommandEmpty>{resolvedEmptyText}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const optionValue = getOptionValue(option);
                    const isSelected = value.includes(optionValue);
                    return (
                      <CommandItem
                        key={optionValue}
                        value={optionValue}
                        className={cn(optionLayout === 'user' && 'items-center gap-2 py-2.5')}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleToggle(optionValue);
                          setSearchQuery('');
                        }}
                        onSelect={() => {
                          handleToggle(optionValue);
                          setSearchQuery('');
                        }}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0',
                            optionLayout === 'user' ? 'mr-0' : 'mr-2',
                          )}
                        />
                        {renderDefaultOptionContent(option, isSelected)}
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

export { getOperationUserDisplayName, getOperationUserSubtitle };
