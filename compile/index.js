const fs = require("fs")
const path = require("path")
const sizeOf = require('image-size');
  
const root = path.join(__dirname, '../photo/')
const target = path.join(__dirname, '../data.json')
  
// readDirSync(root)
function readDirSync(dir) {
  const pa = fs.readdirSync(dir);
  pa.forEach(function(ele, index) {  
    const info = fs.statSync(dir + "/" + ele)
    if (info.isDirectory()) {
      console.log("dir: " + ele)  
      readDirSync(dir + "/" + ele);  
    } else {
      if (!ele.startsWith('.')) {
        console.log("file: "+ele)
      }
    }   
  })  
}



function readGalleries(root) {
  const result = []
  const f = fs.readdirSync(root);
  f.forEach(function(name, index) {
    const currentPath = root + "/" + name
    const info = fs.statSync(currentPath)
    if (info.isDirectory()) {
      result.push({
        date: name,
        data: readGallery(currentPath)
      })
    }
  })
  return result
}

function readGallery(galleryPath) {
  const f = fs.readdirSync(galleryPath);
  const data = {
    images: []
  }
  f.forEach(function(name, index) {
    const currentPath = galleryPath + "/" + name
    const info = fs.statSync(currentPath)
    let dimensions
    if (!info.isDirectory() && !name.startsWith('.')) {
      if (/.*(jpg|png|jpeg|gif)$/i.test(name)) {
        dimensions = sizeOf(currentPath);
        data.images.push({
          name,
          width: dimensions.width,
          height: dimensions.height
        })
      } else if (/.*(txt)$/i.test(name)) {
        const desc = fs.readFileSync(currentPath, 'utf-8').split('\n')
        data.title = desc.shift();
        data.detail = desc.join('\n')
      }
    }
  })
  return data
}

const result = readGalleries(root)
// console.info(JSON.stringify(result))
fs.writeFile(target, JSON.stringify(result), function(err) {
  if(err) {
      return console.log(err);
  }
  console.log("build successed!");
});