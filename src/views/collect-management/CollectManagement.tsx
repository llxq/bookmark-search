import "./collect-management.scss";
import Fuse from "fuse.js";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "../../components/search-input/SearchInput.tsx";
import { collectDb } from "../../shared/Db.ts";
import { getCollectionData } from "../../shared/event.ts";
import { createNotification } from "../../shared/notice.ts";
import type {
  IOmniCollectSearchData,
  IOmniSearchData,
  IOmniSeekTabParams,
} from "../../shared/types.ts";
import { formatTime, trimSpace } from "../../shared/utils.ts";

export const CollectManagement = ({ editCollect }: IOmniSeekTabParams) => {
  const [keywords, setKeywords] = useState("");
  const [isComposition, setIsComposition] = useState(false);

  const [collectData, setCollectData] = useState<IOmniCollectSearchData[]>([]);
  const [searchData, setSearchData] = useState<IOmniCollectSearchData[]>([]);

  const fuse = useRef<TUndefinable<Fuse<IOmniCollectSearchData>>>(void 0);

  useEffect(() => {
    getCollectionData().then((data) => {
      // 按照创建时间排序
      setCollectData(data.sort((a, b) => b.updateTime - a.updateTime));
      fuse.current = new Fuse(
        data.map((m) => {
          return {
            ...m,
            titleNoSpace: trimSpace(m.title),
          };
        }),
        {
          keys: ["title", "titleNoSpace"],
        },
      );
    });
  }, []);

  const deleteCollect = (data: IOmniSearchData) => {
    collectDb.delete(data.id).then(() => {
      createNotification("删除成功");
    });
    setCollectData((c) => c.filter((d) => d.id !== data.id));
  };

  useEffect(() => {
    if (!keywords.trim()) {
      setSearchData(collectData);
    } else {
      if (!isComposition) {
        setSearchData(
          (fuse.current?.search(keywords) || []).map(({ item }) => item),
        );
      }
    }
  }, [keywords, collectData, isComposition]);

  return collectData.length ? (
    <div className="collect-management__container">
      <SearchInput
        value={keywords}
        setValue={setKeywords}
        setIsComposition={setIsComposition}
      />
      {!searchData.length ? (
        <div className="search-empty">暂无匹配数据</div>
      ) : (
        <div className="collect-management__list">
          {searchData.map((data) => {
            return (
              <div className="collect-management__list-item-wrapper">
                <div
                  className="collect-management__list-item"
                  key={data.id}
                  onClick={() => {
                    void chrome.tabs.create({
                      url: data.url,
                    });
                  }}
                >
                  <img
                    className="favicon"
                    src={
                      data.faviconURL ||
                      chrome.runtime.getURL("icons/default_favicon.png")
                    }
                    alt={data.title}
                  />
                  <div className="collect-management__list-item-content">
                    <div className="title" title={data.title}>
                      {data.title}
                    </div>
                    <div className="url" title={data.url}>
                      {data.url}
                    </div>
                    <div className="created-time">
                      {formatTime(data.updateTime)}
                    </div>
                  </div>
                </div>
                <div className="collect-management__item-operation">
                  <div
                    className="edit-btn is-button"
                    onClick={() => editCollect?.(data)}
                  >
                    编辑
                  </div>
                  <div
                    className="delete-btn is-button"
                    onClick={() => deleteCollect(data)}
                  >
                    删除
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  ) : (
    <div className="collect-management__empty">暂无数据</div>
  );
};
