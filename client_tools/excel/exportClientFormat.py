# -*- coding: utf-8 -*-
import utils
import os
import platform
import sys
import json
import svn.remote

from datetime import datetime
import time

# excel数据类型和ts数据类型映射关系
excelRefTsType = {
    "string": "string",
    "int": "number",
    "float": "number",
    "stringArray": "string[]",
    "intArray": "number[]",
    "floatArray": "number[]",
    "json": "any",
    "map": "any",
    "mapArray": "any[]",
    "intsArray": "any[]",
    "dateTime": "number",
}


def changeExcelRowValToTsValue(excelType, excelVal):
    tsVal = excelVal
    try:
        if excelType == "int":
            if type(excelVal) == float:
                tsVal = int(excelVal)
            elif type(excelVal) == str and excelVal.strip() == "":
                tsVal = 0
            else:
                tsVal = int(excelVal)
        elif excelType == "string":
            tsVal = str(excelVal).strip()
        elif excelType == "stringArray":
            tsVal = str(excelVal).split("|")
        elif excelType == "intArray":
            changeToArray = []
            if excelVal != "":
                vals = str(excelVal).split("|")
                # print("excelVal:", excelVal, vals)
                if len(vals) > 0:
                    for val in vals:
                        if val.strip() != "":
                            changeToArray.append(int(float(val)))
            # print("changeToArray2:", changeToArray)
            tsVal = changeToArray
        elif excelType == "floatArray":
            changeToArray = []
            if excelVal != "":
                vals = str(excelVal).split("|")
                if len(vals) > 0:
                    for val in vals:
                        changeToArray.append(float(val))
            tsVal = changeToArray
        elif excelType == "map":
            changeToMap = {}
            # print("map val:", excelVal)
            if excelVal != "" and excelVal != 0:
                # print("find ,", str(excelVal).find("，"))
                if str(excelVal).find("，") != -1:
                    mapVals = str(excelVal).split("，")
                else:
                    mapVals = str(excelVal).split(",")
                if len(mapVals) > 0:
                    for mapVal in mapVals:
                        if not mapVal or str(mapVal).strip() == "":
                            continue
                        keyVal = str(mapVal).strip().split("#")
                        if len(keyVal) != 2:
                            print("val:", mapVal, keyVal)
                            raise Exception("excel error fomat please to check!")
                        changeToMap[keyVal[0].strip()] = keyVal[1].strip()
            tsVal = changeToMap
        elif excelType == "mapArray":
            changeToArray = []
            print("mapArray val:", excelVal)
            if excelVal != "" and excelVal != 0:
                vals = str(excelVal).split("|")
                if len(vals) > 0:
                    for val in vals:
                        if val == "" or val == 0:
                            continue
                        changeToMap = {}
                        if str(val).find("，") != -1:
                            mapVals = str(val).split("，")
                        else:
                            mapVals = str(val).split(",")
                        if len(mapVals) > 0:
                            for mapVal in mapVals:
                                if not mapVal or str(mapVal).strip() == "":
                                    continue
                                keyVal = str(mapVal).strip().split("#")
                                if len(keyVal) != 2:
                                    print("val:", mapVal, keyVal)
                                    raise Exception(
                                        "excel error fomat please to check!"
                                    )
                                changeToMap[keyVal[0].strip()] = keyVal[1].strip()
                            changeToArray.append(changeToMap)
            tsVal = changeToArray
        elif excelType == "intsArray":
            changeToArray = []
            print("intsArray val:", excelVal)
            if excelVal != "" and excelVal != 0:
                vals = str(excelVal).split("|")
                if len(vals) > 0:
                    for val in vals:
                        if val == "" or val == 0:
                            continue
                        changeToIntArray = []
                        if str(val).find("，") != -1:
                            intVals = str(val).split("，")
                        else:
                            intVals = str(val).split(",")
                        if len(intVals) > 0:
                            for intVal in intVals:
                                if intVal != "" and str(intVal).strip() != "":
                                    keyVal = int(intVal)
                                    changeToIntArray.append(keyVal)
                        changeToArray.append(changeToIntArray)
            tsVal = changeToArray
        elif excelType == "dateTime":
            excelVal = str(excelVal).strip()
            if excelVal != "" and excelVal != 0:
                datetime_format = "%Y-%m-%dT%H:%M:%S"
                datetime_obj = datetime.strptime(excelVal, datetime_format)
                # 将datetime对象转换为时间戳
                timestamp = int(datetime_obj.timestamp())
                tsVal = timestamp
            else:
                tsVal = 0
    except TypeError as e:
        print("except:", e, excelType, excelVal)

    return tsVal


