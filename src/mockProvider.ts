/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/3/17 17:43.
 */
import { readdirSync } from 'fs';
import { load, normalizeMockConfig } from 'src/utils';

export default function getMockData(mockDir: string) {
  let mockFiles = [];
  try {
    mockFiles = readdirSync(mockDir);
  } catch ( e ) {
    return console.log('加载mock文件失败', e);
  }
  return normalizeMockConfig(load(mockFiles, mockDir));
};
