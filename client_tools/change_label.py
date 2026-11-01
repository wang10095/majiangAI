import os
import json

CharLabelConfigUUID = '4bbe3AVf71F+5rNrKO3nqXW'
CharLabelUUID = 'fd887GeUiJLsYxAgpzuPVl2'

def modify_json_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.scene') or file.endswith('.prefab'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    print('reading:', file_path)
                    data = json.load(f)

                CharRichTextConfig_node_id = []
                modified_node_id = []
                for item in data:
                    if '__type__' in item and item['__type__'] == CharLabelConfigUUID and 'node' in item:
                        CharRichTextConfig_node_id.append(item['node']['__id__'])
                        break

                if len(CharRichTextConfig_node_id) > 0:
                    for item in data:
                        if '__type__' in item and item['__type__'] == 'cc.Label' and 'node' in item and item['node']['__id__'] in CharRichTextConfig_node_id:
                            item['__type__'] = CharLabelUUID
                            item['_cacheMode'] = 2
                            modified_node_id.append(item['node']['__id__'])
                if len(modified_node_id) > 0:
                    with open(file_path, 'w') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        print('Modified:', file_path, modified_node_id)


if __name__ == "__main__":
    # 指定目录路径
    directory_path = 'C:\\Projects\\cocos\\Test3\\assets'

    # 调用函数进行修改
    modify_json_files(directory_path)