#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import os, sys
from PIL import Image

sys.path.append("..")
import utils
from pathlib import Path
from string import Template
import json

# 指定Spine JSON文件的路径
file_path = "/Users/hxjs/Desktop/hxjs/workspacek/client_tools/parse_spine/girl.json"

# 解析Spine JSON文件
skin_names = []
# 解析Spine 的slots名称
slot_names = []
# 新增加的皮肤文件夹
new_add_slot_names = set()
# 读取文件夹
skin_folder_set = set()
# 新增加的皮肤文件夹
new_add_skin_folder_set = set()


# 函数用于读取和解析 JSON 文件
def parse_spine_get_skins(file_path):
    global slot_names
    global skin_names
    try:
        # 打开并读取Spine JSON文件
        with open(file_path, "r", encoding="utf-8") as file:
            spine_data = json.load(file)

        # 提取皮肤信息
        skins = spine_data.get("skins", [])

        skin_names = []
        for skin in skins:
            print(f"- {skin.get('name')}")
            skin_names.append(skin.get("name"))
        slots = spine_data.get("slots", [])
        slot_names = []
        for slot in slots:
            slot_names.append(slot.get("name"))
        print("spine skins:", skin_names)
        print("spine slots:", slot_names)
        return skin_names
    except FileNotFoundError:
        print(f"The file '{file_path}' was not found.")
    except json.JSONDecodeError:
        print(f"The file '{file_path}' is not a valid JSON file.")
    except Exception as e:
        print(f"An error occurred: {e}")


# 新增的皮肤写入到spine
def write_spine_get_skins(file_path, newSkins, newAddSlots):
    try:
        # 打开并读取Spine JSON文件
        with open(file_path, "r", encoding="utf-8") as file:
            spine_data = json.load(file)
        # 提取皮肤信息
        skins = spine_data.get("skins", [])
        for skin in newSkins:
            skins.append(skin)
        slots = spine_data.get("slots", [])
        for slot in newAddSlots:
            if slot not in slots:
                slots.append(slot)
        utils.writeToFile(file_path, json.dumps(spine_data, indent=4))
    except FileNotFoundError:
        print(f"The file '{file_path}' was not found.")
    except json.JSONDecodeError:
        print(f"The file '{file_path}' is not a valid JSON file.")
    except Exception as e:
        print(f"An error occurred: {e}")


def list_files_by_depth(base_path):
    for dirpath, dirnames, filenames in os.walk(base_path):
        # 计算当前目录的深度，用于缩进
        depth = dirpath[len(base_path) :].count(os.sep)
        # 根据深度生成缩进字符串
        indent = " " * 2 * depth
        # 获取当前文件夹的名称
        basename = os.path.basename(dirpath)
        # 打印当前文件夹的缩进和名称
        # print("{}{}/".format(indent, basename))
        # 打印当前文件夹下的所有文件
        if basename.startswith("color_"):
            print("换肤色资源,需要生成新皮肤", basename)
            continue
        sub_indent = " " * 2 * (depth + 1)
        for filename in filenames:
            if filename.endswith(".png"):
                skin_name = dirpath.replace(base_path, "").replace("/" + basename, "")
                skin_name = skin_name.replace("\\" + basename, "")
                add_skin_name = basename + "/" + skin_name.replace("\\", "/")
                # print(
                #     "foderskinname:",
                #     basename,
                #     skin_name,
                #     add_skin_name,
                #     dirpath.replace(base_path, ""),
                #     dirpath.replace(base_path, "").replace("/" + basename, ""),
                #     dirpath.replace(base_path, "").replace("\\" + basename, ""),
                # )
                skin_folder_set.add(add_skin_name)
                # print("{}{}".format(sub_indent, basename + "/" + filename))


attachmentTemp = Template(
    '"skin_$part_name":{"skin_$part_name":{"name":"$file_name","x":0,"y":0,"rotation":0,"width":$file_width,"height":$file_height}},'
)
skinTemplate = Template('{"name":"$skin_name","attachments":{$attachments}}')
# {"name": "skin_abase_handr","bone": "bone_abase_handR","attachment": "skin_abase_handr" }
slotTemplate = Template(
    '{"name":"skin_$part_name","bone":"bone1","attachment":"skin_$part_name"}'
)

newAddSkins = []

newAddSlots = []


def parseNewSkinForderToSkinJson():
    global slot_names
    global new_add_slot_names
    for skin_name in new_add_skin_folder_set:
        part_and_skin = skin_name.split("/")
        skin_and_part = part_and_skin[1] + "/" + part_and_skin[0]
        skin_res_path = base_path + skin_and_part
        print("path:", skin_name, skin_and_part, skin_res_path)
        files = utils.getFileList(skin_res_path, "*.png")
        allAttachment = ""
        attachmentIdx = 1
        for file in files:
            # 打开图片文件
            with Image.open(file) as img:
                # 获取图片的宽和高
                width, height = img.size
                part_name = part_and_skin[0] + "_" + str(attachmentIdx)
                allAttachment += attachmentTemp.substitute(
                    {
                        "part_name": part_name,
                        "file_name": "skin"
                        + skin_and_part
                        + "/"
                        + Path(file).name.replace(".png", ""),
                        "file_width": width,
                        "file_height": height,
                    }
                )
                attachmentIdx += 1
                if part_name not in slot_names:
                    new_add_slot_names.add(part_name)
                print("allAttachment:", allAttachment)
        allAttachment = allAttachment[:-1]
        skinStr = skinTemplate.substitute(
            {
                "skin_name": skin_name.replace("/", ""),
                "part_name": part_and_skin[0],
                "attachments": allAttachment,
            }
        )
        print("skinStr:", skinStr)
        newAddSkins.append(json.loads(skinStr))
        # slotStr = ""
        for slotName in new_add_slot_names:
            slotStr = slotTemplate.substitute(
                {
                    "part_name": slotName,
                }
            )
            print("slotStr:", slotStr)
            newAddSlots.append(json.loads(slotStr))
        # slotStr = slotStr[:-1]
        print("newAddSlots:", newAddSlots)


# {"name":"hand_left/bbtmg","attachments":
# {"skin_youshoudongx":{"skin_youshoudongx":{"name":"bbtmg/hand_left/bbtmg","x":4.46,"y":-20.79,"rotation":46.51,"width":51,"height":37}}}},
# "slots": [ {"name": "skin_abase_handr","bone": "bone_abase_handR","attachment": "skin_abase_handr"}

# 程序目录
# python3 audo_add_skin.py /Users/hxjs/Desktop/skin/ /Users/hxjs/Desktop/girl.json
# python3 audo_add_skin.py /Users/hxjs/Desktop/hxjs/inner/arts/ART/4.0spine/petspine/skin /Users/hxjs/Desktop/hxjs/inner/arts/ART/4.0spine/petspine/pet.json
if __name__ == "__main__":
    n = len(sys.argv)
    if n < 3:
        print("Usage: python3 encrypt.py [dir]")
        exit(0)
    base_path = sys.argv[1]
    file_path = sys.argv[2]
    skin_names = parse_spine_get_skins(file_path)
    # 指定要遍历的目录路径
    list_files_by_depth(base_path)
    print("forder skins:", skin_folder_set)
    for skin_name in skin_folder_set:
        if skin_name not in skin_names:
            if skin_name.startswith("all/abase_"):
                continue
            print("new add folder skin:", skin_name)
            new_add_skin_folder_set.add(skin_name)
    parseNewSkinForderToSkinJson()
    write_spine_get_skins(file_path, newAddSkins, newAddSlots)
