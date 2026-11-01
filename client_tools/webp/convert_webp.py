from webptools import cwebp
import os, sys
from pathlib import Path


# pass input_image(.jpeg,.pnp .....) path ,
# output_image(give path where to save and image file name with .webp file type extension)
# print(cwebp(input_image="xxnq.png", output_image="xxnq.webp",
#             option="-q 90", logging="-v"))


#!/usr/bin/env python
# -*- coding: UTF-8 -*-


colorRed = "\033[31m"
colorEnd = "\033[0m"



def run(resDir, targetDir, quality=90,suffix=[".png", ".jpg"], skipDirs=None):
    if '.png' in suffix:
        allPngFiles, targetWebpFiles = get_convert_files(resDir, targetDir, '.png', skipdirs=skipDirs)

        print("【开始转换 png 为webp】 " + str(len(allPngFiles)) + "个文件，请耐心等待...")

        preSize = getFilesSize(allPngFiles)

        for source, target in zip(allPngFiles,targetWebpFiles):
            convert_webp(source, target, quality=quality)

        afterSize = getFilesSize(targetWebpFiles)

        bl = round(afterSize * 100 / preSize)
        print(
            "【png转换为webp完毕】"
            + str(round(preSize / 1024 / 1024, 2))
            + "M -> "
            + str(round(afterSize / 1024 / 1024, 2))
            + "M ,压缩率:"
            + colorRed
            + str(bl)
            + "%"
            + colorEnd
        )

    if '.jpg' in suffix:
        allJpgFiles, targetWebpFiles = get_convert_files(resDir, targetDir, '.jpg', skipdirs=skipDirs)

        print("【开始转换 jpg 为webp】 " + str(len(allJpgFiles)) + "个文件，请耐心等待...")

        preSize = getFilesSize(allJpgFiles)

        for source, target in zip(allJpgFiles,targetWebpFiles):
            convert_webp(source, target, quality=quality)

        afterSize = getFilesSize(targetWebpFiles)

        bl = round(afterSize * 100 / preSize)
        print(
            "【jpg转换为webp完毕】"
            + str(round(preSize / 1024 / 1024, 2))
            + "M -> "
            + str(round(afterSize / 1024 / 1024, 2))
            + "M ,压缩率:"
            + colorRed
            + str(bl)
            + "%"
            + colorEnd
        )





def getFilesSize(files):
    # print("files:", files)
    size = 0
    for file in files:
        if file != "":
            size = size + os.path.getsize(file)
    if size == 0:
        size = 1
    return size


def get_convert_files(source_folder, target_folder, suffix=".png", skipdirs=None):
    source_files = []
    target_files = []
    if skipdirs is None:
        skipdirs = []

    # 遍历源文件夹中的所有文件和目录
    for subdir, dirs, files in os.walk(source_folder):
        # 检查当前目录是否在skipdirs列表中
        print(subdir, dirs, files)
        if any(skipdir in subdir for skipdir in skipdirs):
            continue

        for file in files:
            # 检查文件扩展名是否为.png
            if (
                isinstance(suffix, str)
                and file.lower().endswith(suffix)
                or isinstance(suffix, list)
                and file.lower().endswith(tuple(suffix))
                or suffix is None
            ):
                # 获取源文件的完整路径
                source_file_path = os.path.join(subdir, file)
                # 构建目标文件路径
                relative_path = os.path.relpath(subdir, source_folder)
                target_dir_path = os.path.join(target_folder, relative_path)
                # 如果目标目录不存在，则创建它
                if not os.path.exists(target_dir_path):
                    os.makedirs(target_dir_path)
                # 设置目标文件的完整路径，将扩展名改为.webp
                target_file_path = os.path.join(target_dir_path, file[:-4] + ".webp")

                # # 调用convert_webp函数进行转换
                # convert_webp(source_file_path, target_file_path)
                source_files.append(source_file_path)
                target_files.append(target_file_path)

    return source_files, target_files

def convert_webp(input_image, output_image, quality=90, logging="-v"): #logging="-v"
    print(cwebp(input_image=input_image, output_image=output_image,
            option=f"-q {quality}", logging=logging))




# python3 convert_webp.py /Users/hxjs/Desktop/hxjs/inner/arts/npc /Users/hxjs/Desktop/hxjs/output/inner/arts/npc
if __name__ == "__main__":
    if len(sys.argv) == 3:
        # 指定相对路径
        print("start convert png to webp")
        run(sys.argv[1], sys.argv[2])
