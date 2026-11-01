# -*- coding:UTF-8 -*-
# 同步svn到git
import json
import os
import sys
import time
import shutil

sys.path.append("..")
import utils
import upload
from encrypt.encrypt_png import processEncryptFolder
from pngquant.compress_png import run


projectPath = "../../client_project/"
remoteTargetPath = ""
currentPath = ""


def generateMd5List(folder_path):
    # 确保提供的路径是一个目录
    if not os.path.isdir(folder_path):
        print("指定的路径不是一个有效的目录")
        return

    # 创建一个空字典来存储文件名和它们的 MD5 哈希值
    files_md5_dict = {}
    # 遍历指定文件夹
    for root, dirs, files in os.walk(folder_path):
        for name in files:
            # 获取文件的完整路径
            file_path = os.path.join(root, name)
            # 计算文件的 MD5 哈希值
            file_md5 = utils.getFileMd5(file_path)
            # 将文件路径和对应的 MD5 哈希值添加到字典中
            file_base_path = os.path.relpath(file_path, folder_path)
            files_md5_dict["res/" + file_base_path] = file_md5

    return files_md5_dict


def compaireVersionResAndLocalRes(versionResFile, localResMd5Dict):
    global remoteTargetPath
    global currentPath
    with open(versionResFile, "r") as file:
        content = file.read()
    # 将 JSON 字符串解析为 Python 字典
    md5_dict = json.loads(content)
    # 出包时候的资源md5
    version_md5_dict = md5_dict["files"]
    # 当前更新到版本的资源md5
    patch_md5_dict = {}
    if "patch_files" in md5_dict:
        patch_md5_dict = md5_dict["patch_files"]
    # 创建一个字典来存储匹配和不匹配的结果
    comparison_results = {"matched": [], "updated": [], "mismatched": [], "new_add": []}
    # 循环遍历md5_dict['files']
    for file_path in localResMd5Dict:
        # 检查在版本中是否存在
        if file_path in version_md5_dict:
            # 对比MD5哈希值
            if localResMd5Dict[file_path] == version_md5_dict[file_path]:
                comparison_results["matched"].append(file_path)
            else:
                if (
                    file_path in patch_md5_dict
                    and localResMd5Dict[file_path] == patch_md5_dict[file_path]
                ):
                    # 已经更新过
                    comparison_results["updated"].append(file_path)
                else:
                    # 发生变动
                    comparison_results["mismatched"].append(file_path)
                    patch_md5_dict[file_path] = localResMd5Dict[file_path]
        else:
            if file_path in patch_md5_dict:
                if localResMd5Dict[file_path] == patch_md5_dict[file_path]:
                    # 已经更新过
                    comparison_results["updated"].append(file_path)
                else:
                    # 发生变动
                    comparison_results["mismatched"].append(file_path)
                    patch_md5_dict[file_path] = localResMd5Dict[file_path]
            else:
                # 新增文件
                comparison_results["new_add"].append(file_path)
                patch_md5_dict[file_path] = localResMd5Dict[file_path]

    currentTime = time.strftime("%m%d%H%M", time.localtime())
    change_res_dict = {}
    for path in comparison_results["new_add"]:
        change_res_dict[path] = currentTime
    print("new add res file:", change_res_dict)
    for path in comparison_results["mismatched"]:
        change_res_dict[path] = currentTime
    # print("all change res file:", change_res_dict)
    resFileContent = json.dumps(
        {"files": version_md5_dict, "patch_files": patch_md5_dict}, indent=4
    )
    os.system("rm -fr %s" % versionResFile)
    with open(versionResFile, "w") as listf:
        listf.write(resFileContent)
    upload.upload_files(versionResFile, remoteTargetPath + "res.json")

    # 生成更新文件的路径
    update_file_path = "patch.json"
    localPatchJsonPath = os.path.join(currentPath, update_file_path)
    upload.download_file(remoteTargetPath + update_file_path, localPatchJsonPath)

    with open(localPatchJsonPath, "r") as file:
        patchContent = file.read()
    # 将 JSON 字符串解析为 Python 字典
    patch_md5_dict = json.loads(patchContent)
    # 出包时候的资源md5
    current_patch_md5_dict = patch_md5_dict["files"]
    for resPath in change_res_dict:
        current_patch_md5_dict[resPath] = change_res_dict[resPath]

    # 将字典转换为 JSON 字符串
    fileContent = json.dumps({"files": current_patch_md5_dict}, indent=4)
    # 将 JSON 字符串写入清单文件
    os.system("rm -fr %s" % update_file_path)
    with open(update_file_path, "w") as listf:
        listf.write(fileContent)

    print(f"更新文件已生成: {update_file_path}")
    return change_res_dict


# 更新版本资源 和当前版本的资源对比，更新的资源记录到patch.json
# python3 process_patch_res.py wechatgame 9.9.10
# svn revert -R .
# svn cleanup --remove-unversioned
if __name__ == "__main__":
    n = len(sys.argv)
    platformName = "wechatgame"
    version = "999.999.999"
    if n < 3:
        print("error args:need platform version")
        exit()
    platformName = sys.argv[1]
    version = sys.argv[2]

    currentPath = os.path.dirname(os.path.abspath(__file__))
    projectPath = os.path.abspath(os.path.join(currentPath, projectPath))

    versionResJsonFilePath = os.path.join(currentPath, "res.json")
    remoteTargetPath = platformName + "/" + version + "/"
    upload.download_file(remoteTargetPath + "res.json", versionResJsonFilePath)
    gameResFolder = projectPath + "/assets/res/"
    tempResFolder = os.path.abspath(os.path.join(projectPath, "../temp_res/"))
    utils.copyPathToFolder(
        gameResFolder,
        tempResFolder,
        excludePatterns=["abundle_res", "ui_spine", "test", "*.DS_Store", "*.meta"],
    )
    localResMd5List = generateMd5List(tempResFolder)
    # 对比本地和版本中的资源区别
    print("create patch.json")
    allChangeResDict = compaireVersionResAndLocalRes(
        versionResJsonFilePath, localResMd5List
    )
    print("create patch res file")
    patchResFolder = os.path.abspath(os.path.join(projectPath, "../patch_res/"))
    print("patchResFolder:", patchResFolder)
    utils.rmDir(patchResFolder)
    for changeFilePath in allChangeResDict:
        fileLastTime = allChangeResDict[changeFilePath]
        file_dir, file_name = os.path.split(changeFilePath)
        fileBaseName, fileExtName = os.path.splitext(file_name)
        fileNewPath = os.path.join(
            file_dir, fileBaseName + "@" + fileLastTime + fileExtName
        )
        if changeFilePath.startswith("res/"):
            changeFilePath = changeFilePath[4:]
        if fileNewPath.startswith("res/"):
            fileNewPath = fileNewPath[4:]
        # print(
        #     "old and new file:",
        #     tempResFolder + "/" + changeFilePath,
        #     patchResFolder + "/" + fileNewPath,
        # )
        utils.copyFileToOtherPath(
            tempResFolder + "/" + changeFilePath,
            patchResFolder + "/" + fileNewPath,
        )
    print("sys patch.json to version", version)
    # 同步更新文件到服务器
    patchResJsonFilePath = os.path.join(currentPath, "patch.json")
    upload.upload_files(patchResJsonFilePath, remoteTargetPath + "patch.json")
    # patch_res
    upload.upload_files(patchResFolder, remoteTargetPath + "patch_res/", False)
