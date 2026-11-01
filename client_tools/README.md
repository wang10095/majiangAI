## 变异构建

### 微信平台
> Mac 使用 build_wechat.py   

`
 python3 build_wechat.py wechatgame release 9.9.9 true branch
`


> Win 使用 build_wechat_win.py

`
 python3 build_wechat_win.py wechatgame release 9.9.9 true branch
`


### 项目构建
1.项目工程/package下面运行npm install 安装nodejs依赖库   

2.安装Python插件库 pip install xxx==y.y.y    (eg:pip install xlrd==1.2.0)

> xlrd==1.2.0   pillow==10.2.0

### 使用python3