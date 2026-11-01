python generalJsonFromExcel.py "./config/starconfig.xlsx" 1 3 0
python generalJsonFromExcel.py "./config/starconfig.xlsx" 1 3 1
python generalJsonFromExcel.py "./config/starconfig.xlsx" 1 3 2
python generalJsonFromExcel.py "./config/starconfig.xlsx" 1 3 3
python generalJsonFromExcel.py "./config/starconfig.xlsx" 1 3 4

# json合并
python combineJsonFiles.py "chapters.json"  "levels.json"  "ballskin.json"  "penskin.json"  "themeskin.json" 


