# -*- coding: utf-8 -*-
import sys

sys.path.append(
    "/Library/Frameworks/Python.framework/Versions/3.11/lib/python3.11/site-packages"
)
import os
import fnmatch
import zipfile
import platform
import hashlib
import codecs
import shutil
import xml
import xlrd
import re
import time
from PIL import Image


def readFile(path):
    if not os.path.exists(path):
        return ""
    f = open(path, "rb")
    r = f.read()
    f.close()
    return r


def readFile2(path, codetype):
    if not os.path.exists(path):
        return ""
    f = open(path, "rb", codetype)
    r = f.read()
    f.close()
    return r


def readFileLines(path):
    if not os.path.exists(path):
        return ""
    f = open(path, "rb")
    lines = f.readlines()
    f.close()
    return lines


def writeToFile(filePath, content):
    print("filePath utf:", filePath)
    ext_dir = os.path.dirname(filePath)
    if not os.path.exists(ext_dir):
        os.mkdir(ext_dir)

    f = open(filePath, "w", encoding="utf-8")
    f.write(content)
    f.close()


# 读取文件夹下匹配的文件列表
# """
# @param root 根目录
# @param pattern 匹配模式 如:*.png
# @param encludePattern 排除文件
# @return filelist 符合条件的文件名列表
# """
def getFileList(root, pattern="*", encludePattern=None, yield_folders=False):
    patternFiles = []
    encludeFiles = []
    patterns = pattern.split(";")
    print(root)
    for path, subDirs, files in os.walk(root):
        if yield_folders:
            files.extend(subDirs)
        for name in sorted(files):
            for pattern in patterns:
                # print(os.path.join(path, name))
                if fnmatch.fnmatch(os.path.join(path, name), pattern):
                    # print os.path.join(path,name)
                    patternFiles.append(os.path.join(path, name))
    for fileP in patternFiles:
        if encludePattern:
            encludePatterns = encludePattern.split(";")
            for p in encludePatterns:
                if fnmatch.fnmatch(fileP, p):
                    encludeFiles.append(fileP)
                    break
    return [f for f in patternFiles if f not in encludeFiles]


# 解压后保持原来的目录结构
def zipFile(srcFile, zipFile, encludePattern=None):
    f = zipfile.ZipFile(zipFile, "w", zipfile.ZIP_DEFLATED)
    if os.path.isdir(srcFile):
        for dirpath, dirnames, filenames in os.walk(srcFile):
            relative_path = os.path.relpath(dirpath, srcFile)
            for filename in filenames:
                if encludePattern and os.path.splitext(filename)[1] == encludePattern:
                    continue
                if filename == zipFile:
                    continue
                relative_file_path = os.path.join(relative_path, filename)
                f.write(os.path.join(dirpath, filename), relative_file_path)
    else:
        base_name = os.path.basename(srcFile)
        f.write(srcFile, base_name)

    f.close()


# 解压后根目录根据zip变化名称，比如res1.zip 解压后得到res1目录 ， 上面的zipFile方法得到的是res目录
def zip_folder(folder_path, output_path):
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # 相对于folder_path的相对路径
            relative_path = os.path.relpath(root, folder_path)
            for file in files:
                # 构建完整的文件路径
                full_path = os.path.join(root, file)
                # 构建zip中的相对路径
                relative_file_path = os.path.join(relative_path, file)
                # 添加文件到zip
                zipf.write(full_path, relative_file_path)


def unZipFile(zipFile, outPath):
    with zipfile.ZipFile(zipFile, "r") as zip_ref:
        if outPath:
            zip_ref.extractall(outPath)
        else:
            zip_ref.extractall()


def compressPng(pngPath, unIncludeFiles):
    for dirpath, dirnames, filenames in os.walk(pngPath):
        for filename in filenames:
            pngpath = os.path.join(dirpath, filename)
            if filename in unIncludeFiles:
                print("uncompress this file", filename)
                continue
            if filename.endswith("png"):
                print("compress:", pngpath)
                cmd = "pngquant --ext .png --quality 50-80 --force %s" % pngpath
                os.system(cmd)
            if filename.endswith("jpg"):
                if isWindowsSystem():
                    print("compress:", pngpath)
                    cmd = "jpegtran.exe -optimize -progressive -copy none %s %s" % (
                        pngpath,
                        pngpath,
                    )
                    os.system(cmd)


