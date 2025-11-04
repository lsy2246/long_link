## 项目介绍

**简介**：使用 Cloudflare Pages 创建超长链接生成器

**我的演示站点**：[https://cccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.cc/](https://cccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.cc/)

## 安装教程：使用 Cloudflare Pages 部署

### 部署步骤如下

1. Fork 本项目，随意命名，例如 "Long"。我在原项目 [https://github.com/x-dr/short](https://github.com/x-dr/short) 的基础上做了一些修改，例如添加了网站页脚和生成链接后的操作逻辑，将短链接改为长链接生成器。感谢原项目及其作者。

2. 将此 Git 项目连接到你的 Cloudflare Pages 并部署项目。

   2.1 创建并登录你的 Cloudflare 账户；

   2.2 在 Workers and Pages 中，选择 Pages，创建项目，连接到 Git，选择你 Fork 的 Git 项目。

   2.3 设置构建和部署，选择默认设置。等待 Cloudflare 部署完成即可。

3. 创建 D1 数据库以存储必要数据。选择 D1，创建数据库，随意命名（例如 Longurl），创建完成后即可获得名为 Longurl 的 D1 数据库。
   参考：[D1 创建教程](https://github.com/x-dr/telegraph-Image/blob/main/docs/manage.md)

4. 进入 Workers and Pages 控制台执行 SQL 命令。命令如下，直接复制并在控制台中执行即可。

```sql
DROP TABLE IF EXISTS links;
CREATE TABLE IF NOT EXISTS links (
  `id` integer PRIMARY KEY NOT NULL,
  `url` text,
  `slug` text,
  `ua` text,
  `ip` text,
  `status` int,
  `create_time` DATE
);
DROP TABLE IF EXISTS logs;
CREATE TABLE IF NOT EXISTS logs (
  `id` integer PRIMARY KEY NOT NULL,
  `url` text ,
  `slug` text,
  `referer` text,
  `ua` text ,
  `ip` text ,
  `create_time` DATE
);

```

5. 将你的项目与 D1 数据库绑定。在你的 Workers and Pages 中，选择你 Fork 的项目 Long，按如下步骤操作：

   设置 -> 函数 -> D1 数据库绑定 -> 编辑绑定 -> 变量名称，必须填写 **DB** -> 命名空间，填写你的 D1 名称，例如 Longurl -> 保存绑定。

6. 重新部署项目，否则会出现错误。方法：在你的 Workers and Pages 中，选择你 Fork 的项目 Long，部署，重新部署项目。

7. 如果你愿意，项目可以使用 Cloudflare 的子域名正常工作，例如 long-998.pages.dev。如果你想自定义项目域名，在 Cloudflare 的 Fork 项目中，选择自定义域名设置，然后绑定你的域名。之后你就可以使用你的域名访问项目，例如 link.lsy22.com。

8. 尽情享受。如果你喜欢或对你有帮助，请给个 Star。谢谢。

**9. 配置预设参数**

在 `functions/create.js` 文件顶部，修改预设配置：

```javascript
// ========== 预设配置区域 ==========
const PRESET_CONFIG = {
  char: "c", // 预设重复的字符（改成你想要的字符）
  minLength: 100, // 最小长度
  maxLength: 1000, // 最大长度
};
// ==================================
```
