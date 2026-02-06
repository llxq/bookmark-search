import "./setting.scss";
import { useEffect, useState } from "react";
import { Checkbox } from "../../components/checkbox/Checkbox.tsx";
import { FormItem } from "../../components/form-item/FormItem.tsx";
import { Radio, RadioGroup } from "../../components/radio/Radio.tsx";
import { OMNI_SEARCH_SETTING_KEY } from "../../shared/constants.ts";
import { createNotification } from "../../shared/notice.ts";
import { getDefaultSetting } from "../../shared/setting.ts";
import { getStorage, setStorage } from "../../shared/storage.ts";
import type {
  IOmniSearchSetting,
  IOmniSeekTabParams,
  TTheme,
} from "../../shared/types.ts";

export const Setting = ({ updateTheme }: IOmniSeekTabParams) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] =
    useState<IOmniSearchSetting>(getDefaultSetting());

  const [saveLoading, setSaveLoading] = useState(false);
  const submit = async () => {
    if (saveLoading) {
      return;
    }
    setSaveLoading(true);
    // 更新主题
    updateTheme?.(formData.theme);
    try {
      await setStorage(OMNI_SEARCH_SETTING_KEY, formData);
      createNotification("操作成功");
    } finally {
      setSaveLoading(false);
    }
  };

  const updateFormData = (data: Partial<IOmniSearchSetting>) => {
    setFormData({ ...formData, ...data });
  };

  useEffect(() => {
    getStorage(OMNI_SEARCH_SETTING_KEY).then((result) => {
      if (result) {
        setFormData({ ...formData, ...result });
      }
      // 组件内部没有做响应式所以等待数据更新后渲染。
      setLoading(false);
    });
  }, []);

  return (
    !loading && (
      <div className="setting__container">
        <div className="setting__content">
          <FormItem label="搜索规则">
            <Checkbox
              name="searchRule"
              value={formData.searchRules}
              onChange={(value) =>
                updateFormData({
                  searchRules: value as IOmniSearchSetting["searchRules"],
                })
              }
              options={[
                { name: "标题", value: "title" },
                { name: "上级目录标题", value: "parentTitle" },
                { name: "URL", value: "url" },
              ]}
            />
          </FormItem>
          <FormItem
            label="是否搜索已打开的标签页"
            tips="已打开的标签页会打上标识并且优先被匹配"
          >
            <RadioGroup
              name="searchOpenedTab"
              value={formData.searchOpenedTab}
              onChange={(value) => updateFormData({ searchOpenedTab: value })}
            >
              <Radio value="0">否</Radio>
              <Radio value="1">是</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem
            label="是否允许主动使用默认引擎搜索关键字"
            tips="按住 Ctrl/Command + Enter 通过默认引擎搜索关键字"
          >
            <RadioGroup
              name="useSEKeyword"
              value={formData.useSEKeyword}
              onChange={(value) => updateFormData({ useSEKeyword: value })}
            >
              <Radio value="0">否</Radio>
              <Radio value="1">是</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem label="书签不存在时是否使用默认搜索引擎搜索关键字">
            <RadioGroup
              name="useDefaultSE"
              value={formData.useDefaultSE}
              onChange={(value) => updateFormData({ useDefaultSE: value })}
            >
              <Radio value="0">否</Radio>
              <Radio value="1">是</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem label="主题">
            <RadioGroup
              name="theme"
              value={formData.theme}
              onChange={(value) => updateFormData({ theme: value as TTheme })}
            >
              <Radio value="auto">自动</Radio>
              <Radio value="light">浅色</Radio>
              <Radio value="dark">深色</Radio>
            </RadioGroup>
          </FormItem>
          <div className="setting__tips">
            下面搜索配置为
            <a href="https://fusejs.io/" target="_blank">
              fuse.js
            </a>
            的配置
          </div>
          <FormItem
            label="是否启用扩展搜索"
            tips="允许使用（如 '^'、'$'、'='、'!'）进行精确、前缀、后缀或反向匹配。"
          >
            <RadioGroup
              name="useAdvancedSearch"
              value={formData.useAdvancedSearch}
              onChange={(value) => updateFormData({ useAdvancedSearch: value })}
            >
              <Radio value="1">是</Radio>
              <Radio value="0">否</Radio>
            </RadioGroup>
          </FormItem>
        </div>
        <div className="setting__footer">
          <div className="submit-button" onClick={submit}>
            保存设置
          </div>
        </div>
      </div>
    )
  );
};
