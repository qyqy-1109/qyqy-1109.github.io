# qyqy-1109.github.io

个人作品集，纯静态站点，无构建步骤。

## 本地预览

```bash
python -m http.server 8000
```

打开 `http://127.0.0.1:8000/`。

## 数据来源

页面启动时请求：

```text
https://api.github.com/users/qyqy-1109/repos?per_page=100&sort=updated
```

只展示公开、非 fork 仓库。GitHub API 不可用或限流时，会回退到 `app.js` 里的 `FALLBACK` 精选项目。

## 改内容

- 个人介绍、精选项目：`index.html`
- 颜色、字体、布局：`styles.css`
- API 用户名、精选项目、语言颜色：`app.js`
- 站点图标：`favicon.svg`

## 部署

仓库 Settings → Pages：

- Source: Deploy from a branch
- Branch: `main` / `/root`

发布后地址为 `https://qyqy-1109.github.io/`。
