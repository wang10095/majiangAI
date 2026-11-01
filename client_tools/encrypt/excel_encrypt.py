# -*- coding:UTF-8 -*-
# 该脚本用于加密json文件， 使用python3以上版本解释执行
import os
import json

_KEY = "6xw5q3sntr_8w4vr2nc7f9_s2qqg"  # 指定加密秘钥,英文hxjs_3022_hanxc
_ENCRYSIG = "encryptjson"


# "6xw5q3sntr_8w4vr2nc7f9_s2qqg"
# "1h2231xdwt_804t4edb8f_ap543t"


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
        # if enIndex < 1000:
        if kindex >= klen:
            kindex = 0
        fileData[i] = v ^ k[kindex]  # 加密
        kindex = kindex + 1
        # enIndex += 1
        # else:
        #     break
    return fileData  # bytes(_ENCRYSIG, "utf8") +


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
        # if enIndex < 1000:
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


# 解密json文件
def processDecryptJson(filePath):
    with open(filePath, "rb") as file:
        byteFileData = decrypt(file.read(), _KEY)
    # 将二进制数据解码为字符串
    json_string = byteFileData.decode("utf-8")
    # 将字符串编码为字节对象
    json_bytes = json_string.encode("utf-8")
    with open(filePath.replace(".bin", ".json"), "wb") as file:  # 覆盖新文件
        file.write(json_bytes)


# processEncryptJson(
#     "/Users/hxjs/Desktop/hxjs/workspacek/client_tools/encrypt/6d339eb50379851a.json"
# )

processDecryptJson(
    "/Users/hxjs/Desktop/hxjs/workspacek/client_tools/encrypt/e0d5f2f1996ba807.bin"
)
