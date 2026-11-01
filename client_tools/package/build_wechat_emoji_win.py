# -* - coding: UTF-8 -* -

import json
import os
import platform
import sys

from first_screen import addSubpackage, clear_root_dir, moveJSToSubpackage

sys.path.append("..")
from exif.exif_remove import process_files_exif
import utils
import shutil
from string import Template
import upload
import time
from pngquant.compress_png import run
from encrypt.encrypt_png_simple import simpleProcessEncryptFolder
# import svn.remote

creatorPath = ""
gameBuildPath = ""
gameServerPath = "/Library/WebServer/Documents/"
projectPath = "../../ClientProject/" #工程路径
buildConfigPath = "buildConfig.json"
packageConfigPath = "conf/project.json"


# 根据不同平台设置具体参数
def readConfigData(filePath):
    f = open(filePath,encoding='utf-8', errors='ignore')     # 要设置格式 以及忽略报错
    package = json.load(f)
    f.close()
    return package

# 初始化路径
def initPath(plaftform):
    currentPath = os.path.dirname(os.path.abspath(__file__))
    print('=============currentPath==============',currentPath)
    global projectPath
    projectPath = os.path.abspath(os.path.join(currentPath, projectPath))
    print('=============projectPath================',projectPath)
    
    global creatorPath
    global buildConfigPath
    buildConfigPath = buildConfigPath.replace(
        "buildConfig.json", "buildConfig_" + plaftform + ".json"
    )
    buildConfigPath = os.path.join(currentPath, buildConfigPath)
    

    packageJson = readConfigData(projectPath + "/package.json")
    print("packageJson:", packageJson, packageJson["creator"]["version"])
    if platform.system() == "Windows":
        creatorPath = (
            "C:\\ProgramData\\cocos\\editors\\Creator\\{version}\\CocosCreator.exe"
        )
    else:
        creatorPath = "/Applications/Cocos/Creator/{version}/CocosCreator.app/Contents/MacOS/CocosCreator"
    creatorPath = creatorPath.format(version=packageJson["creator"]["version"])
    



# 生成编译文件,根据不同编译平台替换不同打包参数
def generateBuildConfig(plaftform, model, type, version):
    # 项目配置文件,不同包或者平台设置对应参数


    packageConfigJson = readConfigData(os.path.join(projectPath, packageConfigPath))
    print('========conf======',packageConfigJson)
    conf = packageConfigJson[plaftform]
    if model == "debug":
        conf = packageConfigJson[plaftform + "_debug"]
    global buildConfigPath
    global gameBuildPath
    # 构建文件
    buildConfigJson = readConfigData(buildConfigPath)
    

    
    
    if type == "pack":  # 整包更新
        buildConfigJson["buildMode"] = "normal"
    elif type == "bundle":  # 仅仅生成bundle包
        buildConfigJson["buildMode"] = "bundle"
    if "Darwin" in platform.system():
        buildConfigJson["buildPath"] = conf.get("macBuildPath")
    else:
        buildConfigJson["buildPath"] = conf.get("winBuildPath")
        
    buildConfigJson["name"] = conf.get("name")
    buildConfigJson["packages"]["wechatgame"]["appid"] =  conf.get("appId")

    buildConfigJson["md5Cache"] = conf.get("md5Cache")
    buildConfigJson["debug"] = conf.get("debug")
    buildConfigJson["sourceMaps"] = conf.get("sourceMaps")
    buildConfigJson["server"] = os.path.join(conf.get("server"), version)
    if model == "debug":
        buildConfigJson["server"] = conf.get("server")
    gameBuildPath = buildConfigJson["buildPath"]

    print("=============================gameBuildPath:==================", gameBuildPath)
    outPath = buildConfigPath.replace(
        "buildConfig.json", "buildConfig_" + plaftform + ".json"
    )
    (head, tail) = os.path.split(outPath)
    outPath = os.path.join(head, "temp")
    if not os.path.exists(outPath):
        os.mkdir(outPath)
    outPath = os.path.join(outPath, tail)
    

    with open(outPath, "w", encoding='utf-8') as f:
        f.write(json.dumps(buildConfigJson, indent=4, ensure_ascii=False))

    return outPath


