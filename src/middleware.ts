/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/3/17 17:43.
 */
import chalk from 'chalk';
import chokidar from 'chokidar';
import * as express from 'express';
import * as http from 'http';
import { createProxyServer } from 'http-proxy';
import importFresh from 'import-fresh';
import modifyResponse from 'node-http-proxy-json';
import * as path from 'path';
import * as request from 'request-promise';
import { getBaseAuthStr, jsonParse } from 'src/utils';
import { HttpStatusCode, LogLever } from './enum';
import { IOptions, IRule } from './interface';
import matchMock, { IMockResp } from './matchMock';
import getMockData from './mockProvider';

const proxy = createProxyServer();
const timeOut: number = 10000;
const refreshTimeLag: number = 3600000;
let authorizationValue: string = '';
let baseAuthStr: string = '';

const isUseMock = (useMock: boolean | string[], url: string): boolean => {
  if (!Array.isArray(useMock)) {
    return useMock;
  }
  const urls = useMock || [];
  return urls.some((ruleUrl) => new RegExp(ruleUrl).test(url));
};

const mockResultLog = (mockResponse: IMockResp, req: express.Request): void => {
  const { matchMethod, success, mockErrorMessage } = mockResponse;
  console.log(`
    ${chalk.bgBlue.black(` ${success ? 'MOCK SUCCESS' : `MOCK FAIL: ${mockErrorMessage}`} `)}  ${
    matchMethod ? chalk.bold(`${matchMethod.toUpperCase()} `) : ' '
  }${chalk.bold(req.path)}\n
  `);
};

const getOauthUri = (proxyOption): string => {
  const base = proxyOption.base || proxyOption.rules.base;
  const { host = '' } = base;
  const {
    user: { account = '', password = '' } = {},
  } = proxyOption;
  return `${
    host
  }/oauth/token?grant_type=password&username=${
    account
  }&password=${
    password
  }`;
};

const getAuthorization = async (proxyOption) => {
  const uri: string = getOauthUri(proxyOption);
  const headers = { Authorization: baseAuthStr };
  try {
    const res = await request.post({ uri, headers });
    const data = jsonParse(res);
    if (data.token_type) {
      console.log(chalk.bgGreen.black(' 登陆成功 ') + ' ' +
        `账号：${proxyOption.user.account}  ` +
        `密码：${proxyOption.user.password}\n`,
      );
    }
    authorizationValue = `${data.token_type} ${data.access_token}`;
  } catch ( err ) {
    const res = jsonParse(err.error);
    console.log(`${chalk.bgRed.black(' 登陆失败 ')} ${
      proxyOption.user.account
    } ${chalk.bgCyan('错误信息：')} ${chalk.bold(res.error_description)}`);
    console.log();
    console.log(chalk.bgRed.bold('请检查账号和登陆环境是否匹配'));
  }
};

const wrapper = (options: IOptions = {}) => {
  const {
    isAuth = false,
    logLevel = 'debug',
    mockDataPath = path.join(process.cwd(), 'mockData'),
    proxyConfigPath = path.join(process.cwd(), 'config/proxy.js'),
    proxyTimeout = timeOut,
  } = options;

  let mockData: any = getMockData(mockDataPath);
  let proxyOption: any = importFresh(proxyConfigPath);

  baseAuthStr = getBaseAuthStr(proxyOption.token);

  getAuthorization(proxyOption);
  console.log(`${chalk.bgGreen.black(' 当前代理环境 ')} ${chalk.bold(proxyOption.domain)}`);

  proxy.on('proxyReq', (proxyReq: http.ClientRequest) => {
    if (isAuth) {
      proxyReq.setHeader('Authorization', authorizationValue);
    }
  });

  proxy.on('proxyRes', (proxyRes, req: express.Request, res) => {
    const { useMockStatusCode = [] } = proxyOption;
    if (useMockStatusCode.includes(proxyRes.statusCode)) {
      const { writeHead } = res;
      Object.assign(res, {
        writeHead: () => {
          writeHead.apply(res, [ HttpStatusCode.Ok, proxyRes.headers ]);
        },
      });
      modifyResponse(res, proxyRes, () => {
        const mockResponse = matchMock(req, mockData);
        console.log(
          `${chalk.bgRed.black(` 请求出错 状态码：${proxyRes.statusCode} `)} ${chalk.bold(req.path)} ${chalk.bold(
            '请求Mock数据',
          )}\n`,
        );

        mockResultLog(mockResponse, req);
        return mockResponse.data;
      });
    }
  });

  proxy.on('error', (err, req) => {
    console.log(`${chalk.bgRed.black(' 代理出错 ')} ${req.url}`);
    console.log();
    console.log(err);
  });

  setInterval(() => {
    authorizationValue = '';
    getAuthorization(proxyOption);
  }, refreshTimeLag);

  chokidar
    .watch(proxyConfigPath, {
      ignoreInitial: true,
    })
    .on('change', async () => {
      proxyOption = importFresh(proxyConfigPath);
      const { domain, token } = proxyOption;
      baseAuthStr = getBaseAuthStr(token);
      await getAuthorization(proxyOption);
      console.log(`${chalk.bgGreen.black(' 代理配置成功 当前代理环境 ')} ${chalk.bold(domain)}\n`);
    });

  chokidar
    .watch(mockDataPath, {
      ignoreInitial: true,
    })
    .on('change', () => {
      console.log(chalk.bgGreen.black(' 重新加载Mock数据成功\n '));
      mockData = getMockData(mockDataPath);
    });

  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const { url } = req;
    const proxyRules = proxyOption.rules;
    const rules = Array.isArray(proxyRules)
      ? proxyRules
      : Object.keys(proxyRules).map((key) => proxyRules[key]);
    const target = rules.find((rule: IRule) => {
      if (!rule.urls) {
        return false;
      }
      return rule.urls.some((ruleUrl: string) => new RegExp(ruleUrl).test(url));
    });
    proxy.on('error', (err) => {
      console.log(err);
    });
    if (target) {
      if (!isUseMock(target.useMock, url)) {
        if (logLevel === LogLever.Debugger) {
          console.log(chalk.bgGreen.black(' PROXY ') + '  '
            + chalk.bold(`${req.method.toUpperCase()}`) + ' '
            + `${chalk.bold(req.path)} ---> ${chalk.bold(target.host)}\n`,
          );
        }
        proxy.web(
          req,
          res, {
            changeOrigin: true,
            proxyTimeout,
            target: target.host,
          },
          (e) => {
            console.log(e);
          },
        );
      } else {
        const mockResponse = matchMock(req, mockData);
        mockResultLog(mockResponse, req);
        res.status(HttpStatusCode.Ok).send(mockResponse.data);
      }
    } else {
      next();
    }
  };
};

export = wrapper;
