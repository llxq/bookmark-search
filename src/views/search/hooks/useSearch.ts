import Fuse, { type FuseOptionKey } from "fuse.js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_HISTORY_COUNT,
  OMNI_SEARCH_HISTORY_KEY,
  ruleSettingToWeight,
} from "../../../shared/constants.ts";
import { getAllSearchData } from "../../../shared/data.ts";
import { clickCountDb } from "../../../shared/Db.ts";
import { createSystemNotification } from "../../../shared/notice.ts";
import { getStorage, setStorage } from "../../../shared/storage.ts";
import type { IOmniSearchData } from "../../../shared/types.ts";
import {
  closePopup,
  getFuseSearchResult,
  getSearchSortFn,
  switchTab,
} from "../../../shared/utils.ts";
import { useSetting } from "./useSetting.ts";

export const useSearch = () => {
  const [keywords, setKeywords] = useState("");
  // search data
  const [searchData, setSearchData] = useState<IOmniSearchData[]>([]);
  // select data
  const [selectData, setSelectData] =
    useState<TUndefinable<IOmniSearchData>>(void 0);
  // history
  const [historyData, setHistoryData] = useState<IOmniSearchData[]>([]);
  // fuse
  const fuse = useRef<TUndefinable<Fuse<IOmniSearchData>>>(void 0);

  // setting
  const { setting, loading } = useSetting();
  /**
   * 是否为通过SE搜索关键字
   */
  const [isUseSEKeyword, setIsUseSEKeyword] = useState(false);

  // init data
  useEffect(() => {
    if (!loading) {
      const isSearchOpenedTab = setting.searchOpenedTab === "1";
      setIsUseSEKeyword(setting.useSEKeyword === "1");
      Promise.all([
        getAllSearchData(isSearchOpenedTab),
        getStorage<string[]>(OMNI_SEARCH_HISTORY_KEY),
      ]).then(([data, historyKey]) => {
        const dataMap = new Map<string, IOmniSearchData>();
        const fuseSearchData: IOmniSearchData[] = [];
        data.forEach((m) => {
          dataMap.set(m.id, m);
          fuseSearchData.push(getFuseSearchResult(m));
        });
        // init fuse
        fuse.current = new Fuse<IOmniSearchData>(fuseSearchData, {
          keys: setting.searchRules.reduce(
            (result: FuseOptionKey<IOmniSearchData>[], m) => {
              const currentWeight = ruleSettingToWeight[m] || 0;
              result.push({
                weight: currentWeight,
                name: m,
              });
              result.push({
                weight: currentWeight * 0.8,
                name: `${m}NoSpace`,
              });
              return result;
            },
            [] as string[],
          ),
          useExtendedSearch: setting.useAdvancedSearch === "1",
          includeScore: isSearchOpenedTab,
          sortFn: getSearchSortFn(fuseSearchData, isSearchOpenedTab),
        });
        const historyData = (historyKey || []).reduce(
          (result: IOmniSearchData[], item) => {
            if (dataMap.has(item)) {
              result.push(dataMap.get(item)!);
            }
            return result;
          },
          [],
        );
        if (historyData.length) {
          setSelectData(historyData[0]);
          setSearchData(historyData);
        }
        setHistoryData(historyData);
      });
    }
  }, [loading, setting]);

  const debounceTimeoutRef =
    useRef<TNullable<ReturnType<typeof setTimeout>>>(null);

  const debounceSearch = useCallback(() => {
    // 匹配关键字排除所有空格
    const result = (fuse.current?.search(keywords) || []).map(
      ({ item }) => item,
    );
    setSearchData(result);
    setSelectData(result?.[0]);
  }, [keywords, setSelectData, setSearchData]);

  // auto search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (!keywords?.trim()) {
      // default show history
      setSearchData(historyData);
      setSelectData(historyData?.[0]);
      return;
    }
    debounceTimeoutRef.current = setTimeout(debounceSearch, 200);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [keywords, isUseSEKeyword, historyData, setSelectData, setSearchData]);

  const [isOpening, setIsOpening] = useState(false);
  /**
   * 打开
   * @param openData
   */
  const open = async (openData?: IOmniSearchData, ctrlKey?: boolean) => {
    if (isOpening) {
      return;
    }
    setIsOpening(true);
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTabUrl = currentTab[0]?.url || "";
    const isBlank = ["about:blank", "chrome://newtab/"].includes(activeTabUrl);
    try {
      const { useDefaultSE } = setting;
      // search to default SE
      if (
        (!openData && keywords && +useDefaultSE === 1) ||
        (isUseSEKeyword && ctrlKey)
      ) {
        await chrome.search.query({
          disposition: "NEW_TAB",
          text: keywords,
        });
      } else {
        // 为空不做任何事情
        if (!openData) {
          return;
        }
        // 判断是否为已经打开的tab，已经打开的tab不记录历史，并且直接切换
        if (openData.isOpenTab) {
          await switchTab(parseFloat(openData.id), openData.windowId);
          closePopup();
          return;
        }
        const currentHistoryData = [...historyData];
        const index = currentHistoryData.findIndex((b) => b.id === openData.id);
        if (index > -1) {
          currentHistoryData.splice(index, 1);
        }
        currentHistoryData.unshift(openData);
        if (currentHistoryData.length > MAX_HISTORY_COUNT) {
          currentHistoryData.pop();
        }
        // 更新点击次数
        void clickCountDb.update({
          id: openData.id,
          clickCount: (openData?.clickCount || 0) + 1,
        });
        setHistoryData(currentHistoryData);
        // 加入缓存
        await setStorage(
          OMNI_SEARCH_HISTORY_KEY,
          currentHistoryData.map((m) => m.id),
        );
        // 如果是空白标签，则修改当前空白标签的url
        if (isBlank) {
          await chrome.tabs.update(currentTab[0].id, { url: openData.url });
        } else {
          await chrome.tabs.create({ url: openData.url });
        }
      }
      closePopup();
    } catch (e) {
      console.error(e);
      void createSystemNotification(
        `出现未知错误,请刷新重试，或者提交issue至：https://github.com/llxq/omni-seek/issues`,
      );
    } finally {
      setIsOpening(false);
    }
  };

  return {
    keywords,
    setKeywords,
    historyData,
    searchData,
    open,
    selectData,
    setSelectData,
    setting,
    isUseSEKeyword,
  };
};