def changeJpgToPng(resPath):
    for dirpath, dirnames, filenames in os.walk(resPath):
        for filename in filenames:
            jpgpath = os.path.join(dirpath, filename)
            pngpath = jpgpath.replace(".jpg", ".png")
            if filename.endswith("jpg"):
                print("jpg to png:", jpgpath)
                cmd = "sips -s format png --out %s %s" % (pngpath, jpgpath)
                os.system(cmd)


def getFileMd5(filename):
    if not os.path.isfile(filename):
        return
    myhash = hashlib.md5()
    with open(filename, "rb") as f:
        while True:
            b = f.read(8096)
            if not b:
                break
            myhash.update(b)
    f.close()
    return myhash.hexdigest()


def string_to_md5(string):
    md5_val = hashlib.md5(string.encode("utf8")).hexdigest()
    return md5_val


def md5_16(string):
    md5_str = hashlib.md5(string.encode()).hexdigest()
    return md5_str[8:24]


# 获取路径下的所有文件
def getAllFiles(path, confound_files, suffix, jumps=[".DS_Store"]):
    if not os.path.isdir(path):
        print("get_all_files error: " + path)
        return
    # 过滤相关文件夹后的文件夹
    confound_dirs = []
    for root, dirs, list in os.walk(path):
        confound_dirs.append(root)
    for item_path in confound_dirs:
        for root, dirs, list in os.walk(item_path):
            for item_file in list:
                file_path = root + "/" + item_file
                if file_path not in confound_files:
                    if suffix and not file_path.endswith(suffix):
                        continue
                    notjump = True
                    for jump in jumps:
                        if jump in file_path:
                            notjump = False
                    if notjump:
                        confound_files.append(file_path)
    results = confound_files
    return results


def get_image_size(image_path):
    # 打开图片文件
    with Image.open(image_path) as img:
        # 获取图片的尺寸
        width, height = img.size

    return width, height


def compareFileSize(f1, f2):
    s1 = os.path.getsize(f1)
    s2 = os.path.getsize(f2)
    if s1 < s2:
        return 1
    elif s1 > s2:
        return -1
    else:
        return 0


# 修改plist文件
# def modifyPlist(path,key,value):
#     if isWindowsSystem():
#         try:
#             plist = plugins.biplist.readPlist(path)
#             plist[key] = value
#             plugins.biplist.writePlist(plist,path,False)
#         except  e:
#             print("Not a plist:", e);
#     else:
#         cmd = "/usr/libexec/PlistBuddy -c 'Set:%s %s' %s" % (key,value,path)
#         os.system(cmd)


# 修改AndroidManifest.xml
def modifyManifest(filename, key_values):
    doc = xml.dom.minidom.parse(filename)
    root = doc.documentElement
    for k in key_values:
        value = key_values.get(k)
        root.setAttribute(k, value)
    f = open(filename, "w")
    writer = codecs.lookup("utf-8")[3](f)
    doc.writexml(writer, newl="", addindent=" " * 4, encoding="utf-8")
    writer.close()
    f.close()


# 复制文件到指定目录,指定目录被完全覆盖
def copyPathToFolder(path, distPath, excludePatterns=None):
    # 忽略函数，根据模式列表返回要忽略的文件或目录名列表
    def ignore_patterns(*patterns):
        def _ignore_patterns(path, names):
            ignored_names = []
            for pattern in patterns:
                ignored_names.extend(fnmatch.filter(names, pattern))
            return set(ignored_names)  # 使用集合去重

        return _ignore_patterns

    if os.path.isdir(path):
        if os.path.exists(distPath):
            shutil.rmtree(distPath)
        # 将整个源目录树复制到目标路径，排除匹配模式的文件或目录
        shutil.copytree(
            path,
            distPath,
            ignore=ignore_patterns(*excludePatterns) if excludePatterns else None,
        )
    else:
        distFolder = distPath
        if os.path.isfile(distPath):
            os.system("rm -fr %s" % distPath)
            distFolder = os.path.dirname(distPath)
        shutil.copy(path, distFolder)


