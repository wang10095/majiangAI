# -*- coding:UTF-8 -*-
# 该脚本用于加密astc图片 使用python3以上版本解释执行
import os
import time
import sys

CUR_DIR = "C:\\Users\\Desktop"  # 资源文件目录
_KEY = "1h2231xdwt_804t4edb8f_ap543t"  # 指定加密秘钥,英文
_ENCRYSIG = "abin"
# astc的ASTC SIG(4 bytes) 是固定的格式所以可以去掉，解密的时候在加上
_ASCTSIG = bytes([0x13, 0xAB, 0xA1, 0x5C])

filenum = 0


# 判断是否是astc资源
def isASTCSig(bytes_4):
    return bytes_4 == _ASCTSIG


def isASTC(absPath):  # 判断是否是astc图片
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    isFile = os.path.isfile(absPath)
    hasAstcSig = False
    fileExt = os.path.splitext(absPath)[1]
    isAstcExt = fileExt.lower() == ".astc"
    if isFile and isAstcExt:
        with open(absPath, "rb") as file:
            hasAstcSig = isASTCSig(file.read(8)[:4])
    return isFile and isAstcExt and hasAstcSig


# 预处理图片数据 掐头去尾
def preProcessAstc(astcData):
    """
    剪掉astc的signature(4bytes)
    :param astcData:
    :return:
    """
    assert type(astcData) == bytes
    lostHeadData = astcData[4:]
    return lostHeadData


# 加密操作 ascii占一个字节
def encryption(fileData, key):
    """
    加密astc数据
    :param fileData:{bytes}预处理后的astc数据
    :param key:{str}秘钥
    :return:{bytes}加密后的数据
    """
    assert type(key) is str
    k = bytes(key, "utf8")
    klen = len(k)
    kindex = 0
    fileData = bytearray(fileData)
    enIndex = 0
    for i, v in enumerate(fileData):
        if enIndex < 3000:
            if kindex >= klen:
                kindex = 0
            fileData[i] = v ^ k[kindex]  # 加密
            kindex = kindex + 1
            enIndex += 1
        else:
            break
    return bytes(_ENCRYSIG, "utf8") + fileData


# 解密操作
def decryptASTC(fileData, key):
    """
    解密astc数据
    """
    assert type(key) is str
    k = bytes(key, "utf8")
    klen = len(k)
    kindex = 0
    fileData = bytearray(fileData)
    enkLen = len(bytes(_ENCRYSIG, "utf8"))
    lostAddHeadKeyData = fileData[enkLen:]  # 移除加密时添加的头部信息
    enIndex = 0
    for i, v in enumerate(lostAddHeadKeyData):
        if enIndex < 3000:
            if kindex >= klen:
                kindex = 0
            lostAddHeadKeyData[i] = v ^ k[kindex]  # 2次异或还原数据
            kindex = kindex + 1
            enIndex += 1
        else:
            break
    return _ASCTSIG + lostAddHeadKeyData  # 添头，还原astc格式


# 处理图片
def processEncryptASTC(filePath):
    global filenum
    fileData = None
    with open(filePath, "rb") as file:
        fileData = encryption(preProcessAstc(file.read()), _KEY)
    os.remove(filePath)
    file_name, file_extension = os.path.splitext(filePath)
    new_filepath = file_name + ".abin"
    with open(new_filepath, "wb") as file:  # 覆盖新文件
        file.write(fileData)
    filenum = filenum + 1
    print("filenum：", filenum)


def traverseDir(
    absDir, encrypt=True
):  # 遍历当前目录以及递归的子目录，找到所有的astc图片
    """
    :param absDir: 要遍历的路径
    :return: None
    """
    # print("当前目录为：", absDir, "执行加密：", encrypt)
    assert os.path.isdir(absDir) and os.path.isabs(absDir)
    dirName = absDir
    for fileName in os.listdir(absDir):
        absFileName = os.path.join(dirName, fileName)
        if os.path.isdir(absFileName):  # 递归查找文件夹
            traverseDir(absFileName)
        elif isASTC(absFileName):
            processEncryptASTC(absFileName)
        elif isEncryptASTC(absFileName):
            processDecryptASTC(absFileName)
        else:
            pass


def isEncryptASTC(absPath):  # 判断是否是加密过的ASTC图片
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    k = bytes(_ENCRYSIG, "utf8")
    klen = len(k)

    isFile = os.path.isfile(absPath)
    hasEncryptASTCSig = False
    fileExt = os.path.splitext(absPath)[1]
    isAstcExt = fileExt.lower() == ".abin"
    if isFile and isAstcExt:
        with open(absPath, "rb") as file:
            hasEncryptASTCSig = file.read(klen)[:klen] == bytes(_ENCRYSIG, "utf8")
    # print(isFile, isAstcExt, hasEncryptASTCSig)
    return isFile and isAstcExt and hasEncryptASTCSig


def processDecryptASTC(filePath):
    global filenum
    fileData = None
    with open(filePath, "rb") as file:
        fileData = decryptASTC(file.read(), _KEY)
    os.remove(filePath)
    with open(filePath, "wb") as file:  # 覆盖新文件
        file.write(fileData)
    filenum = filenum + 1


# 加密文件夹
def processAstcEncryptFolder(dir):
    global CUR_DIR
    CUR_DIR = dir
    global filenum
    start_clock = time.time()
    print("start_clock", start_clock)
    filenum = 0
    traverseDir(dir)
    end_clock = time.time()
    print("end_clock", end_clock)
    costtime = int(end_clock) - int(start_clock)
    print("process %d astc Pictures" % filenum)
    print("use time %fms" % costtime)


# ------------------- 主函数-------------------------#
# /Users/hxjs/Desktop/hxjs/workspacek/client_project/assets/res/skin
# python3 encrypt_astc.py /Users/hxjs/Desktop/hxjs/workspacek/client_tools/balls
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 2:
        print("Usage: python3 encrypt_astc.py [dir]")
        exit(0)
    processAstcEncryptFolder(sys.argv[1])
