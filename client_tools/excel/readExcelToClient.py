# -*- coding: utf-8 -*-
import sys

import os
sys.path.append(".\..")
import utils
# import xlrd
# import multiprocessing
# from multiprocessing import Process, Manager

import exportClientFormat

# 策划配置目录
global excel_root, client_root


# """
# excel数据格式 前N行代表含义：
# 0、字段名称 id name ...
# 1、字段类型 string int float array json
# 2、导出类型 0 客户端服务器 1 仅服务器 2 仅客户端 3 都不导出
# 3、字段含义描述 英雄id 英雄名称
# """
def readExcelsInFolder(excelFolderName):
    allExcelFils = utils.getFileList(excelFolderName, "*.xlsx")  #获取文件列表 ['D:\\Cocos\global.xlsx']

    # # Manager类似于同步数据管理工具，可在多进程时实现各进程操作同一个数据，比如这里通过它组织返回值
    # manager = Manager();
    # # Manager.dict()类似于共享变量，各个进程可以修改它，通过每次添加不同的key值，可以实现方法返回值的获取
    # excelData = manager.dict()
    excelDic = {}
    # processes = [] # 多进程 废弃 
    for excelPathName in allExcelFils:    #读取表格的内容
        if str.find(os.path.basename(excelPathName), "~") == -1:
            excelNameWithExt = os.path.basename(excelPathName)
            func_excelName, excelExt = os.path.splitext(excelNameWithExt)
            # funcExcelName = func_excelName.split("_")
            # dicrExcelName = funcExcelName[0]
            # if len(funcExcelName) > 1:
            #     dicrExcelName = funcExcelName[1]
            excelDic[func_excelName] = utils.readExcelFile(
                excelPathName, "^[a-zA-z0-9]*$"
            )
            # processes.append(Process(target=utils.readExcelFile,args=(excelPathName,excelData,excelDic[excelName],"^[a-zA-z]*$")))
    # for process in processes:
    #     process.start();
    # for process in processes:
    #     process.join()
    # print("excelData:",excelData)
    print("excelData:", excelDic)
    exportClientFormat.exportClientData(client_root, excelDic, excel_root)


# /Users/hxjs/Desktop/hxjs/inner/design/config
# 函数入口
if __name__ == "__main__":
    print(sys.argv)
    excelFileName = None
    if len(sys.argv) < 3:
        print("error args:need arg1 excelroot arg2 clientroot")
        exit()
    if len(sys.argv) >= 3:
        excel_root = sys.argv[1]
        client_root = sys.argv[2]
    if excelFileName == None:
        print("change all excel to json")
        readExcelsInFolder(excel_root)
    # else:
    #     print("change {} to json".format(excelFileName))
    #     excelDic = {}
    #     excelNameWithExt = os.path.basename(excelFileName)
    #     excelName, excelExt = os.path.splitext(excelNameWithExt)
    #     excelDic[excelName] = utils.readExcelFile(excelFileName, "^[a-zA-z]*$")
    #     exportClientFormat.exportClientData(client_root, excelDic)