# excel值转化为ts类型值
def changeExcelRowValsToTs(typeRow, rowData, exportRow, nameRow):
    tsRowData = [None] * len(typeRow)
    exportIdx = 0
    for idx, excelType in enumerate(typeRow):
        # print("excelType:", excelType, exportRow[idx])
        if nameRow[idx] == "":
            # print("表头字段名称列为空，结束读取", exportRow[idx])
            break
        if int(exportRow[idx]) == 0 or int(exportRow[idx]) == 2:
            tsRowData[exportIdx] = changeExcelRowValToTsValue(excelType, rowData[idx])
            exportIdx += 1

    return json.dumps(tsRowData, ensure_ascii=False)


# 声明格式如下
# declare type Weapon = {
# 	/**
# 	 * 武器类型
# 	 */
# 	readonly weaponId: string;
# 	/**
# 	 * 发射频率
# 	 */
# 	readonly fireGap: number;
# };
def generalTsDeclare(sheetName, sheetData):
    print("general declare", sheetName)
    nameRow = sheetData[0]
    typeRow = sheetData[1]
    exportRow = sheetData[2]
    commentRow = sheetData[3]
    sheetNameDeclare = "readonly {sheet}: {{ readonly [id: {type}]: {sheet} }};"
    declareSheet = """
    declare type {sheet} = 
        {content};
    """

    delareClownName = """
        /**
        *  {comment}
        */
        readonly {name}: {type};"""

    contentStr = "{"
    for idx, name in enumerate(nameRow):
        print("name:", name)
        if name == "":
            break
        if int(exportRow[idx]) == 0 or int(exportRow[idx]) == 2:
            tsType = excelRefTsType[(typeRow[idx])]
            contentStr += (
                delareClownName.format(name=name, comment=commentRow[idx], type=tsType)
                + "\n"
            )
    contentStr += "}"
    sheetDeclare = declareSheet.format(
        sheet=formatWordFirstToUp(sheetName), content=contentStr
    )
    sheetNameTypeDeclar = sheetNameDeclare.format(
        sheet=formatWordFirstToUp(sheetName), type=excelRefTsType[(typeRow[0])]
    )
    return sheetNameTypeDeclar, sheetDeclare


# 数据格式
# DataName: {
#     ["id_1"]: [id_1,"test","coomm"],
# }
# JSON 格式 必须是双引号 吐血
# {
#     "Itemchest": {
#         "chest_item_1": [
#             "chest_item_1",
#             "关卡初级经验箱子",
#             "[]"
#         ],
#     }
# }
def generalClientJson(sheetName, sheetData):

    nameRow = sheetData[0]
    typeRow = sheetData[1]
    exportRow = sheetData[2]
    jsonFormat = """
    "{className}":{{ {content} }}
    """
    
    print("generalClientJson:", sheetName,sheetData)
    # 从第5行开始为数据内容
    idx = 4
    sheetFormat = '"keys":{keys},"data":{{ {data} }}'
    allItemData = ""
    while idx < len(sheetData):
        itemFormat = '"{id}":{data},'
        if idx == len(sheetData) - 1 or sheetData[idx + 1][0] == "":
            itemFormat = '"{id}":{data}'
        # id 列没值了 停止读取
        if sheetData[idx][0] == "":
            idx += 1
            break
        allItemData += itemFormat.format(
            id=changeExcelRowValToTsValue(typeRow[0], sheetData[idx][0]),
            data=changeExcelRowValsToTs(typeRow, sheetData[idx], exportRow, nameRow),
        )
        idx += 1

    exportNames = []
    for idx, name in enumerate(nameRow):
        if name == "":
            break
        if int(exportRow[idx]) == 0 or int(exportRow[idx]) == 2:
            exportNames.append(name)

    contentStr = sheetFormat.format(
        keys=json.dumps(exportNames, ensure_ascii=False), data=allItemData
    )

    sheetJson = jsonFormat.format(
        className=formatWordFirstToUp(sheetName), content=contentStr
    )
    return sheetJson


