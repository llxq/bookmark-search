import "./search.scss";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SearchInput } from "../../components/search-input/SearchInput.tsx";
import { closePopup, getTagDefinition, useLatest } from "../../shared/utils.ts";
import { useSearch } from "./hooks/useSearch.ts";

export const Search = () => {
  const selectedRectRef = useRef<HTMLDivElement>(null);
  const [isComposition, setIsComposition] = useState(false);
  const isCompositionRef = useLatest(isComposition);
  const {
    keywords,
    setKeywords,
    searchData,
    setting,
    selectData,
    setSelectData,
    open,
    isUseSEKeyword,
  } = useSearch();
  const searchDataRef = useLatest(searchData);
  const selectedRef = useLatest(selectData);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isCompositionRef.current) {
      return;
    }
    // esc 关闭
    if (event.key === "Escape") {
      closePopup();
      return;
    }

    const index = searchDataRef.current.findIndex(
      (f) => f.id === selectedRef.current?.id,
    );
    const length = searchDataRef.current.length - 1;
    if (index > -1) {
      /* 按上/下箭头切换 */
      if (event.key === "ArrowUp") {
        const nextIndex = index === 0 ? length : index - 1;
        setSelectData(searchDataRef.current[nextIndex]);
        event.preventDefault();
      }

      if (event.key === "ArrowDown") {
        const nextIndex = index === length ? 0 : index + 1;
        setSelectData(searchDataRef.current[nextIndex]);
        event.preventDefault();
      }
    }
  }, []);

  useLayoutEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const selectedElement = document.querySelector(
      `[data-id="${selectData?.id}"]`,
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectData]);

  return (
    <div className="search__container">
      <div className="search__input-wrapper">
        <div className="tips">
          Enter 打开选中项、Esc 取消、↑ 或 ↓
          切换选中项。已打开标识中的两个数字代表：窗口/Tab
        </div>
        <SearchInput
          value={keywords}
          setValue={setKeywords}
          setIsComposition={setIsComposition}
          onEnter={(ctrlKey) => open(selectData, ctrlKey)}
        />
      </div>
      {searchData.length ? (
        <div className="search__result">
          <div className="search__result-list" ref={selectedRectRef}>
            {searchData.map((data) => {
              const tag = getTagDefinition(data);
              return (
                <div
                  className={`list-item ${data.id === selectData?.id ? "is-selected" : ""}`}
                  onClick={() => open(data)}
                  data-id={data.id}
                  key={data.id}
                >
                  <img
                    className="list-item__favicon"
                    src={
                      data.faviconURL ||
                      chrome.runtime.getURL("icons/default_favicon.png")
                    }
                    alt={data.title}
                  />
                  <div className="list-item__content">
                    <div className={`content__title ${tag ? "has-tag" : ""}`}>
                      <div className="title" title={data.title}>
                        {data.title}
                      </div>
                      {tag ? (
                        <div
                          className="tag"
                          style={{
                            color: tag.color,
                            backgroundColor: tag.bgColor,
                          }}
                        >
                          {tag.text}
                        </div>
                      ) : null}
                    </div>
                    <div className="content__url" title={data.url}>
                      {data.url}
                    </div>
                    {data.parentTitle ? (
                      <div className="content__path" title={data.parentTitle}>
                        <img
                          className="icon"
                          src={chrome.runtime.getURL("icons/dir_icon.png")}
                          alt="文件夹"
                        />
                        <div className="path__label">
                          {data.parentTitle.split("/").join(" / ")}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="search__result-empty">
          {setting.useDefaultSE === "1" || isUseSEKeyword ? (
            keywords.trim() ? (
              <span>
                回车即可通过默认浏览器搜索【
                <span className="keywords">{keywords}</span>】
              </span>
            ) : (
              "请输入关键字进行搜索"
            )
          ) : (
            "未找到结果，请尝试其他关键字"
          )}
        </div>
      )}
    </div>
  );
};