def generateGameConfig(version):
    command_template = Template(
        """{
        let gameGlobal;
        try {
            if (GameGlobal) {
                gameGlobal = GameGlobal;
            }
        } catch (e) {}
        try {
            if (!gameGlobal) {
                gameGlobal = window;
            }
        } catch (e) {
            console.error('未能找到全局根对象！');
        }

        gameGlobal.gameServerUrl = "$serverUrl";// 默认正式服
        gameGlobal.gameVersion = "$version";
        gameGlobal.gameBuildTime = "$time";
        gameGlobal.getGameGlobal = () => gameGlobal;
    }"""
    )

    gameServerUrl = ""
    currentTime = time.strftime("%m%d%H%M", time.localtime())
    command = command_template.substitute(
        serverUrl=gameServerUrl, version=version, time=currentTime
    )

    with open(projectPath + "/assets/game-config.js", "w",encoding='utf-8') as f:
        f.write(command)


# 生产远程版本信息文件，并上传 目前无用
def generateRemoteConfig(model, version, assetsVersion=1):
    global gameBuildPath
    if platform.system() == "Windows":
        excel_root = "D:\game\design\config"
    else:
        excel_root = "/Users/hxjs/Desktop/hxjs/inner/design/config"
    repo = svn.remote.RemoteClient(excel_root)
    info = repo.info()
    configVersion = info["commit_revision"]

    # inView 0 审核版本 1 正式版本  -1 开发版本
    command_template = Template(
        """{
            "distributeServer":"https://lndb-l.cognizepower.com/game",
            "inViewServer":"https://niudan-test.cognizepower.com/game",
            "devServer":"https://niudan-test.cognizepower.com/game",
            "inView":0,
            "assetsVersion":"$assetsVersion",
            "configVersion":"$configVersion",
            "testers":[],
            "buildTime":"$time"
        }"""
    )
    currentTime = time.strftime("%m%d%H%M", time.localtime())
    command = command_template.substitute(
        configVersion=configVersion, assetsVersion=assetsVersion, time=currentTime
    )
    remoteConfigPath = gameBuildPath + "/" + platformName + "/config"
    os.makedirs(remoteConfigPath, exist_ok=True)
    with open(os.path.join(remoteConfigPath, "remote-config.json"), "w") as f:
        f.write(command)
    # 上传到服务器
    if model == "debug":
        # 测试本地服务器
        remoteTargetPath = platformName
        removeRemoteToServer(remoteConfigPath, remoteTargetPath)
    else:
        # 远程oss
        remoteTargetPath = platformName + "/" + version + "/"
        print("upload remote config to oss!", remoteTargetPath)
        upload.upload_files(remoteConfigPath, remoteTargetPath)


def build(platform, model, type, version):
    print("start build")
    initPath(platform)
    command_template = Template(
        '$creator --project $project_path --build "configPath=$configPath"'
    )
    command = command_template.substitute(
        creator=creatorPath,
        project_path=projectPath,
        configPath=generateBuildConfig(platform, model, type, version),
    )
    print("====buld command====",command)
    os.system(command)


# 混淆和压缩
def uglifyJs(uglify, jsForder):
    global gameBuildPath
    if uglify == "true":
        print("混淆文件")
        uglify_command_template = Template(
            "npx javascript-obfuscator $entranceFilename --output $entranceFilename --compact true --self-defending false"
        )
        # 遍历目录
        
        print("=========================",jsForder)
        uglyfiJsFilePath = ""
        for root, dirs, files in os.walk(jsForder):
            for file in files:
                # 检查文件扩展名是否为.js
                if file.endswith(".js"):
                    uglyfiJsFilePath = os.path.join(root, file)

        uglify_command = uglify_command_template.substitute(
            entranceFilename=uglyfiJsFilePath,
        )
        print('=======javascript-obfuscator==========',uglify_command)
        os.system(uglify_command)
        print("terser")
        terser_command_template = Template(
            "npx terser $filePath -c toplevel,sequences=false -m -o $filePath"
        )
        terser_command = terser_command_template.substitute(
            filePath=uglyfiJsFilePath,
            # filePathTemp=uglyfiJsFilePath + ".txt",
        )
        print('=======terser_command==========',terser_command)
        os.system(terser_command)
        # time.sleep(1)
        # os.remove(uglyfiJsFilePath)
        # time.sleep(1)
        # os.rename(uglyfiJsFilePath + ".txt", uglyfiJsFilePath)