# 将excel数据解析为json格式
def parseExcelToClientData(excelData):
    print('========parseExcelToClientData======1======',excelData)
    
    """
    excel数据格式 前N行代表含义：
    0、字段名称 id name ...
    1、字段类型 string int float intArray 格式如：1|2|3｜4  ,floatArray 格式如：1.0|2.0|3.0 , stringArray：格式如：“str1”|"str2"|"str3" json:标准的json格式
    2、导出类型 0 客户端服务器 1 仅服务器 2 仅客户端 3 都不导出
    3、字段含义描述 英雄id 英雄名称
    """
    excelTsDeclare = ""
    excelTsSheetNameDeclare = ""
    excelTsConfig = ""
    clientTsContent = "{"
    excelSheetNames = list(excelData.keys())  #  ['item']

    for sheetName in excelData:
        sheetData = excelData[sheetName]
        nameRow = sheetData[0]  #名称
        typeRow = sheetData[1]
        exportRow = sheetData[2]
        commentRow = sheetData[3]  #3、字段含义描述
        # id 列没值了不导出 则整个表不对客户端导出
        if exportRow[0] == 1:  
            continue
        if sheetName == excelSheetNames[len(excelSheetNames) - 1]:
            clientTsContent += generalClientJson(sheetName, sheetData)
        else:
            clientTsContent += generalClientJson(sheetName, sheetData) + ","

        sheetNameDeclare, sheetDataDeclare = generalTsDeclare(sheetName, sheetData)
        excelTsDeclare += sheetDataDeclare
        excelTsSheetNameDeclare += sheetNameDeclare + "\n"

    excelTsConfig = clientTsContent + "\n}"
    

    print('=========parseExcelToClientData=========3===============',excelTsSheetNameDeclare)
    print('=========parseExcelToClientData=========4===============',excelTsDeclare)
    print('=========parseExcelToClientData=========5===============',excelTsConfig)
    return excelTsSheetNameDeclare, excelTsDeclare, excelTsConfig


# 小游戏每个excel包含 sheet 方便通过sheet加载对应模块
def excportGameConfigJs(excelFileWithMd5, excel_root,excelsData):
    print("excportGameConfigJs")
    # excelNames = list(excelsData.keys())
    # 小游戏每个excel包含 sheet 方便通过sheet加载对应模块
    configJsTemp = """
    {{
    let gameGlobal;
    try {{
        if (GameGlobal) {{
            gameGlobal = GameGlobal;
        }}
    }} catch (e) {{}}
    try {{
        if (!gameGlobal) {{
            gameGlobal = window;
        }}
    }} catch (e) {{
        console.error('未能找到全局根对象！');
    }}
    gameGlobal.Config = {{}};
    gameGlobal.AllExcelSheets = {excelSheets};
    gameGlobal.configVersion = {svnVersion};
    }}
    """

    # excelIncludeSheetNames = ""
    # for excelName in excelNames:
    #     excelSheetsTemp = '"{excelName}_cfg":{sheetNames}'
    #     allSheetNameStr = "["
    #     excelSheetNames = list(excelsData[excelName].keys())
    #     for sheetName in excelSheetNames:
    #         allSheetNameStr += '"' + formatWordFirstToUp(sheetName) + '"'
    #         if sheetName != excelSheetNames[len(excelSheetNames) - 1]:
    #             allSheetNameStr += ","
    #     allSheetNameStr += "]"
    #     print("allSheetNameStr", allSheetNameStr)
    #     excelIncludeSheetNames += (
    #         excelSheetsTemp.format(excelName=excelName, sheetNames=allSheetNameStr)
    #         + ","
    #     )
    # excelMd5NameStr = ""
    # for excelName in excelFileWithMd5:
    #     excelFileMd5 = excelFileWithMd5[excelName]
    #     excelMd5NameStr += excelName + ":" + excelFileMd5


    excelMd5Str = json.dumps(excelFileWithMd5)
    
    
    # repo = svn.remote.RemoteClient(excel_root)
    
    # info = repo.info()
    # svnversion = info["commit_revision"]s
    # print("svnversion:", svnversion)
    return configJsTemp.format(excelSheets=excelMd5Str, svnVersion='1000')


