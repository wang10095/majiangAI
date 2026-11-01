

# 移除插件脚本
import json
import os

# import utils


def addSubpackage(srcPath, subpackageName):
    setting_path = os.path.join(srcPath, 'game.json')

    if os.path.exists(setting_path):
        with open(setting_path, "r", encoding="utf-8") as file:
            jsonData = json.load(file)
            subpackages = []
            if "subpackages" in jsonData:
                subpackages = jsonData["subpackages"]
                subpackages.append({"name": subpackageName, "root": "subpackages/" + subpackageName+'/'})
                jsonData["subpackages"] = subpackages
                # 将修改后的数据写回文件
                with open(setting_path, "w", encoding="utf-8") as file:
                    json.dump(jsonData, file, indent=4, ensure_ascii=False)
                print(f"subpackages '{subpackageName}' added successfully.")
    else:
        print("Settings file not found.")

def moveJSToSubpackage(srcPath, subpackageName):
    # 遍历srcPath 把所有的js文件移动到subpackages下
    subPath= os.path.join(srcPath, 'subpackages', subpackageName)
    for root, dirs, files in os.walk(srcPath):
        if 'subpackages' in root or 'remote' in root:
            continue
        dir_path = os.path.join(subPath, os.path.relpath(root, srcPath))
        for file in files:
            if file.endswith(".js"):
                src = os.path.join(root, file)
                dst = os.path.join(dir_path, file)
                print(src, dst)
                os.makedirs(dir_path, exist_ok=True)
                os.rename(src, dst)
                print(f"Moved {file} to subpackage '{subpackageName}'.")

def removeEmptyFolder(srcPath):
    contents = os.listdir(srcPath)
    if not contents:
        os.rmdir(srcPath)
        print(f"Removed empty folder '{srcPath}'.")
        return
    for entry in contents:
        full_path = os.path.join(srcPath, entry)
        if os.path.isdir(full_path):
            removeEmptyFolder(full_path)
    if not os.listdir(srcPath):
        os.rmdir(srcPath)
        print(f"Removed empty folder '{srcPath}'.")
        return


def clear_root_dir(srcPath):
    os.rename(os.path.join(srcPath, 'first-screen.bjs'), os.path.join(srcPath, 'first-screen.js'))
    os.rename(os.path.join(srcPath, 'game.bjs'), os.path.join(srcPath, 'game.js'))
    os.remove(os.path.join(srcPath, 'logo.png'))
    os.remove(os.path.join(srcPath, 'slogan.png'))
    # 遍历srcPath 删掉所有空文件夹, 注意删除后可能产生新的空文件夹也要删除
    removeEmptyFolder(srcPath)

if __name__ == '__main__':
    # # 移除插件脚本
    addSubpackage('D:/game/client_build/wechatgame', 'engine')
    # # 移除插件脚本
    moveJSToSubpackage('D:/game/client_build/wechatgame', 'engine')
    # 清理根目录
    clear_root_dir('D:/game/client_build/wechatgame')