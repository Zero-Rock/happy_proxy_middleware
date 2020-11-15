/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/3/17 17:43.
 */

import * as express from 'express';

export interface IMockResp {
  data: any;
  matchMethod?: string;
  mockErrorCode?: number | string;
  mockErrorMessage?: string;
  success?: boolean;
}

const matchMock = ( req: express.Request, mockData: any ): IMockResp => {
  const { path: targetPath, method: reqMethod } = req;
  const targetMethod: string = reqMethod.toLowerCase();

  let match: boolean = false;
  let matchMethod: string = '';
  let mockErrorCode: string = 'path';
  let mockErrorMessage: string = '无匹配的请求路径';

  for (const mock of mockData) {
    const { method, path, handler } = mock;

    if (path === targetPath) {
      mockErrorMessage = '无匹配的请求 method';
      mockErrorCode = 'method';
      /**
       * 未设定 mock method
       * 或 mock method 与请求 method 匹配
       */
      if (!method || (method && (method === targetMethod))) {
        matchMethod = method || targetMethod;
        match = true;
        const data = typeof handler === 'function' ? handler() : {};
        return {
          data,
          matchMethod,
          success: true,
        };
      }
    }
  }

  if (!match) {
    return {
      data: {},
      matchMethod,
      mockErrorCode,
      mockErrorMessage,
      success: false,
    };
  }
};

export default matchMock;
