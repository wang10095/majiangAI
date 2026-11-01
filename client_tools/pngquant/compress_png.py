#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import os, sys

sys.path.append("..")
import utils
from pathlib import Path

colorRed = "\033[31m"
colorEnd = "\033[0m"
if utils.isWindowsSystem():
    current_file = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_file)
    pngquantPath = os.path.join(current_dir, "pngquant.exe")
else:
    pngquantPath = "pngquant"


def run(resDir, skipDirs, qualityRange: []):
    # ==================================get config
    # pngquant所在目录
    global pngquantPath
    # allJPGs = getAllJPGFiles(resDir)
    # compressJPGs(config, allJPGs)
    # ==================================PNG
    allPngFiles = utils.getAllFiles(resDir, [], ".png")
    compressPNGs(
        {
            "noTinyDirs": skipDirs,
            "qualityMin": qualityRange[0],
            "qualityMax": qualityRange[1],
            "speed": 7,
        },
        allPngFiles,
    )


def compressPNGs(config, allPngFiles):
    noTinyDirs = config["noTinyDirs"]
    qualityMin = config["qualityMin"]
    qualityMax = config["qualityMax"]
    speed = config["speed"]

    shellPath = pngquantPath
    print(
        "【开始压缩 png】 "
        + str(len(allPngFiles))
        + "个文件，会有多次压缩,请耐心等待..."
    )

    preSize = getFilesSize(allPngFiles)
    tinypng(noTinyDirs, allPngFiles, shellPath, 0, qualityMin, qualityMax, speed)
    tinypng(noTinyDirs, allPngFiles, shellPath, 50)
    tinypng(noTinyDirs, allPngFiles, shellPath, 100)
    tinypng(noTinyDirs, allPngFiles, shellPath, 200)
    tinypng(noTinyDirs, allPngFiles, shellPath, 300)

    # 对1M以上的大图进行压缩
    while tinypng(noTinyDirs, allPngFiles, shellPath, 1024):
        print("tinypng 1024 * 1024 again ...")

    # 输出大于500K的图片
    # allPngFiles.sort(utils.compareFileSize)
    for file in allPngFiles:
        sz = os.path.getsize(file)
        if sz > 512 * 1024:
            print(getLogPath(file) + " ---> " + str(round(sz / 1024)) + "K")

    afterSize = getFilesSize(allPngFiles)
    bl = round(afterSize * 100 / preSize)
    print(
        "【png压缩完毕】"
        + str(round(preSize / 1024 / 1024, 2))
        + "M -> "
        + str(round(afterSize / 1024 / 1024, 2))
        + "M ,压缩率:"
        + colorRed
        + str(bl)
        + "%"
        + colorEnd
    )


def getFilesSize(files):
    # print("files:", files)
    size = 0
    for file in files:
        if file != "":
            size = size + os.path.getsize(file)
    if size == 0:
        size = 1
    return size


def getAllJPGFiles(res_path):
    cmd = "find " + res_path + ' -name "*.jpg" '
    # 执行
    process = os.popen(cmd)
    file_str = process.read()
    file_list = file_str.split("\n")
    return file_list


def compressJPGs(config, allJPGs):
    currentPath = config["currentPath"]
    noTinyDirs = config["noTinyDirs"]
    qualityJPG = config["qualityJPG"]

    preJPGSize = getFilesSize(allJPGs)
    print("【开始压缩 jpg】" + str(len(allJPGs)))
    for path in allJPGs:
        if path != "":
            if checkIsCompressFolder(noTinyDirs, path):
                os.system(
                    currentPath
                    + "/JPEGCompress "
                    + path
                    + " "
                    + path
                    + " "
                    + str(qualityJPG)
                )

    afterJPGSize = getFilesSize(allJPGs)
    bl = round(afterJPGSize * 100 / preJPGSize)
    print(
        "【jpg压缩完毕】"
        + str(round(preJPGSize / 1024 / 1024, 2))
        + " -> "
        + str(round(afterJPGSize / 1024 / 1024, 2))
        + " ,压缩率:"
        + colorRed
        + str(bl)
        + "%"
        + colorEnd
    )


def getLogPath(path):
    if "res/raw-assets" in path:
        path = path[path.index("res/raw-assets") + 15 :]
    return path


def tinypng(noTinyDirs, allPngFiles, shellPath, size, min=0, max=75, speed=7):
    # if size > 0:
    #     print("allPngFiles:", allPngFiles)
    #     allPngFiles.sort(key=getFilesSize)
    has = False
    curIdx = 0
    p10 = len(allPngFiles) / 10
    preProcess = 0
    print("\r【开始压缩】 >" + str(size) + "K 的图片,请耐心等待...")
    size = size * 1024
    for file in allPngFiles:
        curIdx = curIdx + 1
        if checkIsCompressFolder(noTinyDirs, file):
            if size == 0 or os.path.getsize(file) > size:
                cmd = (
                    shellPath
                    + " --ext .png --force 256 --speed "
                    + str(speed)
                    + " --quality="
                    + str(min)
                    + "-"
                    + str(max)
                    + " "
                    + file
                )
                os.system(cmd)
                has = True
                if curIdx > p10:
                    curIdx = 0
                    preProcess = preProcess + 1
                    print("\r进度" + str(preProcess * 10) + "%")
            else:
                break

    print("\r进度100%")
    return has


# 压缩的文件夹
def checkIsCompressFolder(noTinyDirs, file):
    idx = 0
    for dirName in noTinyDirs:
        if "/" + dirName + "/" in file or "\\" + dirName + "/" in file:
            logStr = getLogPath(file)
            print(colorRed + "[skip] compress file:" + colorEnd + logStr)
            return False
        idx = idx + 1

    imgWidth, imgHeight = utils.get_image_size(file)
    if imgWidth <= 24 or imgHeight <= 24:
        return False
    return True


def getNotTinyFileMd5s(config):
    md5s = []
    files = []
    assetsPath = config["currentPath"] + "/../../assets/"
    for path in config["exceptPaths"]:
        path = assetsPath + path
        if not os.path.exists(path):
            print("ERROR , exceptPath not exists:" + path)
            continue

        files = utils.getAllFiles(path, files, ".png")
        files = utils.getAllFiles(path, files, ".jpg")

    for file in config["exceptFiles"]:
        file = assetsPath + file
        files.append(file)

    # 输出pac文件
    # print("pac files", files)
    pacPathList = {}
    prePath = config["currentPath"] + "/../../"
    prePathLen = len(prePath)
    for file in files:
        try:
            pacPath = file[file.index(prePath) + prePathLen :]
            pacPath = pacPath[: pacPath.rindex("/")]
            pacPathList[pacPath] = 1
        except:
            pass
    return md5s


# python3 compress_png.py /Users/hxjs/Desktop/hxjs/inner/arts/npc
if __name__ == "__main__":
    if len(sys.argv) == 2:
        # 指定相对路径
        # 获取当前目录下所有条目
        compressForder = sys.argv[1]
        print("start compress png")
        # run(sys.argv[1], [], [10, 80])
