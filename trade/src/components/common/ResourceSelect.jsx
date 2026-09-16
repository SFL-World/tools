import { useRef, useState } from "react";
import { Group, Image, Select } from "@mantine/core";
import { findMostSimilar } from "../../services/search.js";

export default function ResourceSelect({
  ariaLabel,
  clearAfterSelect = false,
  data,
  iconMap,
  items,
  onResourceChange,
  onSearchValueChange,
  placeholder,
  resource,
  searchValue,
  withDropdown = true,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const inputRef = useRef(null);
  const search = searchValue ?? internalSearch;

  const setSearch = (value) => {
    setInternalSearch(value);
    onSearchValueChange?.(value);
  };

  const selectResource = (selected) => {
    if (!selected) return;

    onResourceChange(selected);
    setSearch(clearAfterSelect ? "" : selected.label);
  };

  return (
    <Select
      searchable
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={clearAfterSelect ? null : resource?.value}
      dropdownOpened={withDropdown ? undefined : false}
      searchValue={search}
      onSearchChange={setSearch}
      data={data}
      renderOption={({ option }) => {
        const icon = iconMap.get(option.label.toLowerCase());

        return (
          <Group gap="sm">
            {icon && <Image src={icon} w={24} h={24} fit="contain" />}
            <span>{option.label}</span>
          </Group>
        );
      }}
      onFocus={() => {
        setSearch("");
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || !search.trim()) return;

        const selected = findMostSimilar(search, items);

        if (selected) {
          event.preventDefault();
          selectResource(selected);
          requestAnimationFrame(() => inputRef.current?.blur());
        }
      }}
      onOptionSubmit={(value) => {
        selectResource(items.find((item) => item.value === value));
      }}
      onBlur={() => {
        if (clearAfterSelect) setSearch("");
      }}
      ref={inputRef}
    />
  );
}
