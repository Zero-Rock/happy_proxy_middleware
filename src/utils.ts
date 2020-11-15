/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/11/15 10:11 下午.
 */

import { existsSync } from 'fs';
import importFresh from 'import-fresh';

/**
 * 加载 mock 文件夹下 所有 mock 配置
 * @param mockFiles
 * @param mockDir
 */
export const load = (mockFiles: string[], mockDir: string) => {
  return mockFiles.reduce((memo, mockFile) => {
    try {
      const mockFilePath = `${mockDir}/${mockFile}`;
      if (existsSync(mockFilePath)) {
        const data: any = importFresh(mockFilePath) || {};
        memo = { ...memo, ...data };
        return memo;
      }
      return {};

    } catch ( e ) {
      throw new Error(e);
    }
  }, {});
};

/**
 * @description parse mock method & mock path
 * @param key {string}
 * @return {{ method: string; path: string }}
 */
export const parseKey = (key: string): { method: string; path: string } => {
  let method;
  let path = key;
  if (/\s+/.test(key)) {
    const splitArr = key.split(/\s+/);
    if (splitArr.length > 1) {
      method = splitArr[0].toLowerCase();
      path = splitArr[1];
    }
  }
  return {
    method,
    path,
  };
};

/**
 * 解析 mock 规则
 * @param config
 */
export const normalizeMockConfig = (config: Record<any, any>) => Object.keys(config).reduce((memo, key) => {
  const handler = config[key];
  const { method, path } = parseKey(key);
  memo.push({
    method,
    path,
    handler,
  });
  return memo;
}, []);

/**
 * @description 解析json
 */
export const jsonParse = <T = Record<string, any>>(data: string): T => {
  try {
    return JSON.parse(data);
  } catch ( e ) {
    return {} as T;
  }
};

export const getBaseAuthStr = (token: string): string => {
  return `Basic ${Buffer.from(token).toString('base64')}`;
};
