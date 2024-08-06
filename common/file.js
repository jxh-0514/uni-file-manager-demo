/**
 * 使用示例
 * 
    //删除方法
    getDirEntryAsync('_doc/1').then((res)=>{
        removeFile(res,'222.txt');
    })
 */
/**
 * 获取文件,文件不存在会自动创建()
 * @param {Object} fileName 可以是文件名，也可以是/路径/文件名
 * @param {Object} dirEntry 文件对象,可以为空
 * @return 文件Entry
 */
export async function getFileEntryAsync(fileName, dirEntry) {
	// console.log("[getFileEntryAsync]开始执行")
	return new Promise((resolve) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			// console.log("[getFileEntryAsync]fileName is :" + fileName)
			let entry = dirEntry || fs.root
			entry.getFile(
				fileName,
				{ create: true },
				function (fileEntry) {
					// console.log("[getFileEntryAsync] 执行完成")
					resolve(fileEntry)
				},
				function (ex) {
					console.log(ex)
				}
			)
		})
	})
}

/**
 * 获取文件夹，不存在会自动创建
 * @param {Object} dirName
 */
export async function getDirEntryAsync(dirName) {
	return new Promise(async (resolve) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			fs.root.getDirectory(
				dirName,
				{
					create: true,
				},
				function (dirEntry) {
					resolve(dirEntry)
				}
			)
		})
	})
}

/**
 * 获取通过fileEntry获取file，不存在会自动创建
 * @param {Object} fileName
 * @param {Object} dirEntry
 */
export async function getFileAsync(fileName, dirEntry) {
	// console.log("[getFileAsync]")
	return new Promise(async (resolve) => {
		let fileEntry = await getFileEntryAsync(fileName, dirEntry)
		fileEntry.file(function (file) {
			resolve(file)
		})
	})
}

/**
 * 读取文件中的内容
 * @param {Object} path
 * @param {Object} dirEntry
 */
export async function getFileContextAsync(path, dirEntry) {
	let deffered
	let fileReader = new plus.io.FileReader()
	fileReader.onloadend = function (evt) {
		deffered(evt.target)
	}
	let file = await getFileAsync(path, dirEntry)
	fileReader.readAsText(file, "utf-8")
	return new Promise((resolve) => {
		deffered = resolve
	})
}

/**
 * 向文件中写入数据
 * @param {Object} path 要写入数据的文件的位置
 * @param {Object} fileContext 要写入的内容
 * @param {Object} dirEntry 文件夹，可不写使用默认
 */
export async function writeContextToFileAsync(path, fileContext, dirEntry) {
	let fileEntry = await getFileEntryAsync(path)
	let file = await getFileAsync(path)
	return new Promise((resolve) => {
		fileEntry.createWriter(async (writer) => {
			// 写入文件成功完成的回调函数
			writer.onwrite = (e) => {
				console.log("写入数据成功")
				resolve()
			}
			// 写入数据
			writer.write(fileContext)
		})
	})
}

/**
 * 追加写入数据
 * @param {Object} path 要写入数据的文件的位置
 * @param {Object} fileContext 要写入的内容
 * @param {Object} dirEntry 文件夹，可不写使用默认
 */
export async function AddOnWrite(path, fileContext, dirEntry) {
	let data = await getFileContextAsync(path, dirEntry)
	let fileEntry = await getFileEntryAsync(path)
	let file = await getFileAsync(path)
	return new Promise((resolve) => {
		fileEntry.createWriter(async (writer) => {
			// 写入文件成功完成的回调函数
			writer.onwrite = (e) => {
				console.log("写入数据成功")
				resolve(true)
			}
			// 写入数据
			writer.write(data.result + fileContext)
		})
	})
}

/**
 * 判断文件是否存在
 * @param {Object} fileName
 * @param {Object} dirEntry
 */
