#!/usr/bin/env python2
#-*-encoding:utf-8-*-

import sys;
import os;
import fnmatch;
import zipfile 
import platform
import hashlib
#import plugins.biplist
import codecs
import shutil;

def readFile(path):
    if(not os.path.exists(path)):
        return "";
    f = open(path,"rb");
    r = f.read();
    f.close();
    return r;

def readFile2(path,codetype):
    if(not os.path.exists(path)):
        return "";
    f = open(path,"rb",codetype);
    r = f.read();
    f.close();
    return r;

def readFileLines(path):
    if(not os.path.exists(path)):
        return "";
    f = open(path,"rb");
    lines = f.readlines();
    f.close();
    return lines;

def writeToFile(filePath,content):
    f=open(filePath,"w");
    f.write(content);
    f.close();

def getFileList(root,pattern="*",encludePattern=None,yield_folders=False):
    result = []
    patternFiles=[]
    encludeFiles=[]
    patterns = pattern.split(";")
    print root
    for path,subDirs,files in os.walk(root):
        # print path
        if yield_folders:
            files.extend(subDirs)
        for name in sorted(files):
            for pattern in patterns:
                if(fnmatch.fnmatch(os.path.join(path,name),pattern)):
                    # print os.path.join(path,name)
                    patternFiles.append(os.path.join(path,name))
    for fileP in patternFiles:
        if encludePattern:
            encludePatterns = encludePattern.split(";")
            for p in encludePatterns:
                if fnmatch.fnmatch(fileP,p):
                    encludeFiles.append(fileP)
                    break;
    return [f for f in patternFiles if f not in encludeFiles]

def zipFile(srcFile,zipFile,encludePattern=None):
    f = zipfile.ZipFile(zipFile,'w',zipfile.ZIP_DEFLATED)
    for dirpath, dirnames, filenames in os.walk(srcFile):
        for filename in filenames:
            print "filename:",filename
            if encludePattern and os.path.splitext(filename)[1] == encludePattern:
                continue
            if filename == zipFile:
                continue
            f.write(os.path.join(dirpath,filename))
    f.close()

def unZipFile(zipFile,outPath):
    zfile = zipfile.ZipFile(zipFile,'r')
    for filename in zfile.namelist():
        data = zfile.read(filename)
        ext_file = os.path.join(outPath,filename)
        ext_dir = os.path.dirname(ext_file)
        if not os.path.exists(ext_dir): 
            os.mkdir(ext_dir,0777)
        file = open(ext_file, 'w+b')#
        file.write(data)
        file.close()

def compressPng(pngPath,unIncludeFiles):
    for dirpath, dirnames, filenames in os.walk(pngPath):
        for filename in filenames:
            pngpath = os.path.join(dirpath,filename)
            if filename in unIncludeFiles:
                print "uncompress this file",filename
                continue;
            if filename.endswith('png'):
                print "compress:",pngpath
                cmd = "pngquant --ext .png --quality 50-80 --force %s" % pngpath
                os.system(cmd)
            if filename.endswith('jpg'):
                if isWindowsSystem():
                    print "compress:",pngpath
                    cmd = "jpegtran.exe -optimize -progressive -copy none %s %s" % (pngpath,pngpath)
                    os.system(cmd)

def changeJpgToPng(resPath):
    for dirpath, dirnames, filenames in os.walk(resPath):
        for filename in filenames:
            jpgpath = os.path.join(dirpath,filename)
            pngpath = jpgpath.replace(".jpg",".png")
            if filename.endswith('jpg'):
                print "jpg to png:",jpgpath
                cmd = "sips -s format png --out %s %s" % (pngpath,jpgpath)
                os.system(cmd)

def getFileMd5(filename):
    if not os.path.isfile(filename):
        return
    myhash = hashlib.md5()
    f = file(filename,'rb')
    while True:
        b = f.read(8096)
        if not b :
            break
        myhash.update(b)
    f.close()
    return myhash.hexdigest()

#修改plist文件
def modifyPlist(path,key,value):
    if isWindowsSystem():
        try:
            plist = plugins.biplist.readPlist(path)
            plist[key] = value
            plugins.biplist.writePlist(plist,path,False)  
        except (InvalidPlistException, NotBinaryPlistException), e:
            print "Not a plist:", e
    else:
        cmd = "/usr/libexec/PlistBuddy -c 'Set:%s %s' %s" % (key,value,path)
        os.system(cmd)

#修改AndroidManifest.xml
def modifyManifest(filename,key_values):
    doc = xml.dom.minidom.parse(filename)
    root = doc.documentElement
    for k in key_values:
        value = key_values.get(k);
        root.setAttribute(k,value);
    f = file(filename, "w")
    writer = codecs.lookup('utf-8')[3](f)
    doc.writexml(writer, newl='', addindent=' '*4, encoding='utf-8')
    writer.close()
    f.close()

#复制文件到指定目录,指定目录被完全覆盖
def copyPathToFolder(path,distPath,encludePattern=None):
    if os.path.isdir(path):
        if os.path.exists(distPath):
            shutil.rmtree(distPath)
        shutil.copytree(path, distPath)
    else:
        distFolder = distPath
        if os.path.isfile(distPath):
            os.system('rm -fr %s' % distPath)
            distFolder = os.path.dirname(distPath)
        shutil.copy(path,distFolder)

#复制文件夹下所有文件到指定文件夹，和原文件夹内容合并
def copyToExsitPath(path,distPath):
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

def getFileNameAndExtFromPath(path):
    (filepath,filename) = os.path.split(path);
    (filename,extension) = os.path.splitext(filename);
    return filepath,filename,extension

#移除其他语言包资源
def removeLocationRes(path,currentLang,languages):
    print "currentLang:",path,currentLang,languages
    for dirpath, dirnames, filenames in os.walk(path):
        for dir in dirnames:
            oldPath = os.path.join(dirpath,dir+"/")
            newPath = oldPath[0:len(oldPath)-len(currentLang)-1]
            indexPos = oldPath.find(currentLang);
            print oldPath,newPath
            if indexPos != -1:#当前语言的资源文件夹
                print oldPath,newPath
                copyToExsitPath(oldPath,newPath)
                shutil.rmtree(oldPath);
            else:
                for lang in languages:
                    indexPos = oldPath.find(lang);
                    if indexPos != -1:
                        shutil.rmtree(oldPath);

def isWindowsSystem(): 
    return 'Windows' in platform.system()
