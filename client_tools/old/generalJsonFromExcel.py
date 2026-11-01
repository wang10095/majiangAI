# -*- coding: utf-8 -*- 
import  xdrlib ,sys
import xlrd
import utils
import os
import string
import codecs
from collections import OrderedDict
import json
reload(sys) 
sys.setdefaultencoding('utf-8')

wb=0
def excel_table_byindex(file= 'file.xls',colnameindex=0,contentindex=1,by_index=0):
	global wb
	wb = xlrd.open_workbook(file)
	convert_list = []
	sh = wb.sheet_by_index(by_index)
	print "colnameindex",colnameindex
	title = sh.row_values(colnameindex)
	coltypes =  sh.row_values(int(colnameindex)+1) #类型数据 
	for rownum in range(contentindex, sh.nrows):
	    rowvalue = sh.row_values(rownum)
	    single = OrderedDict()
	    for colnum in range(0, len(rowvalue)):
	        print(title[colnum], rowvalue[colnum])
	        if coltypes[colnum] == "INT":
	        	if rowvalue[colnum]=="":
	        		single[title[colnum]] = 0
	        	else:
	        		single[title[colnum]] = int(rowvalue[colnum])
	        else:
	        	single[title[colnum]] = rowvalue[colnum]
	    convert_list.append(single)
	     
	j = json.dumps(convert_list)
	return j;


if __name__=="__main__":
    print sys.argv
    if len(sys.argv) < 3:
        os.exit(1);
    print sys.argv
    excelName = sys.argv[1] #excel表名
    colnameindex = int(sys.argv[2]) #表头名所在行号
    contentindex = int(sys.argv[3]) #表头所在行号
    excelIndex = 0
    if len(sys.argv)>4:
    	excelIndex = int(sys.argv[4]) #表所在下标
    j=excel_table_byindex(excelName,colnameindex,contentindex,excelIndex)
    global wb;
    sheetName = wb.sheet_names()[excelIndex]
    filepath,filename,extension = utils.getFileNameAndExtFromPath(excelName)
    with codecs.open(filepath+"/"+sheetName+'.json',"w","utf-8") as f:
    	f.write(j)



