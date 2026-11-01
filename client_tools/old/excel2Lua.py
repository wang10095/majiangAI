#!/usr/bin/env python
# coding=utf-8

import xlrd
import os.path
import sys
import re
reload(sys)
sys.setdefaultencoding('utf-8')
	
# local old_keys 	= #KEYS#
# --generate from #EXCEL# by python


def readString(path):
    if(not os.path.exists(path)):
        return "";
    f = open(path,"rb");
    r = f.read();
    f.close();
    return r;

def writeString(path,content):
    f = open(path,"wb");
    f.write(content);
    f.close();



# """
# local name = "#NAME#" 
# local keys = #KEYS#
# local types = #TYPES#
# local data = #DATA#
# 
# 
# return ConfigProto.extends(keys,data);
# """

#将被忽略的列
SKIP_COL_NAMES = ("辅助列", "deleted", "")

def correctValue(v):
	t = type(v)
	if t == float:
		if v == int(v):
			v = int(v)
	return v
	
def getExcelData(filename, headRow, typeRow, startRow, keys):
	#print(filename, mainKey, secondKey, startRow)
	if not os.path.isfile(filename):
		raise NameError, "%s is	not	a valid	filename" % (filename)
	book = xlrd.open_workbook(filename)
	colNames = []
	keyIndexs = [] #keys对应列
	invalidCols = {}
	newcolNames = [];
	types = [];
	
	sheet = book.sheets()[0]
	if sheet.nrows < startRow + 1:
		print "没有数据"
		return False
	
	#初始化 keyIdx和luaId
	for cidx in xrange(sheet.ncols):
		colName = sheet.cell_value(headRow, cidx)
		if colName in SKIP_COL_NAMES:
			invalidCols[cidx] = True
		else:
			colNames.append(colName)
			types.append(sheet.cell_value(typeRow, cidx).lower())		
	
	for keyName in keys:
		idx = colNames.index(keyName)
		if idx == None:
			print "error. key not in col names"
			sys.exit()
		keyIndexs.append(idx)
	
	assert(len(keyIndexs) > 0)
	
	allRows = []
	for ridx in xrange(startRow, sheet.nrows):
		#print "ridx", ridx
		
		rowData = []
		allRows.append(rowData)

		for cidx in xrange(sheet.ncols):
			if invalidCols.has_key(cidx):
				continue
			data = sheet.cell_value(ridx, cidx)
			rowData.append(data)
		
		#if ridx > 5:
		#	break	
		
	temp = allRows
	allRows = {}
# 	print "key indexs:", keyIndexs
# 	print "row data count:", len(temp)
	
	for rowData in temp:
		keyName = None
		if len(keyIndexs) == 1:
			keyName = correctValue(rowData[keyIndexs[0]])
		else:
			for col in keyIndexs:
				colValue = str( correctValue(rowData[col]) )
				if keyName == None:
					keyName = colValue
				else:
					keyName = keyName + "_" + colValue
		
		if allRows.has_key(keyName):
			print "dumplicate key:" + keyName
			sys.exit(1)
		allRows[keyName] = rowData
		
	return (allRows, colNames, types)
	
#"{1:ab3,2:cd,ef3:122}"
def decodeObjStr(s):
	obj = {}
	queue = []
	
	s = re.sub('[}{]', '', s)
	arr = s.split(',')
	for group in arr:
		if ":" in group:
			pair = group.split(':')
			key = pair[0]
			value = pair[1]

			if not re.match("[a-zA-Z]", key):
				key = int(key)
			if not re.match("[a-zA-Z]", value):
				value = int(value)
			obj[key] = value;
		else:
			if not re.match("[a-zA-Z]", group):
				group = int(group)
			queue.append(group);
	return len(queue)>0 and queue or obj;
	
def desKey(key):
	t = type(key)
	if t == str or t == unicode:
		return "\"" + key + "\""
	elif t == float:
		if int(key) == key:
			return int(key)
	elif t == int:
		return key
	return "%s %s" % (key,t)
	
def desItem(item, depth):
	t = type(item)
		
	if t == str or t == unicode:
		if item == "":
			return "nil"
			
		if item == "[SPACE]":
			return "\"\""
		
		if item[0] == '{' and item[-1] == '}' and not re.search(r'\{\w+\}',item):
			if len(item) > 2:
				#print decodeObjStr(item)
				return desItem( decodeObjStr(item), depth )
			else:
				return item #desItem(json.loads(item), depth)
		if item == "true" or item == "false":
			return item
		return "\"" + item.replace('\n','\\n').replace('"','\\"').replace("\q",'\\"') + "\""
	elif t == dict:
		items = item.items()
		items.sort() 
		if(depth == 1):
			s = "{\n"
			for (k, v) in items:
				s += "%s[%s] = %s,\n" % ('\t'*depth, desKey(k), desItem(v, depth + 1))
			s += "%s}" % ('\t'*(depth - 1))
		else:
			s ="{"+ ",".join(["[%s]=%s" % (desKey(k),desItem(v, depth + 1)) for k,v in items])+"}";
		return s
	elif t == list:
		return "{"+",".join([desItem(v, depth + 1) for v in item])+"}"
	elif t == int:
		return str(item)
	elif t == float:
		if item == int(item):
			return str(int(item))
		return str(item)
	else:
		print "error type"
		print item
		exit()

def write2File(colNames, types, allRows, xlsname, luaname):
	s = LUA_TEMPLATE
	map = {"keys":desItem(colNames, 1),
			"data":desItem(allRows, 1),
			"types":desItem(types, 1),
			"name":os.path.basename(luaname).split(".")[0]}
	s = re.sub("\{(\w+)\}", lambda a:map[a.group(1)],s)
# 	
# 	s = s.format(map);
	
	(path,name) = os.path.split(luaname);
	luaname = os.path.join(path,str(name));
	outfp = open(luaname, 'w')
	outfp.write(s)
	
if __name__ == "__main__":
	work_dir = os.path.dirname(sys.argv[0]);
	LUA_TEMPLATE = readString(os.path.join(work_dir,"lua.template"));
# 	print LUA_TEMPLATE;
# 	sys.exit();
	if len(sys.argv) < 5:
		print """args error. 
		arg1:input xls file name
		arg2:output lua file name
		arg3:head row(starts from 0)
		arg3:type row(starts from 0)
		arg4:start row(starts from 0)
		arg5:main key
		arg6:second key
		arg6:third key ...
		...
		"""
	else:
		xlsName = sys.argv[1]
		luaName = sys.argv[2]
		typeRow = int(sys.argv[3])
		headRow = int(sys.argv[4])
		startRow = int(sys.argv[5])
		
		keys = []
		for i in xrange(6, len(sys.argv)):
			keys.append(sys.argv[i])
		
		if not luaName.endswith(".lua"):
			luaName += ".lua"
	
		(allRows, colNames,types) = getExcelData(xlsName, headRow, typeRow, startRow, keys)
		#加入排序 @terran
		#sortindex = [newcolNames.index(name) for name in sorted(newcolNames)];
		#newcolNames = [newcolNames[v] for v in sortindex];
		#colNames = [colNames[v] for v in sortindex];
		#allRows = dict([(key,[allRows[key][v] for v in sortindex]) for key in allRows]);
		
		write2File(colNames, types,allRows, os.path.split(xlsName)[1], luaName)
		print "%s >>> %s" %(os.path.split(xlsName)[1],os.path.split(luaName)[1]);
		