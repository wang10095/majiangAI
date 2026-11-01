# -*- coding:UTF-8 -*-
# 该脚本用于加密json文件， 使用python3以上版本解释执行
import os
import time
import sys
import json


CUR_DIR = "C:\\Users\\Desktop"  # 资源文件目录
isEncrypt = True
_KEY = "hxjs_3022_hanxc"  # 指定加密秘钥,英文
_ENCRYSIG = "encryptjson"
filenum = 0


def isJsonFile(absPath):  # 判断是否是PNG图片
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    isFile = os.path.isfile(absPath)
    fileExt = os.path.splitext(absPath)[1]
    isJsonExt = fileExt == ".json"
    return isFile and isJsonExt


# 加密操作 ascii占一个字节
def encryption(fileData, key):
    """
    加密数据
    :param fileData:{bytes}数据
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
        if enIndex < 1000:
            if kindex >= klen:
                kindex = 0
            fileData[i] = v ^ k[kindex]  # 加密
            kindex = kindex + 1
            enIndex += 1
        else:
            break
    return bytes(_ENCRYSIG, "utf8") + fileData


# 解密操作
def decrypt(fileData, key):
    """
    解密png数据
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
        if enIndex < 1000:
            if kindex >= klen:
                kindex = 0
            lostAddHeadKeyData[i] = v ^ k[kindex]  # 2次异或还原数据
            kindex = kindex + 1
            enIndex += 1
    return lostAddHeadKeyData  # 添头添尾，还原png格式


def changeJsonToByteArray(filePath):
    fileData = None
    with open(filePath, "rb") as file:
        fileData = json.load(file)
    fileString = json.dumps(fileData)
    binary_data = fileString.encode("utf-8")
    return binary_data


def changeByteArrayToJson(filePath):
    # 读取二进制文件
    with open(filePath, "rb") as file:
        binary_data = file.read()
    # 将二进制数据解码为字符串
    json_string = binary_data.decode("utf-8")
    # 将字符串解析为JSON
    data = json.loads(json_string)
    print("data:", data)
    return data


# 加密处理json
def processEncryptJson(filePath):
    global filenum
    fileData = changeJsonToByteArray(filePath)
    fileData = encryption(fileData, _KEY)
    # os.remove(filePath)
    file_name, file_extension = os.path.splitext(filePath)
    new_filepath = file_name + ".bin"
    with open(new_filepath, "wb") as file:  # 覆盖新文件
        file.write(fileData)
    filenum = filenum + 1
    print("filenum：", filenum)


# 解密json文件
def processDecryptJson(filePath):
    global filenum
    with open(filePath, "rb") as file:
        byteFileData = decrypt(file.read(), _KEY)
    # 将二进制数据解码为字符串
    json_string = byteFileData.decode("utf-8")
    # 将字符串解析为JSON
    # fileData = json.loads(json_string)
    # binary_data = json_string.encode("utf-8")
    # print("json_string:", filePath, filePath.replace(".bin", ".json"))
    # print("fileData", fileData)
    # os.remove(filePath)
    with open(filePath.replace(".bin", ".json"), "wb") as file:  # 覆盖新文件
        file.write(json_string)
    filenum = filenum + 1


def traverseDir(
    absDir, encrypt=True
):  # 遍历当前目录以及递归的子目录，找到所有的json图片
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
        elif encrypt == True and isJsonFile(absFileName):
            processEncryptJson(absFileName)
        elif encrypt != True and isEncryptFile(absFileName):
            processDecryptJson(absFileName)
        else:
            pass


def isEncryptFile(absPath):  # 判断是否是加密过的P
    """
    :param absPath: 文件的绝对路径
    :return: {Bool}
    """
    k = bytes(_ENCRYSIG, "utf8")
    klen = len(k)

    isFile = os.path.isfile(absPath)
    fileExt = os.path.splitext(absPath)[1]
    isBinExt = fileExt == ".bin"
    hasEncryptSig = False
    if isFile and isBinExt:
        with open(absPath, "rb") as file:
            hasEncryptSig = file.read(klen)[:klen] == bytes(_ENCRYSIG, "utf8")
    print(absPath, isFile, isBinExt, hasEncryptSig)
    return isFile and isBinExt and hasEncryptSig


# 加密文件夹
def processEncryptFolder(dir, isEncryptFile):
    global CUR_DIR
    global isEncrypt
    CUR_DIR = dir
    isEncrypt = isEncryptFile
    global filenum
    start_clock = time.time()
    print("start_clock", start_clock)
    filenum = 0
    traverseDir(dir, isEncrypt)
    end_clock = time.time()
    print("end_clock", end_clock)
    costtime = int(end_clock) - int(start_clock)
    print("process %d json num" % filenum)
    print("use time %fms" % costtime)


# ------------------- 主函数-------------------------#
# /Users/hxjs/Desktop/hxjs/workspacek/client_project/assets/res/skin
# python3 encrypt_json.py /Users/hxjs/Desktop/hxjs/workspacek/client_tools/encrypt true
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 3:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    # processEncryptFolder(sys.argv[1], sys.argv[2])
    # processDecryptJson(sys.argv[1])