# 将首字母变为大写 其他保持不变
def formatWordFirstToUp(name):
    return name[0].upper() + name[1:]

# 项目根目录  excel data    excel的根目录
def exportClientData(clientCfgPath, excelsData, excel_root):
    print("====exportClientData=========start===========", clientCfgPath)

    excelNames = list(excelsData.keys())
    clientConfigTsDeclare = ""
    clientConfigSheetTsDeclare = ""

    clientTsDeclareTemp = """
    {excelsDeclare}
    declare const Config: {{
        {excelsSheetTypeDeclare}
    }};
    declare const AllExcelSheets: {{}};
    """

    #先删除config目录
    utils.rmDir( os.path.join(
        clientCfgPath, "assets","config"
    ))
    excelNameWithMd5 = {}
    for excelName in excelNames:
        # 解析为声明文件
        excelNameTsDeclare, excelTsDeclare, excelTsConfig = parseExcelToClientData(
            excelsData[excelName]
        )
        clientConfigSheetTsDeclare += excelNameTsDeclare
        clientConfigTsDeclare += excelTsDeclare


        # 项目中的路径
        projectConfigPath = os.path.join(
            clientCfgPath,"assets","config", excelName + ".json",
        )
        print("projectConfigPath", projectConfigPath)
        # tempConfigPath = "config/" + excelName + ".json"
        # 解析为json

        # 改为读取服务器配置信息，此处不再导出配置文件信息 (暂时还在本地)
        utils.writeToFile(
            projectConfigPath,
            excelTsConfig,
        )
        excelMd5Name = utils.getFileMd5(projectConfigPath)

        # 客户端将功能前缀一致的表合并，减少下载文件数量
        funcExcelName = excelName.split("_")
        combineExcelName = excelName  # funcExcelName[0]
        # TODO 待服务器修改
        excelNameWithMd5[excelName + "_cfg"] = utils.md5_16(
            utils.md5_16(combineExcelName)
        )
        # excelMd5Name

        # # 压缩文件
        # projectConfigZipPath = os.path.join(
        #     clientCfgPath,
        #     "/assets/config/" + excelMd5Name + ".zip",
        # )
        # utils.zipFile(projectConfigPath, projectConfigZipPath)

    clientDeclare = clientTsDeclareTemp.format(
        excelsDeclare=clientConfigTsDeclare,
        excelsSheetTypeDeclare=clientConfigSheetTsDeclare,
    )
    # 输出声明文件
    utils.writeToFile(
        os.path.join(clientCfgPath, "config.d.ts"),
        clientDeclare,
    )

    # 小游戏每个excel包含 sheet 方便通过sheet加载对应模块
    

    clientConfigJs = excportGameConfigJs(excelNameWithMd5, excel_root,excelsData)
    utils.writeToFile(
        os.path.join(
            clientCfgPath,'assets','loading','config.js'
        ),
        clientConfigJs,
    )
    
    print('=====导出成功======')