export async function existFileAsync(fileName, dirEntry) {
	return new Promise((resolve) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			let entry = dirEntry || fs.root
			let directoryReader = entry.createReader()
			directoryReader.readEntries(function (entries) {
				let isExist = entries.some((entry) => entry.name === fileName)
				resolve(isExist)
			})
		})
	})
}

/**
 * 遍历dirEntry，只遍历当前目录,深层次的目录暂不考虑
 * @param {Object} dirEntry 目录名,若是为空则为应用沙盒目录
 */
export async function iterateDirectory(dirEntry) {
	if (dirEntry) {
		var dir = await getDirEntryAsync(dirEntry)
	}
	return new Promise((resolve) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			let entry = dir || fs.root
			let directoryReader = entry.createReader()
			directoryReader.readEntries(
				function (entries) {
					// entries.forEach((item, idx, arr)=>{
					// 	if(idx===0) console.log("---------------"+entry.name+"目录-----------------");
					// 	console.log(idx+1, item.name);
					// 	if(idx===arr.length-1) console.log("---------------end-----------------");
					// })
					resolve(entries)
				},
				function (e) {
					console.log("Read entries failed: " + e.message)
				}
			)
		})
	})
}

//fileName 目录路径 dirEntry之前打开过的目录(没有则不填写)
function getFileEntry(fileName, dirEntry) {
	return new Promise((resolve, reject) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			let entry = dirEntry || fs.root
			entry.getFile(
				fileName,
				{
					create: true,
				},
				function (fileEntry) {
					resolve(fileEntry)
				},
				function (e) {
					reject(e)
				}
			)
		})
	})
}
// 创建或打开目录
function getDirEntry(dirName) {
	return new Promise(async (resolve) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function (fs) {
			fs.root.getDirectory(
				dirName,
				{
					create: true,
				},
				function (dirEntry) {
					resolve(dirEntry)
				}
			)
		})
	})
}
// 获取文件数据对象fileName文件名路径dirEntry文件见路径（可以不填）
function getFile(fileName, dirEntry) {
	return new Promise((resolve, reject) => {
		getFileEntry(fileName, dirEntry).then((fileEntry) => {
			fileEntry.file(
				function (file) {
					file.close()
					resolve(file)
				},
				function (e) {
					file.close()
					reject("失败")
				}
			)
		})
	})
}
// 获取文件内容 path文件路径 文件夹路径(可为空)
async function getFileContext(path, dirEntry) {
	let deffered
	let fileReader = new plus.io.FileReader()
	fileReader.onloadend = function (evt) {
		deffered(evt.target)
	}
	let file = await getFile(path, dirEntry)
	fileReader.readAsText(file, "utf-8")
	return new Promise((resolve) => {
		deffered = resolve
	})
}
// 读取目录下所有文件
function getDirList(fileNamePath) {
	return new Promise((resolve, reject) => {
		let arr = []
		plus.io.resolveLocalFileSystemURL(
			fileNamePath,
			function (entry) {
				var directoryReader = entry.createReader()
				directoryReader.readEntries(
					function (entries) {
						for (var i = 0; i < entries.length; i++) {
							// console.log("文件信息",entries[i].name);
							arr.push(entries[i].name)
						}
						// console.log(arr);
						resolve(arr)
						// console.log(JSON.person(entries))
					},
					function (e) {
						console.log("访问目录失败")
						reject(e)
					}
				)
			},
			function (e) {
				console.log("访问指定目录失败")
				reject(e)
			}
		)
	})
}
// 删除文件
function removeFlie(fliePath) {
	return new Promise((resolve, reject) => {
		plus.io.resolveLocalFileSystemURL(
			fliePath,
			function (entry) {
				entry.remove(
					function (entry) {
						resolve(true)
					},
					function (e) {
						console.log("删除失败", e)
						reject(false)
					}
				)
			},
			function (e) {
				console.log("访问路径失败")
				reject(false)
			}
		)
	})
}