# 将远程资源包移动到服务器
def removeRemoteToServer(srcPath, targetPath):
    print("remove remote package to server")
    gamePlatformServerPath = targetPath
    serverFilelist = os.listdir(
        gamePlatformServerPath
    )  # 列出该目录下的所有文件,listdir返回的文件列表是不包含路径的。
    print("serverFilelist:", serverFilelist)
    for file in serverFilelist:
        dst = os.path.join(gamePlatformServerPath, file)
        if not os.path.exists(dst) or file == ".DS_Store":
            continue
        shutil.rmtree(dst)
    print("clean folder over")
    filelist = os.listdir(
        srcPath
    )  # 列出该目录下的所有文件,listdir返回的文件列表是不包含路径的。
    for file in filelist:
        src = os.path.join(srcPath, file)
        dst = os.path.join(targetPath, file)
        shutil.move(src, dst)


# 压缩png
def compressPng(pngPath):
    if not os.path.exists(pngPath):
        return
    print("compress png: %s" % pngPath)
    run(pngPath, [], [10, 80])


def encryptPng(pngPath):
    if not os.path.exists(pngPath):
        return
    print("encrypt png: %s" % pngPath)
    simpleProcessEncryptFolder(pngPath, True)


def generateMd5List(folder_path, list_file):
    # 确保提供的路径是一个目录
    if not os.path.isdir(folder_path):
        print("指定的路径不是一个有效的目录")
        return
    print("generateMd5List", folder_path)
    # 创建一个空字典来存储文件名和它们的 MD5 哈希值
    files_md5_dict = {}
    # 遍历指定文件夹
    for root, dirs, files in os.walk(folder_path):
        for name in files:
            # 获取文件的完整路径
            file_path = os.path.join(root, name)
            # 计算文件的 MD5 哈希值
            file_md5 = utils.getFileMd5(file_path)
            # 将文件路径和对应的 MD5 哈希值添加到字典中
            file_base_path = os.path.relpath(file_path, folder_path)
            files_md5_dict["res/" + file_base_path] = file_md5

    # 将字典转换为 JSON 字符串
    fileContent = json.dumps({"files": files_md5_dict}, indent=4)
    # 将 JSON 字符串写入清单文件
    with open(list_file, "w") as listf:
        listf.write(fileContent)


# 解压处理资源并重新打包
def compressRemoteBundleAndRezip(remoteForder):
    all_items = os.listdir(remoteForder)
    # 过滤出所有子目录（文件夹）
    folders_only = [
        item for item in all_items if os.path.isdir(os.path.join(remoteForder, item))
    ]
    print(folders_only)
    for folder in folders_only:
        folderPath = os.path.join(remoteForder, folder)
        zipFiles = utils.getFileList(folderPath, "*.zip")
        if len(zipFiles) == 1:
            zipFilePath = zipFiles[0]
            if 'glimmer_pool' in zipFilePath:
                print('bundle name ---->', zipFilePath)
                continue
            filePath, fileName, fileExt = utils.getFileNameAndExtFromPath(zipFilePath)
            unzipFilePath = os.path.join(filePath, "res")
            print("zipFiles-name:", zipFilePath, unzipFilePath)
            utils.unZipFile(zipFilePath, unzipFilePath)
            # process_files_exif(unzipFilePath)
            compressPng(unzipFilePath)
            os.remove(zipFilePath)
            utils.zipFile(unzipFilePath, zipFilePath)
            utils.rmDir(unzipFilePath)
        else:
            print("zipFiles is error!", folder)
            continue


