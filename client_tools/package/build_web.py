# -* - coding: UTF-8 -* -

import json
import os
import platform
import sys

sys.path.append("..")
from exif.exif_remove import process_files_exif
import utils
import shutil
from string import Template
from pngquant.compress_png import run


creatorPath = ""
gameBuildPath = ""
gameServerPath = "/Library/WebServer/Documents/remote/"
projectPath = "../../client_project/"
buildConfigPath = "buildConfig.json"
packageConfigPath = "conf/project.json"


# 根据不同平台设置具体参数
def readConfigData(filePath):
    f = open(filePath)
    package = json.load(f)
    f.close()
    return package


# 初始化路径
def initPath(plaftform):
    currentPath = os.path.dirname(os.path.abspath(__file__))
    global creatorPath
    global buildConfigPath
    global projectPath
    buildConfigPath = buildConfigPath.replace(
        "buildConfig.json", "buildConfig_" + plaftform + ".json"
    )
    buildConfigPath = os.path.join(currentPath, buildConfigPath)
    packageJson = readConfigData(projectPath + "/package.json")
    print("packageJson:", packageJson, packageJson["creator"]["version"])
    if platform.system() == "Windows":
        creatorPath = "C:\ProgramData\cocos\editors\Creator\{version}\CocosCreator.exe"
    else:
        creatorPath = "/Applications/Cocos/Creator/{version}/CocosCreator.app/Contents/MacOS/CocosCreator"
    creatorPath = creatorPath.format(version=packageJson["creator"]["version"])


# 生成编译文件,根据不同编译平台替换不同打包参数
def generateBuildConfig(plaftform, type):
    # 项目配置文件,不同包或者平台设置对应参数
    global projectPath
    packageConfigJson = readConfigData(os.path.join(projectPath, packageConfigPath))
    conf = packageConfigJson[plaftform]

    global buildConfigPath
    global gameBuildPath
    # 构建文件
    buildConfigJson = readConfigData(buildConfigPath)
    buildConfigJson["buildPath"] = gameBuildPath
    if type == "pack":  # 整包更新
        buildConfigJson["buildMode"] = "normal"
    elif type == "bundle":  # 仅仅生成bundle包
        buildConfigJson["buildMode"] = "bundle"
    buildConfigJson["md5Cache"] = conf.get("md5Cache")
    buildConfigJson["debug"] = conf.get("debug")
    buildConfigJson["sourceMaps"] = conf.get("sourceMaps")
    # 使用 os.path.basename 获取路径的最后一部分
    last_directory = os.path.basename(gameBuildPath)
    print("server:", gameBuildPath, conf.get("server"), last_directory)
    buildConfigJson["server"] = os.path.join(conf.get("server"), last_directory)
    outPath = buildConfigPath.replace(
        "buildConfig.json", "buildConfig_" + plaftform + ".json"
    )

    (head, tail) = os.path.split(outPath)
    outPath = os.path.join(head, "temp")
    if not os.path.exists(outPath):
        os.mkdir(outPath)
    outPath = os.path.join(outPath, tail)

    with open(outPath, "w") as f:
        f.write(json.dumps(buildConfigJson, indent=4, ensure_ascii=False))

    return outPath


def build(platform, type):
    initPath(platform)
    command_template = Template(
        '$creator --project $project_path --build "configPath=$configPath"'
    )
    command = command_template.substitute(
        creator=creatorPath,
        project_path=projectPath,
        configPath=generateBuildConfig(platform, type),
    )
    print("command:", command)
    os.system(command)


# 将远程资源包移动到服务器
# ios
def removeRemoteToServer():
    print("remove remote package to server")
    serverFilelist = os.listdir(
        gameServerPath
    )  # 列出该目录下的所有文件,listdir返回的文件列表是不包含路径的。
    print("serverFilelist:", serverFilelist)
    for file in serverFilelist:
        dst = os.path.join(gameServerPath, file)
        if not os.path.exists(dst) or file == ".DS_Store":
            continue
        shutil.rmtree(dst)
    print("clean folder over")
    gameRemote = gameBuildPath + "/wechatgame/remote/"
    filelist = os.listdir(
        gameRemote
    )  # 列出该目录下的所有文件,listdir返回的文件列表是不包含路径的。
    for file in filelist:
        src = os.path.join(gameRemote, file)
        dst = os.path.join(gameServerPath, file)
        shutil.move(src, dst)


def compressPng(pngPath):
    if not os.path.exists(pngPath):
        return
    print("compress png: %s" % pngPath)
    run(pngPath, [], [50, 80])


def syncRemoteRes(gameBuildPath):
    gameRemote = gameBuildPath
    resDir = projectPath + "/assets/res"
    print("sync remote res", resDir, gameRemote)
    utils.copyPathToFolder(resDir, gameRemote + "/res")


# python3 build_web.py web-desktop D:\Runner\nginx-1.25.3\root
if __name__ == "__main__":
    n = len(sys.argv)
    platformName = "web-desktop"  # web-mobile
    currentPath = os.path.dirname(os.path.abspath(__file__))
    projectPath = os.path.abspath(os.path.join(currentPath, projectPath))
    if n == 2:
        platformName = sys.argv[1]
    elif n == 3:
        platformName = sys.argv[1]
        gameBuildPath = sys.argv[2]
    elif n == 4:
        platformName = sys.argv[1]
        gameBuildPath = sys.argv[2]
        projectPath = sys.argv[3]
    print(n, gameBuildPath, projectPath)
    build(platformName, "pack")
    # # 远程资源移动到服务器或者oss
    # removeRemoteToServer()
    # 同步远程资源
    syncRemoteRes(gameBuildPath)
    # 资源压缩
    print("start compress %s" % gameBuildPath)
    # process_files_exif(gameBuildPath)
    compressPng(gameBuildPath)
