# -*- coding:UTF-8 -*-
# 同步svn到git
import os
import sys

sys.path.append("..")
import utils
import shutil

ART_DIR = ""
OUT_DIR = ""
UnpackFolderName = ["ui"]


def pack_action(
    inputPath,
    outputPath,
    opt,
    scale,
    maxSize,
    sheetSuffix,
    textureFormat,
    sizeConstraints,
    sheetName,
    otherParams,
    fileNameSuffix,
):
    packCommand = (
        "TexturePacker" + " --format creator_simple"
        " --maxrects-heuristics best"
        " --enable-rotation"
        " --shape-padding 2"
        " --border-padding 0"
        " --trim-mode Trim"
        " --basic-sort-by Name"
        " --basic-order Ascending"
        " --texture-format {textureFormat}"
        " --data {outputSheetNamePath}{fileNameSuffix}.json"
        " --sheet {outputSheetNamePath}{fileNameSuffix}.{sheetSuffix}"
        " --scale {scale}"
        " --max-size {maxSize}"
        " --opt {opt}"
        " --size-constraints {sizeConstraints}"
        " {inputPath}"
        " {otherParams}"
    )

    packCommand = packCommand.format(
        textureFormat=textureFormat,
        outputSheetNamePath=os.path.join(outputPath, sheetName),
        sheetName=sheetName,
        sheetSuffix=sheetSuffix,
        scale=scale,
        maxSize=maxSize,
        opt=opt,
        sizeConstraints=sizeConstraints,
        inputPath=inputPath,
        otherParams=otherParams,
        fileNameSuffix=fileNameSuffix,
    )

    os.system(packCommand)


# 程序目录
# python3 process_texturepackaer.py /Users/hxjs/Desktop/hxjs/inner/arts/ART/atlas/skins /Users/hxjs/Desktop/hxjs/inner/arts/ART/res/skins hunt_treasure_haohua
# svn cleanup --remove-unversioned
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 3:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    ART_DIR = sys.argv[1]
    OUT_DIR = sys.argv[2]
    if n > 3:
        EXC_PLIST_DIR = sys.argv[3]  # 只对改文件夹操作
        print("exc plist dir:", EXC_PLIST_DIR)
        newDir = os.path.join(ART_DIR, EXC_PLIST_DIR)
        outSheetName = os.path.basename(newDir)
        pack_action(
            newDir,
            OUT_DIR,
            "RGBA8888",
            1,
            2048,
            "png",
            "png",
            "AnySize",
            outSheetName,
            "--png-opt-level 7",
            "",
        )
    else:
        for cDir in os.listdir(ART_DIR):
            if cDir.startswith(".") or cDir.startswith("ui"):
                continue
            newDir = os.path.join(ART_DIR, cDir)
            if os.path.isdir(newDir) and not (str(cDir) in UnpackFolderName):
                print("exc root dir:", ART_DIR, cDir)
                outSheetName = os.path.basename(newDir)
                pack_action(
                    newDir,
                    OUT_DIR,
                    "RGBA8888",
                    1,
                    2048,
                    "png",
                    "png",
                    "AnySize",
                    outSheetName,
                    "--png-opt-level 7",
                    "",
                )