# 移除插件脚本
def removeJsPlugin(srcPath, plugin_name):
    setting_path = ""
    for entry in os.listdir(srcPath):
        full_path = os.path.join(srcPath, entry)
        if full_path.endswith(".json") and "setting" in full_path:
            setting_path = full_path
            break

    if setting_path:
        with open(setting_path, "r", encoding="utf-8") as file:
            settingJsonData = json.load(file)
            if "plugins" in settingJsonData and "jsList" in settingJsonData["plugins"]:
                allPlugins = settingJsonData["plugins"]["jsList"]
                # 移除匹配 plugin_name 的元素
                settingJsonData["plugins"]["jsList"] = [
                    plugin for plugin in allPlugins if plugin.find(plugin_name) == -1
                ]
                print("after:", settingJsonData["plugins"]["jsList"])
                # 将修改后的数据写回文件
                with open(setting_path, "w", encoding="utf-8") as file:
                    json.dump(settingJsonData, file, indent=4, ensure_ascii=False)
                print(f"Plugin '{plugin_name}' removed successfully.")

                # 移除对于的插件脚本
                libPath = srcPath + "/assets/libs/"
                if not os.path.exists(libPath) :
                    return
                for entry in os.listdir(libPath):
                    lib_js_path = os.path.join(libPath, entry)
                    print("lib_js_path:", lib_js_path)
                    print(lib_js_path.endswith(".js"))
                    print(plugin_name in lib_js_path)
                    if lib_js_path.endswith(".js") and plugin_name in lib_js_path:
                        utils.remove_file_if_exists(lib_js_path)
                        print(f"Plugin '{plugin_name} js file' removed successfully.")
                        break
                print(f"Plugin '{plugin_name} js file' removed successfully.")
            else:
                print("No plugins found in the settings file.")
    else:
        print("Settings file not found.")


