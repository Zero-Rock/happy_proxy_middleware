/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/3/17 17:43.
 */

export interface IOptions {
  isAuth?: boolean;
  logLevel?: 'debug' | 'dev';
  mockDataPath?: string;
  proxyConfigPath?: string;
  proxyTimeout?: number;
}

export interface IRule {
  urls: string[];
  host: string;
}
