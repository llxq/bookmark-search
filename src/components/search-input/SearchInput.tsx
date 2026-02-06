import "./search-input.scss";
import { useState } from "react";

interface ISearchInputProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  onEnter?: (ctrlKey: boolean) => void;
  setIsComposition?: (value: boolean) => void;
}

export const SearchInput = ({
  value,
  setValue,
  placeholder,
  onEnter,
  setIsComposition: _setIsComposition,
}: ISearchInputProps) => {
  const [isComposition, setIsComposition] = useState(false);

  const updateIsComposition = (_isComposition: boolean) => {
    setIsComposition(_isComposition);
    _setIsComposition?.(_isComposition);
  };

  return (
    <input
      placeholder={placeholder || "请输入要搜索的关键字"}
      type="text"
      autoFocus
      autoComplete="off"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onCompositionStart={() => updateIsComposition(true)}
      onCompositionEnd={() => updateIsComposition(false)}
      className="search-input__input"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isComposition) {
          // 是否按下ctrl/command键
          onEnter?.(e.metaKey || e.ctrlKey);
          e.preventDefault();
        }
      }}
    />
  );
};
