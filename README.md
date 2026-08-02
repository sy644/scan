# 扫码查价

一个零依赖的纯前端扫码查价工具,扫码、查价、语音播报、商品管理一条龙。

## 功能

- 🏠 首页:扫码查价 + 商品管理
- 📷 扫码:调用摄像头识别条形码 / 二维码(基于 `BarcodeDetector` API)
- 💰 商品详情:图片 + 名称 + 价格 + 条码,4 秒自动返回,支持语音报价
- 📦 商品管理:列表、编辑、删除
- ➕ 添加 / 编辑商品:条码(可扫码)+ 名称 + 价格 + 规格 + 图片
- 💾 数据存储:浏览器 `localStorage`,无需后端

## 运行

直接用任意静态服务器打开即可,例如:

```bash
cd scan-price
python3 -m http.server 8000
```

然后用手机或电脑浏览器访问 `http://localhost:8000/`(手机访问需使用 HTTPS 或 `localhost`,否则摄像头权限会被浏览器拒绝)。

> ⚠️ 由于摄像头权限限制,**手机上必须用 HTTPS** 才能扫码。可以部署到任意静态 HTTPS 站点(如 Vercel / Netlify / GitHub Pages)即可。

## 浏览器要求

- 扫码:Chrome / Edge / 安卓 WebView / Safari(iOS 17+ 部分支持)
- 语音播报:Chrome / Edge / Safari

## 文件结构

```
scan-price/
├── index.html       # 主页面
├── css/style.css    # 样式
└── js/
    ├── storage.js   # localStorage 存储
    ├── scanner.js   # 摄像头扫码
    ├── speech.js    # 语音播报
    └── app.js       # 业务逻辑 & 路由
```