# wechatgame
# debug,release
# version
# needUglify
# branch,main // 分支出包 还是主干
# python3 build_wechat.py wechatgame release 9.9.9 true
# python3 build_wechat.py ttgame release 9.9.9 true
# python3 build_wechat.py wechatgame_testmmxz release 999.0.0 true 素材组需要的包
if __name__ == "__main__":
    n = len(sys.argv)
    platformName = "wechatgame"
    model = "debug"
    version = "999.0.0"
    # isBranch = "main"
    if n < 5:
        print("error args:need platform model version packtype")
        exit()
    platformName = sys.argv[1]  #wechatgame
    model = sys.argv[2] # release
    version = sys.argv[3]# 9.9.9 版本
    isCompressPng = sys.argv[4] #是否压缩图片
    uglify = sys.argv[5] #true 是否混淆和压缩
    # if n == 6:
    #     isBranch = sys.argv[5]   #main
    # # 分支出包
    # if isBranch == "branch":
    #     projectPath = "../../branch/client_project/"

    print(f"确认版本号，谨慎不要使用线上版本号打包: {version}")
    
    user_input = input("Do you want to continue? (Y/N): ").strip().lower()
    if user_input != "Y" and user_input != "y":
        print("Exiting the script.")
        exit()
        
        
    # 生成game-config.js 用于版本展示
    generateGameConfig(version)
    build(platformName, model, "pack", version)
    # 移除小游戏不需要的脚本插件
    removeJsPlugin(os.path.join(gameBuildPath,platformName,'src'), "jszip")
    # 远程配置信息生成，并上传到服务器
    # generateRemoteConfig(model, version)
    # sys.exit()
    
    if isCompressPng == 'true':    
        print("资源压缩")
        compressPng(gameBuildPath)    # 资源压缩
        print("remote 远程资源解压zip并压缩处理UI资源")
        localRemotePath = gameBuildPath + "/" + platformName + "/remote/"
        compressRemoteBundleAndRezip(localRemotePath)

    uglifyJs(uglify, gameBuildPath + "/" + platformName + "/assets/main/")
    subpackFoders = gameBuildPath + "/" + platformName + "/subpackages"
    for entry in os.listdir(subpackFoders):
        full_path = os.path.join(subpackFoders, entry)
        uglifyJs(uglify, full_path)
    # 是否有cocos目录，有的话自动移除
    utils.rmDir(gameBuildPath + "/" + platformName + "/cocos")
    
    utils.copyPathToFolder(projectPath+'/'+'wx-sub-project', gameBuildPath + "/" + platformName + "/openDataContext")
    
    print('=====gameBuildPath===game_json===')
    print(gameBuildPath + "/" + platformName + "/game.json")
    gameJson = readConfigData(gameBuildPath + "/" + platformName + "/game.json")
    gameJson['permission'] = {
        "scope.userFuzzyLocation": {
            "desc": "你的位置信息将用于小程序位置接口的效果展示"
        }
    }
    with open(gameBuildPath + "/" + platformName + "/game.json", "w", encoding='utf-8') as f:
        f.write(json.dumps(gameJson, indent=4, ensure_ascii=False))

    
    
    print('===============构建完成success================')
    
    
    # print("上传远程bundle资源到服务器")
    # if version != "9.9.9" and version != "9.9.10":
    #     print("线上版本备份")
    #     utils.copyPathToFolder(
    #         gameBuildPath + "/" + platformName, gameBuildPath + "/wx_online/" + version
    #     )
    #     gameResFolder = projectPath + "/assets/res/"
    #     gameBuildRes = gameBuildPath + "/wx_online/" + version + "/res/"
    #     utils.copyPathToFolder(
    #         gameResFolder,
    #         gameBuildRes,
    #         excludePatterns=["abundle_res", "ui_spine", "test", "*.DS_Store", "*.meta"],
    #     )
    # if model == "debug":
    #     # 测试本地服务器
    #     gameSrcRemote = gameBuildPath + "/" + platformName + "/remote/"
    #     remoteTargetPath = gameServerPath + "/" + platformName + "/remote/"
    #     removeRemoteToServer(gameSrcRemote, remoteTargetPath)
    # else:
    #     # 远程oss
    #     print("upload oss!")
    #     remoteTargetPath = platformName + "/" + version + "/remote/"
    #     upload.upload_files(
    #         gameBuildPath + "/" + platformName + "/remote/", remoteTargetPath
    #     )
    # print("上传远程非bundle资源到服务器")
    # if model == "debug":
    #     # 测试本地服务器
    #     gameResFolder = projectPath + "/assets/res/"
    #     remoteTargetPath = gameServerPath + "/res/"
    #     utils.copyPathToFolder(gameResFolder, remoteTargetPath)
    # else:
    #     # 远程oss
    #     print("upload res oss!")
    #     gameResFolder = projectPath + "/assets/res/"
    #     gameBuildRes = gameBuildPath + "/" + platformName + "/res/"
    #     remoteTargetPath = platformName + "/" + version + "/"
    #     utils.copyPathToFolder(
    #         gameResFolder,
    #         gameBuildRes,
    #         excludePatterns=[
    #             "abundle_res",
    #             "ui_spine",
    #             "test",
    #             "*.DS_Store",
    #             "*.meta",
    #             "*.txt",
    #         ],
    #     )
    #     # 生成资源记录minifest
    #     print("create res.json!")
    #     currentPath = os.path.dirname(os.path.abspath(__file__))
    #     generateMd5List(gameBuildRes, "res.json")
    #     print("upload res files to oss!")
    #     upload.upload_files(gameBuildRes, remoteTargetPath + "res/")
    #     print("upload res.json to oss!")
    #     upload.upload_files(
    #         os.path.join(currentPath, "res.json"), remoteTargetPath + "res.json"
    #     )
    #     upload.upload_files(
    #         os.path.join(currentPath, "patch.json"), remoteTargetPath + "patch.json"
    #     )
    # # 首屏优化处理
    # if platformName == 'wechatgame':
    #     rootPath = gameBuildPath + "/" + platformName
    #     # # 移除插件脚本
    #     addSubpackage(rootPath, 'engine')
    #     # # 移除插件脚本
    #     moveJSToSubpackage(rootPath, 'engine')
    #     # 清理根目录
    #     clear_root_dir(rootPath)
