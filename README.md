# DSH Brand Studio

[![npm 版本](https://img.shields.io/npm/v/dsh-brand-studio)](https://www.npmjs.com/package/dsh-brand-studio)
[![npm 下载量](https://img.shields.io/npm/dm/dsh-brand-studio)](https://www.npmjs.com/package/dsh-brand-studio)
[![node 版本](https://img.shields.io/node/v/dsh-brand-studio)](https://www.npmjs.com/package/dsh-brand-studio)
[![构建状态](https://img.shields.io/github/actions/workflow/status/qiweiii/dsh-brand-studio/ci.yml?label=build)](https://github.com/qiweiii/dsh-brand-studio/actions)

**简体中文** · [English](README.en.md)

一个小型社区插件，通过独立设置面板，自定义 **DeepSeek Harness 网页、PWA，以及桌面应用内共用的 Web 界面**中的品牌展示。

支持自定义品牌名称和徽章、本地 logo 和字标图片、即时预览、可选的浏览器标题自定义，以及恢复官方外观。桌面应用允许时，窗口标题也会跟随共用网页的标题。配置仅保存在当前设备和访问地址中，不会在网页、桌面端和手机之间同步。侧边栏品牌和新会话 logo 使用 DSH 官方 UI 插槽。

本项目针对应用内的品牌区域，不更改已安装应用的名称、系统图标、桌面应用原生菜单或独立欢迎界面。本插件也不是主题或角色皮肤管理器。

## 效果预览

自定义侧边栏 logo、名称和徽章，同时替换新会话 logo 和页面标题。（截图中的看板娘来自 [dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume) 插件，不包含在本插件中。）

![自定义品牌后的网页/PWA 界面](docs/images/branding-preview.png)

在**设置 → 品牌**中预览修改，调整 logo 大小和圆角，选择文字或图片字标。

![品牌设置面板](docs/images/branding-settings.png)

## 安装

**桌面端**：在应用内打开**插件 → 添加插件**。**网页/PWA**：在网页界面打开同一入口。任选以下一种来源安装。

### npm

输入包名：

```text
dsh-brand-studio
```

网页/PWA 也可以通过命令行安装：

```sh
dsh plugin --profile web add dsh-brand-studio
```

### GitHub

也可以输入仓库地址：

```text
github:qiweiii/dsh-brand-studio
```

网页/PWA 的命令行安装方式：

```sh
dsh plugin --profile web add 'github:qiweiii/dsh-brand-studio'
```

安装后，**桌面端**完全退出再重新打开；**网页/PWA**重启网页服务并刷新页面。随后进入**设置 → 品牌**。

桌面端和网页使用独立 profile，需要分别安装。PWA 使用所在网页服务的插件，无需单独安装。桌面端插件请通过应用内的插件页面管理；上面的常规 CLI 命令仅用于网页 profile。

## 使用

进入**设置 → 品牌**，修改名称、徽章或选择图片。**应用**保存预览中的修改，**取消**放弃尚未保存的修改。名称留空恢复官方名称，徽章留空则隐藏徽章。点击**全部重置**后，再点击**应用**恢复所有默认设置。

图片在本地处理：支持不超过 5 MB、1600 万像素的 PNG、JPEG 和静态 WebP，并缩放至每边最多 512 像素。不支持 SVG 和动态图。本插件不会上传图片或配置。

品牌文字区域提供**文字 / 图片**两种模式，切换时保留原有内容。Logo 同时显示在新会话中，可调整大小和圆角。

新配置默认开启页面标题自定义，保留当前会话名称，也可以关闭。已有配置会保留原来的选择。如果其他品牌或标题插件修改同一区域，请先停用它们。

### 搭配自定义 PWA 名称和图标

> [!NOTE]
> 以下操作仅适用于 DSH 网页安装的 PWA，不适用于官方桌面应用。

用浏览器设置应用名称和系统图标，再用本插件设置应用内的品牌，两者可以搭配使用。

**macOS（Safari，macOS 14 或更新版本）**

1. 在 Safari 打开 DSH 网页，选择**文件 → 添加到程序坞**，输入应用名称并添加。
2. 打开该网页应用，在 macOS 菜单栏选择**应用名称 → 设置 → 通用**。
3. 修改**应用程序名称**，点击**图标**选择本地图片，即可自定义程序坞中的外观。[Apple 操作指南](https://support.apple.com/en-us/104996)

**Windows（Microsoft Edge）**

1. 在 Edge 打开 DSH 网页，选择 **… → 更多工具 → 应用 → 将此站点作为应用安装**。菜单位置可能随版本不同。
2. 如果安装对话框提供名称输入框和图标旁的**编辑**，在安装前设置名称并选择图片。
3. 在 `edge://apps` 中打开应用详情，创建桌面快捷方式或固定到任务栏。[Edge 操作指南](https://support.microsoft.com/en-us/microsoft-edge/install-manage-or-uninstall-apps-in-microsoft-edge-0c156575-a94a-45e4-a54f-3a84846f6113)

已安装的应用也可以通过桌面快捷方式**重命名**，并在**属性 → 快捷方式 → 更改图标**中选择 `.ico` 文件。这只修改快捷方式，不保证运行中的任务栏图标或系统登记的应用名称同步变化。如果重新安装以更换名称或图标，卸载时不要选择清除应用数据。[Windows 快捷方式说明](https://learn.microsoft.com/en-us/answers/questions/278976/chromium-edge-install-this-site-as-an-app-modify-i)

### 卸载

在桌面端或网页/PWA 打开**插件**页面，找到 **DSH Brand Studio**，点击**卸载**并确认。如果只是暂时不用，可以选择禁用。

本项目为独立社区项目，与 DeepSeek 官方无关联。
