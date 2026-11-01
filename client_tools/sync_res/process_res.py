# -*- coding:UTF-8 -*-
# 同步svn到git
import os
import sys

sys.path.append("..")
from exif.exif_remove import process_files_exif
import utils
import shutil
from encrypt.encrypt_png import processEncryptFolder
from astc.encrypt_astc import processAstcEncryptFolder
from astc.convert_astc import processCovertASTC

from pngquant.compress_png import run


# 1、压缩远程资源
# 2、加密指定目录资源
ART_DIR = ""
CLIENT_DIR = ""

# 需要加密的资源目录
ENCRYPT_DIRS = [
    "skin",
    "equips",
    "pet_skin",
    "icon_pet",
    "icon_pet_equip",
    "suits",
    "furnitures",
    "icon_furnitures",
]

# 跳过压缩的资源
SKIP_COMPRESS_DIRS = ["makeup"]


# 压缩png
def compressPng(pngPath):
    if not os.path.exists(pngPath):
        return
    global SKIP_COMPRESS_DIRS
    print("compress png: %s" % pngPath)
    run(pngPath, SKIP_COMPRESS_DIRS, [20, 80])


# 加密
def encryptPng(pngPath):
    if not os.path.exists(pngPath):
        return
    print("encrypt png: %s" % pngPath)
    processEncryptFolder(pngPath, True)


# 自定义函数，用于在复制过程中打印和记录创建的目录
def on_copy(src, excludeNames):
    global ART_DIR
    global CLIENT_DIR
    # 计算目标目录的路径
    dst = src.replace(ART_DIR, CLIENT_DIR, 1)
    # 如果目标目录不存在，则打印并创建目录
    if not os.path.exists(dst):
        print(f"Created directory: {dst}")
    return []  # 不忽略任何文件或目录


# 同步艺术目录到程序目录
def syncArt(artPath, clientPath):
    print("sync art: %s to %s" % (artPath, clientPath))
    try:
        # 复制整个目录树到目标目录，记录创建的目录
        # shutil.copytree(artPath, clientPath, ignore=on_copy)
        if not os.path.exists(clientPath):
            os.makedirs(clientPath)
        for item in os.listdir(artPath):
            s = os.path.join(artPath, item)
            d = os.path.join(clientPath, item)
            if os.path.isdir(s):
                shutil.copytree(
                    s, d, ignore=on_copy, dirs_exist_ok=True
                )  # For Python 3.8+ use dirs_exist_ok=True
            else:
                shutil.copy2(s, d)

        print(f"Directory copied successfully from {artPath} to {clientPath}")
    except Exception as e:
        print(f"An error occurred: {e}")


# 美术目录
# 程序目录
# python3 process_res.py /Users/hxjs/Desktop/hxjs/inner/arts/ART/res /Users/hxjs/Desktop/hxjs/workspacek/client_project/assets/res
# svn revert -R .
# svn cleanup --remove-unversioned
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 4:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    ART_DIR = sys.argv[1]
    CLIENT_DIR = sys.argv[2]
    isDev = sys.argv[3]
    if not isDev:
        process_files_exif(ART_DIR)
    compressPng(ART_DIR)
    # 获取当前目录下所有条目
    all_items = os.listdir(ART_DIR)
    # 过滤出所有子目录（文件夹）
    folders_only = [
        item for item in all_items if os.path.isdir(os.path.join(ART_DIR, item))
    ]

    # 输出所有子目录
    for folder in folders_only:
        folderPath = os.path.join(ART_DIR, folder)
        # astc 需包含astc和png两份资源
        if os.path.exists(os.path.join(folderPath, "astc-encrypt.txt")):
            print(f"{folderPath} 属于astc加密目录")
            processCovertASTC(
                folderPath,
                folderPath,
                "8*8",
                [".png"],
            )
            processAstcEncryptFolder(folderPath)
            encryptPng(folderPath)
        else:
            if os.path.exists(os.path.join(folderPath, "webp.txt")):
                print(f"{folderPath} 属于webp非加密目录")
            else:
                print(f"{folderPath} 此目录不做任何处理")

    syncArt(ART_DIR, CLIENT_DIR)
