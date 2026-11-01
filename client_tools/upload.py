import os
import platform
import shutil
from string import Template

ACCESS_KEY_ID = "REMOVED_ACCESS_KEY_ID"
ACCESS_KEY_SECRET = "REMOVED_ACCESS_KEY_SECRET"
ENDPOINT = "https://oss-cn-beijing.aliyuncs.com"
BUCKET_NAME_PROJ = "oss://lndb-file/mmxz/"


def upload_files(input, targetPath, rmTargetFoler=True, rmInputFolder=True):
    print("input:", input)
    BUCKET_DIST = BUCKET_NAME_PROJ + targetPath
    if rmTargetFoler:
        print("rm bucket", BUCKET_DIST)
        rm_command_template = Template(
            "ossutil rm $BUCKET_DIST -f -r -e $ENDPOINT -i $ACCESS_KEY_ID -k $ACCESS_KEY_SECRET "
        )
        os.system(
            rm_command_template.substitute(
                ENDPOINT=ENDPOINT,
                ACCESS_KEY_ID=ACCESS_KEY_ID,
                ACCESS_KEY_SECRET=ACCESS_KEY_SECRET,
                BUCKET_DIST=BUCKET_DIST,
            )
        )

    command_template = Template(
        "ossutil cp -r $INPUT $BUCKET_DIST -e $ENDPOINT -i $ACCESS_KEY_ID -k $ACCESS_KEY_SECRET -f"
    )
    command = command_template.substitute(
        ENDPOINT=ENDPOINT,
        ACCESS_KEY_ID=ACCESS_KEY_ID,
        ACCESS_KEY_SECRET=ACCESS_KEY_SECRET,
        INPUT=input,
        BUCKET_DIST=BUCKET_DIST,
    )
    print("cmd:", command)
    os.system(command)
    if rmInputFolder:
        try:
            shutil.rmtree(input)
        except Exception as e:
            print("rm error:", e)


def download_file(targetPath, input):
    print("down file:", input)
    BUCKET_DIST = BUCKET_NAME_PROJ + targetPath
    command_template = Template(
        "ossutil cp $BUCKET_DIST $INPUT -e $ENDPOINT -i $ACCESS_KEY_ID -k $ACCESS_KEY_SECRET -f"
    )
    command = command_template.substitute(
        ENDPOINT=ENDPOINT,
        ACCESS_KEY_ID=ACCESS_KEY_ID,
        ACCESS_KEY_SECRET=ACCESS_KEY_SECRET,
        INPUT=input,
        BUCKET_DIST=BUCKET_DIST,
    )
    print("cmd:", command)
    os.system(command)


# if __name__ == "__main__":
#     upload_files("./txt2.txt")