# 复制文件夹下所有文件到指定文件夹，和原文件夹内容合并
def copyToExsitPath(path, distPath):
    if os.path.isdir(path):
        for item in os.listdir(path):
            s = os.path.join(path, item)
            #        print s
            d = os.path.join(distPath, item)
            #        print d
            if os.path.isdir(s):
                #            print "copying"
                shutil.copytree(s, d, False, None)
            else:
                shutil.copy2(s, d)
    else:
        if os.path.isfile(distPath):
            os.system("rm -fr %s" % distPath)
        shutil.copy2(path, distPath)


def copyFileToOtherPath(source_file_path, target_file_path):
    # print(f"copyFileToOtherPath: 如果目标目录不存在则创建")
    # 创建目标目录的完整路径（保持原始的目录结构）
    target_file_dir = os.path.dirname(target_file_path)
    # 如果目标目录不存在，则创建它
    os.makedirs(target_file_dir, exist_ok=True)
    # 复制文件到目标路径
    try:
        shutil.copy(source_file_path, target_file_path)
        # print(f"文件已成功复制到: {target_file_path}")
    except IOError as e:
        print(f"无法复制文件: {e}")


def rmDir(directory_path):
    # 检查目录是否存在
    if os.path.exists(directory_path) and os.path.isdir(directory_path):
        try:
            shutil.rmtree(directory_path)
            print(f"目录 '{directory_path}' 已成功删除。")
        except OSError as e:
            print(f"删除目录时发生错误: {e.strerror}", directory_path)
    else:
        print(f"目录 '{directory_path}' 不存在。")
        



# 移除文件
def remove_file_if_exists(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"The file '{file_path}' has been removed.")
    else:
        print(f"The file '{file_path}' does not exist.")


def getFileNameAndExtFromPath(path):
    (filepath, filename) = os.path.split(path)
    (filename, extension) = os.path.splitext(filename)
    return filepath, filename, extension


# 移除其他语言包资源
def removeLocationRes(path, currentLang, languages):
    print("currentLang:", path, currentLang, languages)
    for dirpath, dirnames, filenames in os.walk(path):
        for dir in dirnames:
            oldPath = os.path.join(dirpath, dir + "/")
            newPath = oldPath[0 : len(oldPath) - len(currentLang) - 1]
            indexPos = oldPath.find(currentLang)
            print(oldPath, newPath)
            if indexPos != -1:  # 当前语言的资源文件夹
                print(oldPath, newPath)
                copyToExsitPath(oldPath, newPath)
                shutil.rmtree(oldPath)
            else:
                for lang in languages:
                    indexPos = oldPath.find(lang)
                    if indexPos != -1:
                        shutil.rmtree(oldPath)


# 读取excel表所有sheet ，sheet 开头必须符合正则规则
# excelName 表格名称
# sheetNamePattern sheet名称正则
def readExcelFile(excelPath, sheetNamePattern=None):
    print("start readExcelFile:", excelPath)
    xlrd.Book.encoding = "utf-8"
    startTime = time.time()
    excelNameWithExt = os.path.basename(excelPath)
    excelName, excelExt = os.path.splitext(excelNameWithExt)
    workBook = xlrd.open_workbook(excelPath)
    sheetNames = workBook.sheet_names()  # 查看包含的工作表
    excelDict = {}
    for sheetName in sheetNames:
        if sheetNamePattern == None or re.match(sheetNamePattern, sheetName):
            sheet = workBook.sheet_by_name(sheetName)
            print(sheetName, sheet.nrows)
            sheetData = []
            if sheet.nrows > 0:
                for rowNum in range(sheet.nrows):
                    # print(sheet.row_values(rowNum))
                    sheetData.append(sheet.row_values(rowNum))
            excelDict[sheetName] = sheetData
    print(
        "read excel {} finish, cost time {}.".format(excelName, time.time() - startTime)
    )
    # print("excelDict:", excelDict)
    return excelDict


def isWindowsSystem():
    return "Windows" in platform.system()


def isMacOS():
    return "Darwin" in platform.system()
