# -*- coding:UTF-8 -*-
# 该脚本用于简单的处理图片，防止明文展示 使用python3以上版本解释执行
import os
import time
import sys

CUR_DIR = "C:\\Users\\Desktop"  # 资源文件目录
isEncrypt = True
_ENCRYSIG = "pkm_encrypt"  # 头标记
# png的PNG SIG(8 bytes) 以及末尾的PNGIEND(12 bytes) 是固定的格式所以可以去掉，解密的时候在加上
_PNGSIG = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
_PNGIEND = bytes(
    [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]
)
filenum = 0


# 判断是否是png资源
def isPNGSig(bytes_8):
    return bytes_8 == _PNGSIG


def isPNG(absPath):  # 判断是否是PNG图片
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    isFile = os.path.isfile(absPath)
    hasPNGSig = False
    fileExt = os.path.splitext(absPath)[1]
    isPngExt = fileExt == ".png" or fileExt == ".PNG"
    if isFile and isPngExt:
        with open(absPath, "rb") as file:
            hasPNGSig = isPNGSig(file.read(8)[:8])
    return isFile and isPngExt and hasPNGSig


def isEncryptPNG(absPath):  # 判断是否是加密过的PNG图片
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    k = bytes(_ENCRYSIG, "utf8")
    klen = len(k)
    print("klen:", klen)

    isFile = os.path.isfile(absPath)
    hasEncryptPNGSig = False
    fileExt = os.path.splitext(absPath)[1]
    isPngExt = fileExt == ".png" or fileExt == ".PNG"
    if isFile and isPngExt:
        with open(absPath, "rb") as file:
            hasEncryptPNGSig = file.read(klen)[:klen] == bytes(_ENCRYSIG, "utf8")
    print(isFile, isPngExt, hasEncryptPNGSig)
    return isFile and isPngExt and hasEncryptPNGSig


# 预处理图片数据 掐头去尾
def preProcessPng(pngData):
    """
    剪掉png的signature(8bytes),IEND(12Bytes)
    :param pngData:
    :return:
    """
    assert type(pngData) == bytes
    lostHeadData = pngData[8:]
    iendData = lostHeadData[-12:]
    if iendData == _PNGIEND:  # 防止Png已经进行过外部软件的压缩,丢掉了IEND
        return lostHeadData[:-12]
    else:
        return lostHeadData


# 加密操作 ascii占一个字节
# 简单的添加文件头和文件尾
def encryption(fileData):
    """
    加密png数据
    :param fileData:{bytes}预处理后的png数据
    :param key:{str}秘钥
    :return:{bytes}加密后的数据
    """
    fileData = bytearray(fileData)
    return bytes(_ENCRYSIG, "utf8") + fileData + bytes(_ENCRYSIG[::-1], "utf8")


# 解密操作
def decryptPNG(fileData):
    """
    解密png数据
    """
    fileData = bytearray(fileData)
    enkLen = len(bytes(_ENCRYSIG, "utf8"))
    lostAddHeadKeyData = fileData[enkLen:]  # 移除加密时添加的头部信息
    lostAddHeadKeyData = lostAddHeadKeyData[0:-enkLen]
    return _PNGSIG + lostAddHeadKeyData + _PNGIEND  # 添头添尾，还原png格式


# 处理图片
def processEncryptPNG(filePath):
    global filenum
    fileData = None
    with open(filePath, "rb") as file:
        fileData = encryption(preProcessPng(file.read()))
    os.remove(filePath)
    file_name, file_extension = os.path.splitext(filePath)
    new_filepath = file_name + ".png"
    with open(new_filepath, "wb") as file:  # 覆盖新文件
        file.write(fileData)
    filenum = filenum + 1
    print("filenum：", filenum)


def processDecryptPNG(filePath):
    global filenum
    fileData = None
    with open(filePath, "rb") as file:
        fileData = decryptPNG(file.read())
    os.remove(filePath)
    with open(filePath, "wb") as file:  # 覆盖新文件
        file.write(fileData)
    filenum = filenum + 1


def traverseDir(
    absDir, encrypt=True
):  # 遍历当前目录以及递归的子目录，找到所有的png图片
    """
    :param absDir: 要遍历的路径
    :return: None
    """
    print("当前目录为：", absDir, "执行加密：", encrypt)
    assert os.path.isdir(absDir) and os.path.isabs(absDir)
    dirName = absDir
    for fileName in os.listdir(absDir):
        absFileName = os.path.join(dirName, fileName)
        if os.path.isdir(absFileName):  # 递归查找文件夹
            traverseDir(absFileName)
        elif isPNG(absFileName):
            processEncryptPNG(absFileName)
        elif isEncryptPNG(absFileName):
            processDecryptPNG(absFileName)
        else:
            pass


# 加密文件夹
def simpleProcessEncryptFolder(dir, isEncryptPng):
    global CUR_DIR
    global isEncrypt
    CUR_DIR = dir
    isEncrypt = isEncryptPng
    global filenum
    start_clock = time.time()
    print("start_clock", start_clock)
    filenum = 0
    traverseDir(dir, isEncrypt)
    end_clock = time.time()
    print("end_clock", end_clock)
    costtime = int(end_clock) - int(start_clock)
    print("process %d Png Pictures" % filenum)
    print("use time %fms" % costtime)


# ------------------- 主函数-------------------------#
# ---------------- 对资源简单处理，添加头防止非法份子直接看到明文资源 ---------------
# /Users/hxjs/Desktop/hxjs/workspacek/client_project/assets/res/skin
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 3:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    simpleProcessEncryptFolder(sys.argv[1], sys.argv[2])
