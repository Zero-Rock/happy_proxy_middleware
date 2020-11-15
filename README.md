# happy_proxy_middleware

## 使用

```js
const middleware = require('happy_proxy_middleware');
const express = require('express');
const app = express();

app.use(middleware({}));

app.listen(3000, () => console.log('Example app listening on port 3000!'));
```

## 选项


### mockDataPath

mockData的文件夹路径

Type: String

Default: mockData

### proxyConfigPath

代理文件的路径

Type: String

Default: config/proxy.js

### proxyTimeout

代理超时时间

Type: Number

Default: 10000
